#!/bin/bash
# ==============================================================================
# CLAUDIA v10.0 - Production Deployment Script
# ==============================================================================
# Multi-environment deployment with health checks and rollback support
#
# Usage:
#   ./scripts/deploy_production.sh [environment]
#
# Environments: dev, staging, production
# ==============================================================================

set -e  # Exit on error
set -u  # Exit on undefined variable

# ==============================================================================
# Configuration
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Default environment
ENVIRONMENT="${1:-production}"

# Project configuration
PROJECT_ID="claudia-i8bxh"
REGION="us-central1"
FUNCTION_NAME="claudia_handler"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==============================================================================
# Functions
# ==============================================================================

log_info() {
    echo -e "${BLUE}ℹ ${NC}$1"
}

log_success() {
    echo -e "${GREEN}✓ ${NC}$1"
}

log_warning() {
    echo -e "${YELLOW}⚠ ${NC}$1"
}

log_error() {
    echo -e "${RED}✗ ${NC}$1"
}

log_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

confirm() {
    read -p "$(echo -e ${YELLOW}$1 [y/N]: ${NC})" -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]]
}

# ==============================================================================
# Pre-deployment Checks
# ==============================================================================

pre_deployment_checks() {
    log_header "Pre-Deployment Checks"

    # Check if in correct directory
    log_info "Checking project directory..."
    if [ ! -f "main.py" ]; then
        log_error "main.py not found. Run from project root."
        exit 1
    fi
    log_success "Project directory OK"

    # Check Python version
    log_info "Checking Python version..."
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
    if [ "$PYTHON_VERSION" != "3.11" ]; then
        log_warning "Python version is $PYTHON_VERSION (recommended: 3.11)"
    else
        log_success "Python version OK ($PYTHON_VERSION)"
    fi

    # Check environment variables
    log_info "Checking environment variables..."
    if [ -z "${GEMINI_API_KEY:-}" ]; then
        log_error "GEMINI_API_KEY not set"
        exit 1
    fi
    if [ -z "${TELEGRAM_TOKEN:-}" ]; then
        log_error "TELEGRAM_TOKEN not set"
        exit 1
    fi
    log_success "Environment variables OK"

    # Check Google Cloud authentication
    log_info "Checking Google Cloud authentication..."
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
        log_error "Not authenticated with Google Cloud"
        log_info "Run: gcloud auth login"
        exit 1
    fi
    ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
    log_success "Authenticated as: $ACTIVE_ACCOUNT"

    # Check gcloud project
    log_info "Setting Google Cloud project..."
    gcloud config set project "$PROJECT_ID" --quiet
    log_success "Project set to: $PROJECT_ID"

    # Run tests
    log_info "Running tests..."
    if ! pytest --tb=short -q 2>&1 | tail -10; then
        log_warning "Some tests failed - review before deploying"
        if ! confirm "Continue with deployment anyway?"; then
            log_error "Deployment cancelled"
            exit 1
        fi
    else
        log_success "Tests passed"
    fi

    # Run security audit
    log_info "Running security audit..."
    if python scripts/security_audit.py > /dev/null 2>&1; then
        log_success "Security audit passed"
    else
        log_warning "Security audit found issues"
        if ! confirm "Continue with deployment?"; then
            log_error "Deployment cancelled"
            exit 1
        fi
    fi
}

# ==============================================================================
# Backup Current Deployment
# ==============================================================================

backup_deployment() {
    log_header "Creating Backup"

    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_DIR="$PROJECT_ROOT/backups"
    mkdir -p "$BACKUP_DIR"

    log_info "Backing up current deployment..."

    if gcloud functions describe "$FUNCTION_NAME" \
        --region="$REGION" \
        --gen2 \
        --format=json > "$BACKUP_DIR/function_${TIMESTAMP}.json" 2>/dev/null; then
        log_success "Backup created: $BACKUP_DIR/function_${TIMESTAMP}.json"
    else
        log_warning "No previous deployment to backup"
    fi

    # Backup current git commit
    CURRENT_COMMIT=$(git rev-parse HEAD)
    echo "$CURRENT_COMMIT" > "$BACKUP_DIR/commit_${TIMESTAMP}.txt"
    log_success "Current commit: $CURRENT_COMMIT"
}

# ==============================================================================
# Deploy to Cloud Functions
# ==============================================================================

