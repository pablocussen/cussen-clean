#!/bin/bash
# ==============================================================================
# CLAUDIA v10.0 - Emergency Rollback Script
# ==============================================================================
# Quick rollback to previous working version
#
# Usage:
#   ./scripts/rollback.sh [backup_timestamp]
# ==============================================================================

set -e
set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

PROJECT_ID="claudia-i8bxh"
REGION="us-central1"
FUNCTION_NAME="claudia_handler"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ ${NC}$1"; }
log_success() { echo -e "${GREEN}✓ ${NC}$1"; }
log_warning() { echo -e "${YELLOW}⚠ ${NC}$1"; }
log_error() { echo -e "${RED}✗ ${NC}$1"; }

# ==============================================================================
# Rollback Function
# ==============================================================================

rollback() {
    echo ""
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}⚠️  EMERGENCY ROLLBACK${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    # List available backups
    log_info "Available backups:"
    echo ""

    if [ ! -d "backups" ] || [ -z "$(ls -A backups 2>/dev/null)" ]; then
        log_error "No backups found in backups/ directory"
        exit 1
    fi

    ls -lht backups/function_*.json | head -10 | awk '{print "  " $9 " - " $6 " " $7 " " $8}'

    echo ""

    # Select backup
    if [ $# -eq 0 ]; then
        LATEST_BACKUP=$(ls -t backups/function_*.json | head -1)
        log_info "Using latest backup: $(basename $LATEST_BACKUP)"
        BACKUP_FILE="$LATEST_BACKUP"
    else
        BACKUP_FILE="backups/function_$1.json"
        if [ ! -f "$BACKUP_FILE" ]; then
            log_error "Backup not found: $BACKUP_FILE"
            exit 1
        fi
    fi

    # Confirm rollback
    read -p "$(echo -e ${RED}Are you sure you want to rollback? [y/N]: ${NC})" -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "Rollback cancelled"
        exit 0
    fi

    # Get commit from backup
    BACKUP_TIMESTAMP=$(basename "$BACKUP_FILE" | sed 's/function_//' | sed 's/.json//')
    COMMIT_FILE="backups/commit_${BACKUP_TIMESTAMP}.txt"

    if [ -f "$COMMIT_FILE" ]; then
        PREVIOUS_COMMIT=$(cat "$COMMIT_FILE")
        log_info "Rolling back to commit: $PREVIOUS_COMMIT"

        # Stash current changes
        log_info "Stashing current changes..."
        git stash push -m "Rollback stash at $(date)"

        # Checkout previous commit
        log_info "Checking out previous commit..."
        git checkout "$PREVIOUS_COMMIT"

        log_success "Code rolled back to commit: $PREVIOUS_COMMIT"
    else
        log_warning "No commit info found for this backup"
    fi

    # Redeploy
    log_info "Redeploying Cloud Function..."

    if [ -f ".env" ]; then
        source .env
    fi

    if [ -z "${GEMINI_API_KEY:-}" ] || [ -z "${TELEGRAM_TOKEN:-}" ]; then
        log_error "Environment variables not set. Set them and redeploy manually:"
        echo "  ./scripts/deploy_production.sh production"
        exit 1
    fi

    gcloud functions deploy "$FUNCTION_NAME" \
        --gen2 \
        --runtime python311 \
        --region "$REGION" \
        --source . \
        --entry-point claudia_handler \
        --trigger-http \
        --allow-unauthenticated \
        --set-env-vars "GEMINI_API_KEY=$GEMINI_API_KEY,TELEGRAM_TOKEN=$TELEGRAM_TOKEN,ENVIRONMENT=production,LOGGING_LEVEL=WARNING" \
        --memory 1GB \
        --timeout 300s \
        --max-instances 100 \
        --min-instances 2

    if [ $? -eq 0 ]; then
        log_success "Rollback deployment successful"
    else
        log_error "Rollback deployment failed"
        exit 1
    fi

    # Health check
    log_info "Running health check..."
    sleep 5

    FUNCTION_URL=$(gcloud functions describe "$FUNCTION_NAME" \
        --region="$REGION" \
        --gen2 \
        --format='value(serviceConfig.uri)')

    HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FUNCTION_URL/health")

    if [ "$HEALTH_CODE" = "200" ]; then
        log_success "Health check passed (HTTP $HEALTH_CODE)"
    else
        log_error "Health check failed (HTTP $HEALTH_CODE)"
        exit 1
    fi

    echo ""
    log_success "Rollback completed successfully!"
    echo ""
    log_info "Monitor logs: gcloud functions logs read $FUNCTION_NAME --region=$REGION --gen2 --limit=50"
    echo ""
}

# ==============================================================================
# Main
# ==============================================================================

rollback "$@"
