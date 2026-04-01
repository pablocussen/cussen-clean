# CLAUDIA v10.0 - Deployment Guide

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Deployment Procedures](#deployment-procedures)
- [Rollback Procedures](#rollback-procedures)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Overview

CLAUDIA uses a multi-component deployment architecture:

```
┌─────────────────┐
│  Firebase       │
│  Hosting        │  ← Web App (PWA)
│  (Static)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Cloud          │
│  Functions      │  ← API Handler
│  (Serverless)   │
└────────┬────────┘
         │
         ├──────────┐
         │          │
         ▼          ▼
┌─────────────┐  ┌──────────────┐
│  Firestore  │  │  Gemini AI   │
│  (Database) │  │  (External)  │
└─────────────┘  └──────────────┘
```

**Components:**
1. **Firebase Hosting** - Static web app (HTML/CSS/JS)
2. **Cloud Functions** - Python serverless backend
3. **Firestore** - NoSQL database
4. **Telegram Bot** - Webhook integration

## Prerequisites

### Required Software

```bash
# Python 3.11+
python3 --version

# Node.js 18+ (for Firebase CLI)
node --version

# Firebase CLI
npm install -g firebase-tools

# Google Cloud SDK
gcloud version
```

### Required Accounts & API Keys

1. **Google Cloud Project**
   - Project ID: `claudia-i8bxh`
   - Enable APIs: Cloud Functions, Firestore, Cloud Build

2. **Gemini API Key**
   - Get from: https://makersuite.google.com/app/apikey

3. **Telegram Bot Token**
   - Get from: @BotFather on Telegram

4. **Firebase Project**
   - Same as Google Cloud project
   - Enable: Hosting, Firestore

### Authentication

```bash
# Google Cloud
gcloud auth login
gcloud config set project claudia-i8bxh

# Firebase
firebase login
firebase use claudia-i8bxh
```

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/claudia_bot.git
cd claudia_bot
```

### 2. Create `.env` File

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Required
TELEGRAM_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
GOOGLE_CLOUD_PROJECT=claudia-i8bxh

# Environment
ENVIRONMENT=production
LOGGING_LEVEL=WARNING

# Rate Limiting
ENABLE_RATE_LIMITING=true
RATE_LIMIT_MAX_REQUESTS=5
RATE_LIMIT_WINDOW_SECONDS=60
```

### 3. Install Dependencies

```bash
# Python dependencies
pip install -r requirements.txt

# Install dev dependencies (for testing)
pip install -r requirements-dev.txt
```

### 4. Run Tests

```bash
# All tests
pytest

# With coverage
pytest --cov=claudia_modules --cov-report=html

# Security audit
python scripts/security_audit.py
```

## Deployment Procedures

### Quick Deploy (Production)

```bash
# Source environment variables
source .env

# Deploy everything
./scripts/deploy_production.sh production
```

### Step-by-Step Deployment

#### 1. Pre-Deployment Checks

```bash
# Run tests
pytest --tb=short

# Run linting
black . --check
pylint claudia_modules/ --exit-zero

# Security audit
python scripts/security_audit.py

# Check git status
git status
```

#### 2. Deploy Cloud Functions

```bash
gcloud functions deploy claudia_handler \
  --gen2 \
  --runtime python311 \
  --region us-central1 \
  --source . \
  --entry-point claudia_handler \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars "GEMINI_API_KEY=$GEMINI_API_KEY,TELEGRAM_TOKEN=$TELEGRAM_TOKEN,ENVIRONMENT=production,LOGGING_LEVEL=WARNING,ENABLE_RATE_LIMITING=true" \
  --memory 1GB \
  --timeout 300s \
  --max-instances 100 \
  --min-instances 2
```

**Configuration by Environment:**

| Setting | Development | Staging | Production |
|---------|------------|---------|------------|
| Memory | 256MB | 512MB | 1GB |
| Timeout | 60s | 120s | 300s |
| Max Instances | 10 | 50 | 100 |
| Min Instances | 0 | 1 | 2 |
| Log Level | DEBUG | INFO | WARNING |

#### 3. Deploy Firebase Hosting

```bash
firebase deploy --only hosting --project claudia-i8bxh
```

This deploys:
- `web_app/index.html` - Main application
- `web_app/js/` - JavaScript modules
- `web_app/css/` - Stylesheets
- `web_app/apu_database.json` - APU data

#### 4. Deploy Firestore Configuration

```bash
# Deploy indexes (required for complex queries)
firebase deploy --only firestore:indexes --project claudia-i8bxh

# Deploy security rules
firebase deploy --only firestore:rules --project claudia-i8bxh
```

#### 5. Configure Telegram Webhook

```bash
# Get Cloud Function URL
FUNCTION_URL=$(gcloud functions describe claudia_handler \
  --region=us-central1 \
  --gen2 \
  --format='value(serviceConfig.uri)')

# Set webhook
curl -X POST "https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook" \
  -d "url=${FUNCTION_URL}" \
  -d "drop_pending_updates=true"

# Verify webhook
curl "https://api.telegram.org/bot${TELEGRAM_TOKEN}/getWebhookInfo"
```

#### 6. Post-Deployment Verification

```bash
# Health check
curl https://us-central1-claudia-i8bxh.cloudfunctions.net/claudia_handler/health

# Check web app
curl -I https://claudia-i8bxh.web.app

# Check Telegram bot
# Send "/start" to your bot on Telegram

# Monitor logs
gcloud functions logs read claudia_handler \
  --region=us-central1 \
  --gen2 \
  --limit=50 \
  --format="table(time, severity, textPayload)"
```

### Environment-Specific Deployments

#### Development

```bash
./scripts/deploy_production.sh dev
```

- Lower resource limits
- Debug logging enabled
- Faster iteration

#### Staging

```bash
./scripts/deploy_production.sh staging
```

- Production-like environment
- Testing before production
- Medium resource allocation

#### Production

```bash
./scripts/deploy_production.sh production
```

- Full resources
- Warning-level logging
- High availability (min instances: 2)

## Rollback Procedures

### Automatic Rollback

The deployment script creates automatic backups:

```bash
backups/
  function_20250131_143022.json  # Cloud Function config
  commit_20250131_143022.txt     # Git commit hash
```

### Emergency Rollback

```bash
# Rollback to latest backup
./scripts/rollback.sh

# Rollback to specific backup
./scripts/rollback.sh 20250131_143022
```

### Manual Rollback

#### Cloud Functions

```bash
# List previous versions
gcloud functions list-revisions claudia_handler \
  --region=us-central1 \
  --gen2

# Rollback to previous revision
gcloud functions deploy claudia_handler \
  --source=. \
  # ... (copy previous configuration)
```

#### Firebase Hosting

```bash
# List previous releases
firebase hosting:channel:list

# Clone previous release
firebase hosting:clone SOURCE_SITE_ID:SOURCE_CHANNEL_ID DEST_SITE_ID:live
```

#### Git Rollback

```bash
# Find previous commit
git log --oneline | head -10

# Rollback code
git checkout <commit-hash>

# Redeploy
./scripts/deploy_production.sh production
```

## Monitoring

### Health Checks

```bash
# Cloud Function health
curl https://us-central1-claudia-i8bxh.cloudfunctions.net/claudia_handler/health

# Expected response:
{
  "status": "healthy",
  "version": "10.0",
  "timestamp": "2025-01-31T14:30:22Z",
  "checks": {
    "firestore": {"status": "healthy", "latency_ms": 45},
    "gemini_api": {"status": "healthy", "latency_ms": 123},
    "telegram_api": {"status": "healthy", "latency_ms": 67},
    "apu_database": {"status": "healthy", "count": 816}
  }
}
```

### Logs

```bash
# Real-time logs
gcloud functions logs read claudia_handler \
  --region=us-central1 \
  --gen2 \
  --limit=50 \
  --format="table(time, severity, textPayload)" \
  --tail

# Filter by severity
gcloud functions logs read claudia_handler \
  --region=us-central1 \
  --gen2 \
  --min-log-level=ERROR

# Filter by time
gcloud functions logs read claudia_handler \
  --region=us-central1 \
  --gen2 \
  --start-time="2025-01-31T10:00:00Z"
```

### Metrics

**Cloud Console:**
- https://console.cloud.google.com/functions/details/us-central1/claudia_handler?project=claudia-i8bxh

**Key Metrics:**
- Invocations per second
- Execution time (p50, p95, p99)
- Error rate
- Memory utilization
- Active instances

**Firebase Console:**
- https://console.firebase.google.com/project/claudia-i8bxh

**Key Metrics:**
- Hosting bandwidth
- Firestore reads/writes
- User activity

### Alerts

Set up alerts in Cloud Console:

1. **Error Rate > 5%**
   - Alert via email/SMS
   - Trigger: 5 minutes

2. **Response Time > 5s (p95)**
   - Alert via email
   - Trigger: 10 minutes

3. **Function Crashes**
   - Immediate alert
   - Trigger: Any crash

## Troubleshooting

### Common Issues

#### 1. Deployment Fails with "Permission Denied"

**Problem:** Insufficient IAM permissions

**Solution:**
```bash
# Check current permissions
gcloud projects get-iam-policy claudia-i8bxh \
  --flatten="bindings[].members" \
  --format="table(bindings.role)" \
  --filter="bindings.members:$(gcloud config get-value account)"

# Required roles:
# - roles/cloudfunctions.developer
# - roles/firebase.admin
# - roles/iam.serviceAccountUser
```

#### 2. Health Check Returns 503

**Problem:** Function not ready or crashed

**Solution:**
```bash
# Check function status
gcloud functions describe claudia_handler \
  --region=us-central1 \
  --gen2 \
  --format="value(state)"

# Check logs for errors
gcloud functions logs read claudia_handler \
  --region=us-central1 \
  --gen2 \
  --limit=50 \
  --min-log-level=ERROR

# Redeploy if needed
./scripts/deploy_production.sh production
```

#### 3. Telegram Webhook Not Working

**Problem:** Webhook not configured or invalid URL

**Solution:**
```bash
# Check webhook status
curl "https://api.telegram.org/bot${TELEGRAM_TOKEN}/getWebhookInfo"

# Delete webhook
curl "https://api.telegram.org/bot${TELEGRAM_TOKEN}/deleteWebhook"

# Reconfigure
FUNCTION_URL=$(gcloud functions describe claudia_handler \
  --region=us-central1 --gen2 --format='value(serviceConfig.uri)')
curl -X POST "https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook" \
  -d "url=${FUNCTION_URL}"
```

#### 4. Firestore Queries Slow

**Problem:** Missing indexes

**Solution:**
```bash
# Deploy indexes
firebase deploy --only firestore:indexes --project claudia-i8bxh

# Check index status in console:
# https://console.firebase.google.com/project/claudia-i8bxh/firestore/indexes

# Wait for indexes to build (can take 5-30 minutes)
```

#### 5. Rate Limiting Too Aggressive

**Problem:** Legitimate users being rate-limited

**Solution:**

Edit environment variables:
```bash
# Increase limits
gcloud functions deploy claudia_handler \
  --update-env-vars "RATE_LIMIT_MAX_REQUESTS=10,RATE_LIMIT_WINDOW_SECONDS=60"

# Or disable temporarily
gcloud functions deploy claudia_handler \
  --update-env-vars "ENABLE_RATE_LIMITING=false"
```

#### 6. Out of Memory Errors

**Problem:** Function exceeding memory limit

**Solution:**
```bash
# Increase memory allocation
gcloud functions deploy claudia_handler \
  --memory 2GB \
  # ... (other flags)

# Check memory usage in metrics dashboard
```

#### 7. Cold Start Latency

**Problem:** First requests after idle period are slow

**Solution:**
```bash
# Increase min instances to keep function warm
gcloud functions deploy claudia_handler \
  --min-instances 3 \
  # ... (other flags)

# Note: This increases costs but reduces latency
```

### Debug Mode

Enable debug logging temporarily:

```bash
gcloud functions deploy claudia_handler \
  --update-env-vars "LOGGING_LEVEL=DEBUG"

# Revert after debugging
gcloud functions deploy claudia_handler \
  --update-env-vars "LOGGING_LEVEL=WARNING"
```

### Emergency Contacts

| Role | Contact | Escalation Time |
|------|---------|----------------|
| Primary On-Call | Engineering Team | Immediate |
| Secondary | CTO | 15 minutes |
| Firebase Support | Console Support | 1 hour |

### Incident Response

1. **Identify** - Check metrics, logs, alerts
2. **Assess** - Determine severity (P0-P3)
3. **Communicate** - Notify stakeholders
4. **Mitigate** - Rollback if critical
5. **Resolve** - Fix root cause
6. **Post-Mortem** - Document lessons learned

---

## Quick Reference

### Useful Commands

```bash
# Deploy everything
./scripts/deploy_production.sh production

# Rollback
./scripts/rollback.sh

# Health check
curl https://us-central1-claudia-i8bxh.cloudfunctions.net/claudia_handler/health

# Logs
gcloud functions logs read claudia_handler --region=us-central1 --gen2 --limit=50

# Metrics
gcloud monitoring dashboards list --project=claudia-i8bxh

# Telegram webhook
curl "https://api.telegram.org/bot${TELEGRAM_TOKEN}/getWebhookInfo"
```

### Important URLs

- **Web App:** https://claudia-i8bxh.web.app
- **Cloud Function:** https://us-central1-claudia-i8bxh.cloudfunctions.net/claudia_handler
- **Console:** https://console.cloud.google.com/functions/list?project=claudia-i8bxh
- **Firebase Console:** https://console.firebase.google.com/project/claudia-i8bxh
- **Logs:** https://console.cloud.google.com/logs/query?project=claudia-i8bxh

---

**Last Updated:** 2025-01-31
**Version:** 10.0
**Author:** Arqattack Engineering Team