deploy_functions() {
    log_header "Deploying Cloud Functions"

    # Set environment-specific configuration
    case "$ENVIRONMENT" in
        dev)
            MEMORY="256MB"
            TIMEOUT="60s"
            MAX_INSTANCES="10"
            MIN_INSTANCES="0"
            LOG_LEVEL="DEBUG"
            ;;
        staging)
            MEMORY="512MB"
            TIMEOUT="120s"
            MAX_INSTANCES="50"
            MIN_INSTANCES="1"
            LOG_LEVEL="INFO"
            ;;
        production)
            MEMORY="1GB"
            TIMEOUT="300s"
            MAX_INSTANCES="100"
            MIN_INSTANCES="2"
            LOG_LEVEL="WARNING"
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT"
            exit 1
            ;;
    esac

    log_info "Environment: $ENVIRONMENT"
    log_info "Memory: $MEMORY | Timeout: $TIMEOUT | Max Instances: $MAX_INSTANCES"

    if ! confirm "Deploy Cloud Functions with these settings?"; then
        log_error "Deployment cancelled"
        exit 1
    fi

    log_info "Deploying $FUNCTION_NAME..."
    echo "This may take several minutes..."

    if gcloud functions deploy "$FUNCTION_NAME" \
        --gen2 \
        --runtime python311 \
        --region "$REGION" \
        --source . \
        --entry-point claudia_handler \
        --trigger-http \
        --allow-unauthenticated \
        --set-env-vars "GEMINI_API_KEY=$GEMINI_API_KEY,TELEGRAM_TOKEN=$TELEGRAM_TOKEN,ENVIRONMENT=$ENVIRONMENT,LOGGING_LEVEL=$LOG_LEVEL,ENABLE_RATE_LIMITING=true,RATE_LIMIT_MAX_REQUESTS=5,RATE_LIMIT_WINDOW_SECONDS=60" \
        --memory "$MEMORY" \
        --timeout "$TIMEOUT" \
        --max-instances "$MAX_INSTANCES" \
        --min-instances "$MIN_INSTANCES"; then
        log_success "Cloud Function deployed successfully"
    else
        log_error "Cloud Function deployment failed"
        exit 1
    fi
}

# ==============================================================================
# Deploy to Firebase Hosting
# ==============================================================================

deploy_hosting() {
    log_header "Deploying Firebase Hosting"

    log_info "Deploying web app to Firebase Hosting..."

    if firebase deploy --only hosting --project "$PROJECT_ID"; then
        log_success "Firebase Hosting deployed successfully"
    else
        log_error "Firebase Hosting deployment failed"
        exit 1
    fi
}

# ==============================================================================
# Deploy Firestore Indexes
# ==============================================================================

deploy_firestore() {
    log_header "Deploying Firestore Configuration"

    log_info "Deploying Firestore indexes..."

    if firebase deploy --only firestore:indexes --project "$PROJECT_ID"; then
        log_success "Firestore indexes deployed"
    else
        log_warning "Firestore indexes deployment failed (non-critical)"
    fi

    log_info "Deploying Firestore rules..."

    if firebase deploy --only firestore:rules --project "$PROJECT_ID"; then
        log_success "Firestore rules deployed"
    else
        log_error "Firestore rules deployment failed"
        exit 1
    fi
}

# ==============================================================================
# Configure Telegram Webhook
# ==============================================================================

configure_telegram() {
    log_header "Configuring Telegram Webhook"

    # Get Cloud Function URL
    FUNCTION_URL=$(gcloud functions describe "$FUNCTION_NAME" \
        --region="$REGION" \
        --gen2 \
        --format='value(serviceConfig.uri)')

    log_info "Function URL: $FUNCTION_URL"

    if confirm "Configure Telegram webhook now?"; then
        log_info "Setting Telegram webhook..."

        WEBHOOK_RESPONSE=$(curl -s -X POST \
            "https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook" \
            -d "url=${FUNCTION_URL}" \
            -d "drop_pending_updates=true")

        if echo "$WEBHOOK_RESPONSE" | grep -q '"ok":true'; then
            log_success "Telegram webhook configured"
        else
            log_error "Telegram webhook configuration failed"
            echo "$WEBHOOK_RESPONSE"
        fi
    else
        log_info "Skipping Telegram webhook configuration"
        log_info "Configure manually with:"
        echo "  curl -X POST \"https://api.telegram.org/bot\${TELEGRAM_TOKEN}/setWebhook\" \\"
        echo "       -d \"url=$FUNCTION_URL\""
    fi
}

# ==============================================================================
# Post-Deployment Health Checks
# ==============================================================================

