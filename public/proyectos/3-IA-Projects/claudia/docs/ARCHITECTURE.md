# CLAUDIA - System Architecture

## Table of Contents
- [Overview](#overview)
- [High-Level Architecture](#high-level-architecture)
- [Component Details](#component-details)
- [Data Flow](#data-flow)
- [Technology Stack](#technology-stack)
- [Design Patterns](#design-patterns)
- [Security Architecture](#security-architecture)
- [Performance Considerations](#performance-considerations)
- [Scalability](#scalability)

---

## Overview

CLAUDIA is a serverless, cloud-native application built on Google Cloud Platform. The architecture follows microservices principles with clear separation of concerns between the web app, backend API, and AI processing.

### Key Architectural Principles

1. **Serverless-First**: No servers to manage, automatic scaling
2. **Event-Driven**: Webhook-based Telegram integration
3. **Stateless**: Cloud Functions with persistent state in Firestore
4. **Security by Design**: Multiple layers of security controls
5. **Observable**: Comprehensive logging and monitoring

---

## High-Level Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                              │
├─────────────────────┬──────────────────┬──────────────────────────┤
│   Web App (PWA)     │  Telegram App    │   Mobile Browser        │
│  Firebase Hosting   │  (Users)         │   (Responsive)          │
└─────────┬───────────┴────────┬─────────┴───────────┬──────────────┘
          │                    │                     │
          │ HTTPS              │ HTTPS               │ HTTPS
          ▼                    ▼                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                              │
├─────────────────────┬───────────────────────────────────────────────┤
│  Firebase Hosting   │  Cloud Functions (main.py)                   │
│  Static Assets      │  - /claudia_handler (Telegram webhook)       │
│                     │  - /send_log (Daily logs)                    │
│                     │  - /send_morning (Morning messages)           │
│                     │  - /health (Health check)                     │
└─────────┬───────────┴───────────────────┬───────────────────────────┘
          │                               │
          │                               ▼
          │                    ┌──────────────────────┐
          │                    │  Rate Limiter        │
          │                    │  (Token Bucket)      │
          │                    └──────────┬───────────┘
          │                               │
          │                               ▼
          │                    ┌──────────────────────┐
          │                    │  Input Validator     │
          │                    │  (Security Layer)    │
          │                    └──────────┬───────────┘
          │                               │
          ▼                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       BUSINESS LOGIC LAYER                          │
├───────────────┬──────────────────┬──────────────────┬───────────────┤
│ AI Core       │ Materials Calc   │ Project Manager  │ Bot Commands  │
│ (ai_core.py)  │ (materials_      │ (project_        │ (bot_         │
│               │  calculator.py)  │  manager.py)     │  commands.py) │
│ - Gemini AI   │ - NCh Standards  │ - CRUD ops       │ - /start      │
│ - Lead Score  │ - Waste calcs    │ - Templates      │ - /ayuda      │
│ - Conversation│ - Shopping list  │ - Export         │ - /info       │
└───────┬───────┴────────┬─────────┴────────┬─────────┴───────┬───────┘
        │                │                  │                 │
        │                │                  │                 │
        ▼                ▼                  ▼                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       DATA ACCESS LAYER                             │
├──────────────────┬───────────────────┬──────────────────────────────┤
│  Cache Layer     │  Firestore DB     │  External APIs               │
│  (LRU Cache)     │  (NoSQL)          │                              │
│                  │                   │                              │
│ - APU Database   │ - conversations   │ - Gemini AI API              │
│ - Categories     │ - construction_   │ - Telegram Bot API           │
│ - Search Index   │   leads           │                              │
│                  │ - projects        │                              │
│                  │ - users           │                              │
└──────────────────┴───────────────────┴──────────────────────────────┘
```

---

## Component Details

### 1. Web App (PWA)

**Location**: `web_app/`

**Technology**: Vanilla JavaScript, HTML5, CSS3

**Key Components**:
- `claudia-complete.js` - Main application logic (4,587 lines)
- `claudia-telegram-linking.js` - Telegram bot linking
- `apu_database.json` - 816 APUs (498 KB, minified to 309 KB)
- `apu_index.json` - Search index for fast lookups

**Features**:
- Progressive Web App (installable)
- Offline-first with LocalStorage
- Responsive design (mobile-first)
- Budget calculator with 10 templates
- Materials calculator
- Export to Excel/CSV
- Telegram bot linking

### 2. Cloud Functions (Backend)

**Location**: `main.py`

**Entry Points**:

#### `/claudia_handler` (POST)
- **Purpose**: Telegram webhook receiver
- **Input**: Telegram Update object
- **Output**: HTTP 200 (always)
- **Rate Limit**: 5 req/60s per user
- **Handles**:
  - Text messages → AI analysis
  - Callback queries → Button clicks
  - Photos → Visual inspection
  - Commands → /start, /ayuda, /info

#### `/send_log` (POST)
- **Purpose**: Daily construction logs
- **Input**: Email, WhatsApp, message, log data
- **Output**: Success/failure JSON

#### `/send_morning` (POST)
- **Purpose**: Morning motivational messages
- **Input**: user_id, custom_message
- **Output**: Success/failure JSON

#### `/health` (GET)
- **Purpose**: Health check endpoint
- **Output**: Component status (200 or 503)

### 3. AI Core (`claudia_modules/ai_core.py`)

**Responsibilities**:
- Conversation management
- Lead qualification (0-10 score)
- Project type detection
- Sales script following
- Gemini AI integration

**Key Functions**:
- `get_construction_analysis(query, session_id)` - Main AI function
- `_save_lead(session_id, query, analysis)` - Lead persistence

**Conversation Flow**:
```
1. Bienvenida → Detect project type
2A. Baño → 3 questions (objetivo, ambiente, color)
2B. Cocina → 2 questions (motor, estilo)
2C. Integral → Custom flow
3. Cierre → Calendar link
```

### 4. Materials Calculator (`claudia_modules/materials_calculator.py`)

**Responsibilities**:
- Material calculations per NCh standards
- Waste factor application (5-12%)
- Unit conversions
- Shopping list generation

**Key Methods**:
- `calculate_muro(largo, alto, tipo_ladrillo)` - Wall materials
- `calculate_radier(area, espesor)` - Slab materials
- `calculate_hormigon(volumen, tipo)` - Concrete materials

**Standards**:
- NCh430 - Concrete (H15, H20)
- Chilean practice - Masonry rendimientos

### 5. Firestore Database

**Collections**:

#### `conversations`
```json
{
  "session_id": "string (Telegram chat_id)",
  "history": ["Usuario: ...", "CLAUDIA: ..."],
  "last_updated": "timestamp"
}
```

#### `construction_leads`
```json
{
  "session_id": "string",
  "query": "string",
  "friendly_response": "string",
  "lead_score": "number (0-10)",
  "project_type": "string (baño|cocina|integral)",
  "timestamp": "timestamp",
  "status": "string (Nuevo|Contactado|Cerrado)",
  "notes": "string"
}
```

#### `projects`
```json
{
  "id": "string",
  "userId": "string",
  "name": "string",
  "activities": [],
  "total": "number",
  "createdAt": "timestamp"
}
```

#### `users`
```json
{
  "telegram_id": "string",
  "email": "string (optional)",
  "phone": "string (optional)",
  "created_at": "timestamp",
  "subscription_tier": "string (free|pro)"
}
```

### 6. Caching Layer (`claudia_modules/cache_utils.py`)

**LRU Caches**:
- `load_apu_database()` - Maxsize: 1 (single cache)
- `get_apu_by_id(id)` - Maxsize: 128
- `get_apus_by_category(category)` - Maxsize: 32
- `search_apus(query)` - Maxsize: 256

**Performance Impact**:
- APU loading: 50-100x faster
- Search queries: 3-5x faster
- Memory usage: ~50MB for all caches

### 7. Security Layer

**Components**:
- `rate_limiter.py` - Token bucket algorithm
- `security.py` - Validation & sanitization
- `logging_utils.py` - Structured logging

**Security Controls**:
1. Rate limiting (5 req/60s per user)
2. Input validation (length, format, content)
3. HTML/SQL sanitization
4. Security headers (CSP, HSTS, etc.)
5. HTTPS enforcement
6. No secrets in code

### 8. Monitoring Layer

**Components**:
- `health.py` - Health checks
- `metrics.py` - Metrics collection
- `performance.py` - Performance tracking

**Metrics**:
- Counters: telegram.messages, ai.queries
- Gauges: active_users, cache_hit_rate
- Timers: ai.query_duration, db.query_duration
- Histograms: response_times (p50, p95, p99)

---

## Data Flow

### Scenario 1: User Sends Message via Telegram

```
┌──────────┐
│  User    │ "¿Cuánto cuesta remodelar mi baño?"
└────┬─────┘
     │
     │ (1) Send message
     ▼
┌─────────────────┐
│ Telegram Server │
└────┬────────────┘
     │
     │ (2) Webhook POST /claudia_handler
     ▼
┌────────────────────┐
│  Rate Limiter      │ Check: user has tokens?
└────┬───────────────┘
     │ ✓ Allowed
     │
     │ (3) Validate input
     ▼
┌────────────────────┐
│  Input Validator   │ Sanitize, check length
└────┬───────────────┘
     │ ✓ Valid
     │
     │ (4) Process message
     ▼
┌────────────────────┐
│  AI Core           │ Load history from Firestore
│  (ai_core.py)      │ Call Gemini AI API
│                    │ Detect: project_type = "baño"
│                    │ Score: lead_score = 8
│                    │ Generate: buttons
└────┬───────────────┘
     │
     │ (5) Save conversation + lead
     ▼
┌────────────────────┐
│  Firestore         │ Update conversations
│                    │ Insert construction_leads
└────┬───────────────┘
     │
     │ (6) Send response
     ▼
┌────────────────────┐
│  Telegram API      │ sendMessage with InlineKeyboard
└────┬───────────────┘
     │
     │ (7) Deliver to user
     ▼
┌──────────┐
│  User    │ Receives: "¡El baño es fundamental!" + buttons
└──────────┘
```

### Scenario 2: User Creates Budget on Web App

```
┌──────────┐
│  User    │ Clicks "Crear Presupuesto"
└────┬─────┘
     │
     │ (1) Select template "Baño Completo"
     ▼
┌───────────────────┐
│  Web App (JS)     │ Load template from local data
│                   │ activities = [ALB001, HOR023, ...]
└────┬──────────────┘
     │
     │ (2) Load APUs
     ▼
┌───────────────────┐
│  APU Cache        │ get_apu_by_id("ALB001")
│  (LRU)            │ Hit rate: ~85%
└────┬──────────────┘
     │
     │ (3) Calculate materials
     ▼
┌───────────────────┐
│  Materials Calc   │ area = 6 m²
│                   │ ceramics = 6 * 1.1 = 6.6 m²
│                   │ adhesive = 6 * 5 = 30 kg
└────┬──────────────┘
     │
     │ (4) Generate shopping list
     ▼
┌───────────────────┐
│  UI Update        │ Display:
│                   │ - Resumen: $2.5M CLP
│                   │ - Lista compras: 24 items
│                   │ - Export buttons
└───────────────────┘
```

---

## Technology Stack

### Backend
- **Runtime**: Python 3.11+
- **Framework**: Flask (for Cloud Functions)
- **Serverless**: Google Cloud Functions (Gen 2)
- **Database**: Cloud Firestore (NoSQL)
- **AI**: Google Gemini 1.5 Flash
- **Bot**: Telegram Bot API

### Frontend
- **Language**: Vanilla JavaScript (ES6+)
- **UI**: HTML5 + CSS3 (no frameworks)
- **PWA**: Service Worker, Manifest
- **Storage**: LocalStorage
- **Hosting**: Firebase Hosting

### DevOps
- **CI/CD**: GitHub Actions
- **Testing**: pytest, pytest-cov
- **Linting**: Black, Pylint, Flake8, isort
- **Monitoring**: Custom (health.py, metrics.py)
- **Deployment**: Firebase CLI

### External Services
- **Gemini AI**: Text generation and analysis
- **Telegram**: Bot messaging platform
- **Firebase**: Hosting, Functions, Firestore, Auth

---

## Design Patterns

### 1. Singleton Pattern
**Used in**: Rate limiter, metrics collector, health checker

```python
_rate_limiter = None

def get_rate_limiter():
    global _rate_limiter
    if _rate_limiter is None:
        _rate_limiter = RateLimiter()
    return _rate_limiter
```

### 2. Factory Pattern
**Used in**: Structured logger creation

```python
def get_structured_logger(name: str) -> StructuredLogger:
    return StructuredLogger(name, enable_json=True)
```

### 3. Decorator Pattern
**Used in**: Performance monitoring, caching

```python
@measure_performance()
def expensive_function():
    # ... implementation

@lru_cache(maxsize=128)
def get_apu_by_id(apu_id: str):
    # ... implementation
```

### 4. Strategy Pattern
**Used in**: Input validation (different validators for different inputs)

```python
def validate_telegram_id(id)  # Different validation
def validate_email(email)     # Different validation
def validate_phone(phone)     # Different validation
```

### 5. Observer Pattern
**Used in**: Metrics collection (observers track events)

```python
increment_counter("telegram.messages", status="success")
record_timing("ai.query_duration", 1200)
```

---

## Security Architecture

### Defense in Depth

**Layer 1: Network**
- HTTPS only (enforced)
- Firebase Authentication (optional)
- Telegram IP validation

**Layer 2: Application**
- Rate limiting (5 req/60s per user)
- Input validation (all user inputs)
- Output sanitization (HTML escaping)

**Layer 3: Data**
- Firestore security rules
- No PII in logs
- Encrypted at rest (Firebase default)

**Layer 4: Monitoring**
- Security audit script
- Structured logging
- Error tracking with context

### Threat Model

| Threat | Mitigation | Status |
|--------|------------|--------|
| DDoS | Rate limiting | ✅ Implemented |
| XSS | HTML sanitization | ✅ Implemented |
| SQLi | Input validation (NoSQL) | ✅ Implemented |
| Secrets exposure | No hardcoded secrets | ✅ Verified |
| MITM | HTTPS only | ✅ Enforced |
| Brute force | Rate limiting | ✅ Implemented |

---

## Performance Considerations

### Caching Strategy
- **L1 Cache**: LRU in-memory (APUs, categories, search)
- **L2 Cache**: Firestore (conversations, leads)
- **Cache Invalidation**: Manual clear or TTL (if needed)

### Query Optimization
- **Firestore Indexes**: 5 composite indexes
- **Limit Results**: Pagination where applicable
- **Lazy Loading**: APU chunks on demand

### Response Time Budget
- **Target**: <2.2s average
- **Breakdown**:
  - Network: 200ms
  - Rate limiting: 1ms
  - Input validation: 5ms
  - AI query (Gemini): 1000-1500ms
  - Firestore ops: 100-200ms
  - Response generation: 50ms
  - Telegram API: 200ms

---

## Scalability

### Current Limits
- **Cloud Functions**: 10,000 invocations/day (free tier)
- **Firestore**: 50,000 reads, 20,000 writes/day (free tier)
- **Gemini AI**: 60 requests/min (free tier)
- **Telegram**: 30 messages/sec per bot

### Horizontal Scaling
Cloud Functions auto-scale from 0 to N instances:
- **Cold start**: ~500ms (Python 3.11)
- **Warm instance reuse**: Yes (lazy initialization)
- **Max concurrent**: 1000 (configurable)

### Vertical Scaling
- **Memory**: 256 MB (default) → 8 GB (max)
- **Timeout**: 60s (default) → 540s (max)
- **CPU**: 0.4 → 8 vCPUs

### Bottlenecks
1. **Gemini API**: 60 req/min limit
   - Mitigation: Queue system, response caching
2. **Firestore writes**: 20,000/day on free tier
   - Mitigation: Batch writes, upgrade to paid tier
3. **Cold starts**: 500ms on first request
   - Mitigation: Keep-alive pings, always-on instances (paid)

---

## Future Enhancements

1. **Microservices Split**
   - Separate AI service (Cloud Run)
   - Separate materials calculator service
   - API Gateway (Cloud Endpoints)

2. **Event-Driven Architecture**
   - Pub/Sub for async processing
   - Cloud Tasks for scheduled jobs
   - Eventarc for event routing

3. **Data Pipeline**
   - BigQuery for analytics
   - Dataflow for ETL
   - Looker for dashboards

4. **Multi-Region**
   - Deploy to multiple regions
   - Cloud Load Balancing
   - CDN for static assets

---

**Document Version**: 1.0
**Last Updated**: 2025-10-31
**Author**: Arqattack Engineering Team
