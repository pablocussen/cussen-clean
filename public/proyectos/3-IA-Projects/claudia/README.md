# 🏗️ CLAUDIA - Asistente Inteligente de Construcción

![Status](https://img.shields.io/badge/status-production-success)
![APUs](https://img.shields.io/badge/APUs-816-blue)
![Categories](https://img.shields.io/badge/categories-24-orange)
![Firebase](https://img.shields.io/badge/firebase-deployed-yellow)

**Construction Labor & Unit Analysis with Digital Intelligence Assistant**

Asistente personal para maestros y constructores chilenos. Presupuesta proyectos en 2 minutos con 816 APUs profesionales, genera listas de compras y recibe notificaciones 24/7 por Telegram.

---

## 🚀 Quick Start

### **Acceso Web**
👉 **https://claudia-i8bxh.web.app**

### **Landing Page**
👉 **https://claudia-i8bxh.web.app/landing.html**

### **Bot Telegram**
👉 **@ClaudIA_Bot**

---

## ✨ Características Principales

### **🎯 816 APUs Profesionales**
- 24 categorías completas (Hormigón, Albañilería, Instalaciones, etc.)
- Precios actualizados 2024-2025
- Desglose detallado: materiales + mano de obra + herramientas
- Rendimientos profesionales (m²/HH, m³/HH)

### **🛒 Calculadora de Materiales**
- Lista de compras automática
- Comparación de precios en 6 tiendas:
  - Sodimac, Easy, Construmart, Homecenter, Imperial, Promart
- Exportación WhatsApp/PDF

### **💬 Chat con IA Constructor**
- Google Gemini integrado
- Contexto de 816 APUs
- Consejos profesionales
- Cálculos en tiempo real

### **📱 Bot Telegram 24/7** ⭐ ÚNICO EN MERCADO
- Vinculación segura (código 6 dígitos)
- Gestión de proyectos desde móvil
- Notificaciones proactivas:
  - 🌅 7:00 AM - Resumen matutino
  - ☀️ 12:00 PM - Estado medio día
  - 🌆 6:00 PM - Cierre jornada

### **📊 Gestión Proyectos**
- Múltiples proyectos simultáneos
- Cálculo automático de costos
- Edición en tiempo real
- Gráficos de distribución

---

## 📦 Tech Stack

```
Frontend:  Vanilla JavaScript (ES6+) + PWA
Backend:   Firebase (Firestore + Cloud Functions)
AI:        Google Gemini (Vertex AI)
Charts:    Chart.js
Database:  816 APUs (0.48 MB JSON)
Hosting:   Firebase Hosting
Bot:       Telegram Bot API
```

---

## 🏛️ Arquitectura

```
┌──────────────────────────────────────┐
│  PWA Frontend (Vanilla JS)           │
│  • index.html (SPA)                  │
│  • claudia-complete.js (1750 líneas) │
│  • Service Worker (offline)          │
└──────────────────────────────────────┘
              ↓
┌──────────────────────────────────────┐
│  Firebase Backend (GCP)              │
│  • Firestore (NoSQL DB)              │
│  • Cloud Functions (Node.js)         │
│  • Authentication                    │
└──────────────────────────────────────┘
              ↓
┌──────────────────────────────────────┐
│  External APIs                       │
│  • Google Gemini (AI)                │
│  • Telegram Bot API                  │
│  • 6x Store APIs                     │
└──────────────────────────────────────┘
```

---

## 📊 Base de Datos APUs

### **Distribución por Categorías**

| Categoría | APUs | % |
|-----------|------|---|
| HORMIGÓN | 89 | 10.9% |
| TECHUMBRE | 83 | 10.2% |
| INSTALACIONES ELÉCTRICAS | 79 | 9.7% |
| TERMINACIONES | 76 | 9.3% |
| ALBAÑILERÍA | 66 | 8.1% |
| INSTALACIONES SANITARIAS | 61 | 7.5% |
| CARPINTERÍA | 53 | 6.5% |
| PAVIMENTOS | 48 | 5.9% |
| PINTURA | 40 | 4.9% |
| AISLACION | 25 | 3.1% |
| **... (14 más)** | **197** | **24.1%** |

**Total: 816 APUs en 24 categorías**

### **Schema APU**

```json
{
  "id": "TAB.EST.TERMOBLOCK H.CELULAR 6",
  "nombre": "TAB.EST.TERMOBLOCK H.CELULAR 62.5X20X20",
  "unidad": "m2",
  "categoria": "ALBAÑILERÍA",
  "precio_referencia": 24854,
  "materiales": [
    {
      "nombre": "BLOQUE EST TERMO BLOCK 62.5X20X20CM",
      "cantidad": 8.0,
      "unidad": "uni",
      "precio_unitario": 2146,
      "subtotal": 17168
    }
  ],
  "mano_obra": [
    {
      "nombre": "ALBAÑIL + 1 AYUD",
      "cantidad": 0.08,
      "unidad": "dia",
      "precio_unitario": 46550,
      "subtotal": 3863
    }
  ],
  "rendimiento": "2.5 m²/HH",
  "tips": "Verificar verticalidad cada 5 hiladas."
}
```

---

## 🗂️ Estructura del Proyecto

```
claudia_bot/
├── web_app/                        # 🌐 Frontend PWA
│   ├── index.html                  # SPA principal
│   ├── landing.html                # Landing comercial
│   ├── manifest.json               # PWA config
│   ├── service-worker.js           # Offline support
│   ├── css/                        # Estilos
│   │   ├── claudia.min.css
│   │   ├── claudia-main.min.css
│   │   └── smart-project-creator.css  # ✨ NEW - Modal IA
│   ├── js/                         # JavaScript modules
│   │   ├── claudia-complete.js     # ⭐ Core (1750 líneas)
│   │   ├── claudia-smart-project-creator.js  # ✨ NEW - Sugerencias IA
│   │   ├── claudia-apus.js
│   │   ├── claudia-apu-preview-enhanced.js
│   │   ├── claudia-telegram-linking.js
│   │   ├── claudia-chat.js
│   │   └── claudia-materials.js
│   ├── apu_database.json           # 816 APUs (0.48 MB)
│   └── apu_chunks/                 # APUs por categoría
│
├── claudia_modules/                # 🐍 Python backend modules
│   └── apu_suggestions.py          # ✨ NEW - Gemini APU suggestions
│
├── main.py                         # ☁️ Cloud Functions (Python)
├── requirements.txt                # Python dependencies
│
├── docs/                           # 📚 Documentación
│   ├── CLAUDIA_TECHNICAL_SPECS.md  # Specs técnicas completas
│   └── SMART_PROJECT_CREATOR_README.md  # ✨ NEW - Feature IA
│
├── scripts/                        # 🔧 Scripts deployment
│   └── deploy_suggest_apus.sh      # Deploy Cloud Function
│
├── tests/                          # 🧪 Testing
│   ├── test_smart_suggestions.py   # Tests sugerencias IA
│   ├── pytest.ini
│   └── jest.config.js
│
├── config/                         # ⚙️ Configuración
├── VENTAS/                         # 💼 Materiales de venta
├── APU/                            # 📊 Datos APUs brutos
├── _docs_old/                      # 📁 Docs históricos (archivados)
│
├── firebase.json                   # Firebase config
├── firestore.rules                 # DB security rules
├── firestore.indexes.json          # DB indexes
├── .firebaserc                     # Firebase project config
└── README.md                       # Este archivo
```

---

## 🔧 Setup Local

### **1. Clonar repo**
```bash
git clone [repo-url]
cd claudia_bot
```

### **2. Instalar Firebase CLI**
```bash
npm install -g firebase-tools
firebase login
```

### **3. Configurar proyecto**
```bash
firebase use claudia-i8bxh
```

### **4. Servir localmente**
```bash
cd web_app
python -m http.server 8000
# Abrir http://localhost:8000
```

### **5. Deploy**
```bash
firebase deploy --only hosting
```

---

## 💰 Planes

| Feature | Free | PRO (CLP $40k/año) |
|---------|------|---------------------|
| Proyectos | 3 | ∞ Ilimitados |
| APUs | 816 | 816 |
| Lista compras | ✅ | ✅ |
| Chat IA | ❌ | ✅ |
| Bot Telegram | ❌ | ✅ |
| Notificaciones 24/7 | ❌ | ✅ |
| Sugerencias IA | ❌ | ✅ |

---

## 🎯 Target Users

1. **Maestros constructores** (80%)
   - Pequeñas/medianas obras
   - Presupuestos rápidos
   - Listas de compras

2. **Constructoras pequeñas** (15%)
   - Múltiples proyectos
   - Control de costos

3. **Arquitectos/Ingenieros** (5%)
   - Estimaciones preliminares

---

## 🏆 Diferenciadores vs Competencia

| Feature | CLAUDIA | Competencia |
|---------|---------|-------------|
| APUs chilenos | 816 | 200-500 |
| Bot Telegram | ✅ ÚNICO | ❌ |
| Notificaciones 24/7 | ✅ ÚNICO | ❌ |
| Sugerencias IA | ✅ ÚNICO | ❌ |
| Chat IA constructor | ✅ Gemini | ❌ / Básico |
| Comparador 6 tiendas | ✅ | ✅ (1-2) |
| PWA Offline | ✅ | Parcial |
| Plan gratis robusto | ✅ | Limitado |

---

## 📱 Telegram Bot

### **Vinculación**

1. Click "🔗 Conectar con Telegram" en web app
2. Se genera código de 6 dígitos (15 min validez)
3. Abrir Telegram → buscar **@ClaudIA_Bot**
4. Enviar `/link XXXXXX`
5. ✅ Cuenta vinculada

### **Comandos disponibles**

```
/start          - Bienvenida
/link CODIGO    - Vincular cuenta web
/proyectos      - Ver proyectos activos
/presupuesto    - Ver costo total
/materiales     - Lista de compras
/help           - Ayuda
```

### **Notificaciones automáticas**

- **7:00 AM:** 🌅 Resumen matutino + actividades del día
- **12:00 PM:** ☀️ Estado medio día + progreso
- **6:00 PM:** 🌆 Cierre jornada + pendientes mañana

---

## 🔐 Seguridad

- **Auth:** Firebase Authentication (Email/Password)
- **DB:** Firestore con Security Rules
- **HTTPS:** Obligatorio (Firebase Hosting)
- **Tokens:** JWT con refresh automático
- **Session:** 30 días timeout

---

## 📊 Performance

| Métrica | Valor |
|---------|-------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3.0s |
| Bundle Size | 2.5 MB |
| PWA Score | 95/100 |
| Offline | ✅ Full |

---

## 🐛 Changelog

### **v2.6 - 2025-01-17** ✨ SMART PROJECT CREATOR
✅ **Sugerencias IA con Gemini:** Modal inteligente para crear proyectos
✅ **Backend Python:** Módulo `apu_suggestions.py` con análisis de contexto
✅ **Cloud Function:** Endpoint `suggest_project_apus` (us-central1)
✅ **UI Profesional:** Modal con checkboxes, loading states, confidence badges
✅ **Resuelve problema de Pablo Araya:** Auto-sugiere 15-25 APUs relevantes
✅ **Limpieza codebase:** Reorganización carpetas, archivos obsoletos a `_docs_old/`

### **v2.5 - 2025-01-14**
✅ Corrección números APUs (206 → 816)
✅ APU Preview mejorado con breakdown de costos
✅ Fix botón Telegram (addEventListener)
✅ Deploy producción exitoso

### **v2.4 - 2025-01-10**
✅ Integración Telegram completa
✅ Sistema de notificaciones 24/7
✅ Chat IA con Gemini

### **v2.3 - 2024-12-20**
✅ Calculadora de materiales
✅ Comparador 6 tiendas
✅ PWA offline-first

---

## 📞 Contacto

**URL Producción:** https://claudia-i8bxh.web.app
**Firebase Project:** claudia-i8bxh
**Región GCP:** us-central1
**Telegram Bot:** @ClaudIA_Bot

---

## 📄 Documentación Técnica

### **Documentos principales:**

1. **[CLAUDIA_TECHNICAL_SPECS.md](./docs/CLAUDIA_TECHNICAL_SPECS.md)** - Especificaciones técnicas completas
   - Arquitectura detallada
   - Schema completo de datos
   - Endpoints API
   - Módulos frontend
   - Flujos de integración
   - Roadmap futuro

2. **[SMART_PROJECT_CREATOR_README.md](./docs/SMART_PROJECT_CREATOR_README.md)** ✨ NEW
   - Feature de sugerencias IA
   - API endpoint documentation
   - Deployment instructions
   - Testing procedures
   - Troubleshooting guide

---

**Desarrollado con ❤️ para la industria de la construcción chilena**

*"De maestros, para maestros. Con tecnología de punta."*

---

![CLAUDIA](https://img.shields.io/badge/CLAUDIA-v2.5-success?style=for-the-badge&logo=google-cloud)
![Made in Chile](https://img.shields.io/badge/Made%20in-Chile-red?style=for-the-badge)