health_checks() {
    log_header "Post-Deployment Health Checks"

    FUNCTION_URL=$(gcloud functions describe "$FUNCTION_NAME" \
        --region="$REGION" \
        --gen2 \
        --format='value(serviceConfig.uri)')

    log_info "Running health check on: $FUNCTION_URL/health"

    sleep 5  # Wait for function to be ready

    HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$FUNCTION_URL/health" || echo "000")
    HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -1)
    RESPONSE_BODY=$(echo "$HEALTH_RESPONSE" | head -n -1)

    if [ "$HTTP_CODE" = "200" ]; then
        log_success "Health check passed (HTTP $HTTP_CODE)"
        echo "$RESPONSE_BODY" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE_BODY"
    else
        log_error "Health check failed (HTTP $HTTP_CODE)"
        echo "$RESPONSE_BODY"

        if confirm "Deployment health check failed. Rollback?"; then
            rollback_deployment
            exit 1
        fi
    fi

    # Check Firebase Hosting
    log_info "Checking Firebase Hosting..."
    HOSTING_URL="https://${PROJECT_ID}.web.app"
    HOSTING_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HOSTING_URL")

    if [ "$HOSTING_CODE" = "200" ]; then
        log_success "Firebase Hosting OK (HTTP $HOSTING_CODE)"
    else
        log_warning "Firebase Hosting check returned HTTP $HOSTING_CODE"
    fi
}

# ==============================================================================
# Rollback
# ==============================================================================

rollback_deployment() {
    log_header "Rolling Back Deployment"

    log_warning "Rollback initiated..."

    # Find latest backup
    LATEST_BACKUP=$(ls -t backups/function_*.json 2>/dev/null | head -1)

    if [ -z "$LATEST_BACKUP" ]; then
        log_error "No backup found to rollback to"
        exit 1
    fi

    log_info "Rolling back to: $LATEST_BACKUP"

    # Get previous commit
    LATEST_COMMIT_FILE=$(ls -t backups/commit_*.txt 2>/dev/null | head -1)
    if [ -n "$LATEST_COMMIT_FILE" ]; then
        PREVIOUS_COMMIT=$(cat "$LATEST_COMMIT_FILE")
        log_info "Previous commit: $PREVIOUS_COMMIT"

        if confirm "Checkout previous commit?"; then
            git checkout "$PREVIOUS_COMMIT"
            log_success "Checked out previous commit"
        fi
    fi

    log_warning "Manual rollback may be required. Check Cloud Console."
    log_info "https://console.cloud.google.com/functions/list?project=$PROJECT_ID"
}

# ==============================================================================
# Deployment Summary
# ==============================================================================

deployment_summary() {
    log_header "Deployment Summary"

    FUNCTION_URL=$(gcloud functions describe "$FUNCTION_NAME" \
        --region="$REGION" \
        --gen2 \
        --format='value(serviceConfig.uri)')

    HOSTING_URL="https://${PROJECT_ID}.web.app"

    echo ""
    log_success "CLAUDIA v10.0 Deployed Successfully!"
    echo ""
    echo -e "${BLUE}Environment:${NC}       $ENVIRONMENT"
    echo -e "${BLUE}Project:${NC}           $PROJECT_ID"
    echo -e "${BLUE}Region:${NC}            $REGION"
    echo ""
    echo -e "${BLUE}🔗 URLs:${NC}"
    echo -e "   Cloud Function:    $FUNCTION_URL"
    echo -e "   Web App:           $HOSTING_URL"
    echo -e "   Health Check:      $FUNCTION_URL/health"
    echo ""
    echo -e "${BLUE}📊 Monitoring:${NC}"
    echo -e "   Logs:   gcloud functions logs read $FUNCTION_NAME --region=$REGION --gen2 --limit=50"
    echo -e "   Metrics: https://console.cloud.google.com/functions/details/$REGION/$FUNCTION_NAME?project=$PROJECT_ID"
    echo ""
    echo -e "${BLUE}📱 Telegram Bot:${NC}"
    echo -e "   Test your bot on Telegram"
    echo ""
}

# ==============================================================================
# Main Execution
# ==============================================================================

main() {
    clear
    log_header "🏗️  CLAUDIA v10.0 - Production Deployment"

    echo "Environment: $ENVIRONMENT"
    echo "Project: $PROJECT_ID"
    echo "Region: $REGION"
    echo ""

    if ! confirm "Start deployment?"; then
        log_error "Deployment cancelled by user"
        exit 0
    fi

    pre_deployment_checks
    backup_deployment
    deploy_functions
    deploy_hosting
    deploy_firestore
    configure_telegram
    health_checks
    deployment_summary

    log_success "Deployment completed successfully!"
}

# ==============================================================================
# Execute
# ==============================================================================

main "$@"
