# 🏗️ CLAUDIA - Especificaciones Técnicas Completas

**Construction Labor & Unit Analysis with Digital Intelligence Assistant**

---

## 📊 RESUMEN EJECUTIVO

| Característica | Valor |
|----------------|-------|
| **APUs Totales** | 816 |
| **Categorías** | 24 |
| **Stores Comparación** | 6 tiendas |
| **Modelo IA** | Google Gemini (Vertex AI) |
| **Backend** | Firebase (GCP) |
| **Frontend** | Vanilla JS + PWA |
| **Precio PRO** | CLP $40,000/año |
| **Plan Gratis** | 3 proyectos, 816 APUs |
| **URL Producción** | https://claudia-i8bxh.web.app |

---

## 🎯 BASE DE DATOS APUs

### **1. Estructura de Datos**

**Archivo principal:** `apu_database.json` (0.48 MB)
**Total APUs:** 816 actividades de construcción

#### **Schema APU Completo:**
```json
{
  "id": "TAB.EST.TERMOBLOCK H.CELULAR 6",
  "nombre": "TAB.EST.TERMOBLOCK H.CELULAR 62.5X20X20",
  "descripcion": "APU extraído de TAB.EST.TERMOBLOCK H.CELULAR 62.5X20X20.xlsx",
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
  "tips": "Verificar verticalidad cada 5 hiladas. Juntas uniformes de 1cm."
}
```

### **2. Distribución por Categorías (24 categorías)**

| # | Categoría | APUs | % Total |
|---|-----------|------|---------|
| 1 | HORMIGÓN | 89 | 10.9% |
| 2 | TECHUMBRE | 83 | 10.2% |
| 3 | INSTALACIONES ELÉCTRICAS | 79 | 9.7% |
| 4 | TERMINACIONES | 76 | 9.3% |
| 5 | ALBAÑILERÍA | 66 | 8.1% |
| 6 | INSTALACIONES SANITARIAS | 61 | 7.5% |
| 7 | CARPINTERÍA | 53 | 6.5% |
| 8 | PAVIMENTOS | 48 | 5.9% |
| 9 | PINTURA | 40 | 4.9% |
| 10 | AISLACION | 25 | 3.1% |
| 11 | ESTRUCTURAS ESPECIALES | 20 | 2.5% |
| 12 | EQUIPAMIENTO | 20 | 2.5% |
| 13 | INSTALACIONES | 18 | 2.2% |
| 14 | PUERTAS Y VENTANAS | 18 | 2.2% |
| 15 | REVESTIMIENTOS | 18 | 2.2% |
| 16 | VARIOS | 17 | 2.1% |
| 17 | JARDINERÍA | 15 | 1.8% |
| 18 | CIELOS | 13 | 1.6% |
| 19 | MOLDAJES | 11 | 1.3% |
| 20 | MOVIMIENTO TIERRA | 11 | 1.3% |
| 21 | MOVIMIENTO DE TIERRAS | 10 | 1.2% |
| 22 | ESTRUCTURA METÁLICA | 10 | 1.2% |
| 23 | TRAZADO | 8 | 1.0% |
| 24 | ENFIERRADURAS | 7 | 0.9% |

**Total:** 816 APUs

### **3. Fuente de Datos**

- **Origen:** ONDAC Excel (Estándar chileno de construcción)
- **Formato:** Extracciones de planillas Excel profesionales
- **Moneda:** CLP (Pesos Chilenos)
- **Actualización:** Precios de referencia 2024-2025

### **4. Niveles de Completitud**

| Nivel | APUs | Descripción |
|-------|------|-------------|
| **Tier 1 (Completos)** | 562 | Con materiales, mano de obra, rendimiento y tips |
| **Tier 2 (Simplificados)** | 254 | Solo precio referencial y categoría |

---

## 🏛️ ARQUITECTURA DEL SISTEMA

### **Stack Tecnológico**

```
┌─────────────────────────────────────────┐
│         FRONTEND (PWA)                  │
│  • Vanilla JavaScript (ES6+)           │
│  • Chart.js (visualizaciones)          │
│  • Service Worker (offline)            │
│  • manifest.json (instalable)          │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      FIREBASE BACKEND (GCP)             │
│  • Cloud Firestore (DB NoSQL)          │
│  • Cloud Functions (Node.js)           │
│  • Firebase Hosting                    │
│  • Firebase Authentication             │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│       INTEGRACIONES EXTERNAS            │
│  • Google Gemini (Vertex AI)           │
│  • Telegram Bot API                    │
│  • 6 APIs de tiendas construcción      │
└─────────────────────────────────────────┘
```

### **Cloud Functions Endpoints**

| Endpoint | Método | Función |
|----------|--------|---------|
| `/api/chat` | POST | Chat con IA Gemini |
| `/generate-linking-code` | POST | Código vinculación Telegram |
| `/check-telegram-status` | POST | Verificar estado vinculación |
| `/telegram-webhook` | POST | Webhook bot Telegram |
| `/send-morning-notification` | POST | Notificación 7 AM |
| `/send-noon-notification` | POST | Notificación 12 PM |
| `/send-evening-notification` | POST | Notificación 6 PM |

---

## 📱 FUNCIONALIDADES PRINCIPALES

### **1. Gestión de Proyectos**

```javascript
// Estructura de proyecto en Firestore
users/{user_id}/projects/{project_id}/
├── name: string
├── created_at: timestamp
├── total_cost: number
├── activities: array<{
│   apu_id: string,
│   apu_name: string,
│   quantity: number,
│   unit: string,
│   unit_price: number,
│   subtotal: number,
│   materiales: array,
│   mano_obra: array
}>
```

**Límites:**
- **Free:** 3 proyectos
- **PRO:** Ilimitados

### **2. Navegador de APUs**

**Archivo:** `claudia-complete.js`

**Características:**
- Búsqueda en tiempo real (816 APUs)
- Filtro por 24 categorías
- Paginación (30 APUs por página)
- Preview mejorado con desglose de costos

**Módulo de Preview:** `claudia-apu-preview-enhanced.js`
```javascript
window.showAPUPreviewEnhanced(apuData)
// Muestra:
// - Precio unitario destacado
// - Breakdown: Materiales (azul), Mano obra (amarillo), Herramientas (morado)
// - Tips profesionales
// - Rendimiento (m²/HH, m³/HH, etc.)
```

### **3. Calculadora de Materiales**

**Archivo:** `claudia-materials.js`

**Proceso:**
1. Agrega materiales de múltiples APUs
2. Consolida cantidades totales
3. Compara precios en 6 tiendas:
   - Sodimac
   - Easy
   - Construmart
   - Homecenter
   - Imperial
   - Promart
4. Genera lista exportable (WhatsApp, PDF)

### **4. Bot de Telegram** ✨ ÚNICO EN MERCADO

**Archivo:** `claudia-telegram-linking.js`

**Flujo de vinculación:**
```
1. Usuario click "Conectar con Telegram"
2. Sistema genera código 6 dígitos (15 min validez)
3. Usuario envía "/link XXXXXX" a @ClaudIA_Bot
4. Polling cada 5s verifica vinculación
5. Confirmación en web app
```

**Comandos disponibles:**
- `/start` - Bienvenida
- `/link CODIGO` - Vincular cuenta web
- `/proyectos` - Ver proyectos activos
- `/presupuesto [proyecto]` - Ver costo total
- `/materiales [proyecto]` - Lista de compras
- `/help` - Ayuda

**Notificaciones proactivas:**
- **7:00 AM:** Resumen matutino + actividades del día
- **12:00 PM:** Estado medio día
- **6:00 PM:** Cierre jornada + pendientes

### **5. Chat con IA Constructor**

**Archivo:** `claudia-chat.js`

**Modelo:** Google Gemini 1.5 Pro (Vertex AI)

**Contexto del sistema:**
```javascript
const systemPrompt = `Eres CLAUDIA, asistente experta en construcción chilena.
Tienes acceso a 816 APUs profesionales en 24 categorías.
Ayudas con:
- Presupuestos y costos
- Recomendaciones de materiales
- Buenas prácticas constructivas
- Rendimientos de cuadrillas
- Normativa chilena (OGUC)

Responde en español de Chile, con términos técnicos profesionales.
Sé concisa pero precisa. Usa emojis ocasionalmente.`;
```

**Características:**
- Conversación contextual (historial)
- Sugerencias de APUs relacionados
- Cálculos en tiempo real
- Tips constructivos

---

## 🎨 MÓDULOS FRONTEND

### **Estructura de archivos:**

```
web_app/
├── index.html                          # SPA principal
├── landing.html                        # Landing comercial
├── manifest.json                       # PWA config
├── service-worker.js                   # Offline support
├── css/
│   ├── claudia.min.css                # Estilos base
│   └── claudia-main.min.css           # Estilos componentes
├── js/
│   ├── claudia-complete.js            # ⭐ Core principal (1750+ líneas)
│   ├── claudia-apus.js                # Carga APUs database
│   ├── claudia-apu-preview-enhanced.js # ✨ Preview mejorado (NEW)
│   ├── claudia-telegram-linking.js    # 🔗 Integración Telegram
│   ├── claudia-chat.js                # 💬 Chat IA
│   ├── claudia-materials.js           # 🛒 Calculadora materiales
│   ├── claudia-email-templates.js     # 📧 Templates email
│   └── claudia-indexeddb.js           # 💾 Cache local
├── apu_database.json                   # 📊 816 APUs (0.48 MB)
├── apu_database.min.json              # Versión minificada
└── apu_chunks/                         # APUs por categoría
    ├── hormigon.json
    ├── albanileria.json
    └── ... (24 archivos)
```

### **Módulo Core (`claudia-complete.js`)**

**Funciones principales:**

```javascript
// Gestión de proyectos
function createNewProject()
function switchProject(projectId)
function saveCurrentProject()
function deleteProject()

// APUs
function loadAPUDatabase()
function searchAPUs(query, category)
function addToProject(apuData)
function removeActivity(index)

// Cálculos
function calculateProjectTotal()
function generateMaterialsList()
function exportToPDF()
function shareViaWhatsApp()

// UI
function renderProject()
function renderAPUBrowser()
function showToast(message, type)
```

### **Preview Mejorado (`claudia-apu-preview-enhanced.js`)** ✨ NEW

**280 líneas** de código especializado:

```javascript
window.showAPUPreviewEnhanced = function(apuData) {
    // 1. Card precio principal (gradient verde)
    // 2. Info básica (unidad, rendimiento)
    // 3. Breakdown costos:
    //    - 🧱 Materiales (azul #3b82f6)
    //    - 👷 Mano obra (amarillo #f59e0b)
    //    - 🛠️ Herramientas (morado #a855f7)
    // 4. Descripción detallada
    // 5. Tips profesionales

    modal.style.display = 'flex';
}

window.closeAPUPreview = function() {
    modal.style.opacity = '0';
    setTimeout(() => modal.style.display = 'none', 300);
}
```

**Animaciones CSS:**
- Fade in: `opacity 0.3s ease`
- Scale bounce: `cubic-bezier(0.68, -0.55, 0.265, 1.55)`

---

## 💾 BASE DE DATOS (Firestore)

### **Colecciones principales:**

```
claudia-i8bxh (Firebase Project)
├── users/
│   ├── {user_id}/
│   │   ├── email: string
│   │   ├── plan: "free" | "pro"
│   │   ├── telegram_id: number
│   │   ├── telegram_username: string
│   │   ├── linked_at: timestamp
│   │   └── projects/
│   │       └── {project_id}/
│   │           ├── name: string
│   │           ├── created_at: timestamp
│   │           ├── total_cost: number
│   │           └── activities: array
│
├── telegram_linking_codes/
│   └── {code}/
│       ├── user_id: string
│       ├── created_at: timestamp
│       ├── expires_at: timestamp (15 min)
│       └── used: boolean
│
└── chat_history/
    └── {user_id}/
        └── messages/
            ├── role: "user" | "assistant"
            ├── content: string
            └── timestamp: timestamp
```

### **IndexedDB (Cliente)**

**Cache local para offline:**

```javascript
// Schema IndexedDB
const DB_NAME = 'claudia-cache';
const DB_VERSION = 2;

stores = {
    apus: {
        keyPath: 'id',
        indexes: ['categoria', 'nombre', 'precio_referencia']
    },
    projects: {
        keyPath: 'id',
        indexes: ['created_at', 'total_cost']
    }
}
```

---

## 🚀 DEPLOYMENT

### **Firebase Hosting**

```bash
# Configuración firebase.json
{
  "hosting": {
    "public": "web_app",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{
      "source": "**",
      "destination": "/index.html"
    }]
  }
}

# Deploy
firebase use claudia-i8bxh
firebase deploy --only hosting

# URL: https://claudia-i8bxh.web.app
```

### **Performance Metrics**

| Métrica | Valor |
|---------|-------|
| **First Contentful Paint** | < 1.5s |
| **Time to Interactive** | < 3.0s |
| **Bundle Size** | 2.5 MB (incluye 816 APUs) |
| **Service Worker Cache** | 3.2 MB |
| **Offline Capability** | ✅ Full |
| **PWA Score (Lighthouse)** | 95/100 |

---

## 💰 MODELO DE NEGOCIO

### **Planes**

| Feature | Free | PRO (CLP $40k/año) |
|---------|------|---------------------|
| **Proyectos** | 3 | ∞ Ilimitados |
| **APUs** | 816 (24 categorías) | 816 (24 categorías) |
| **Lista compras** | ✅ | ✅ |
| **Comparador 6 tiendas** | ✅ | ✅ |
| **Chat IA** | ❌ | ✅ Ilimitado |
| **Bot Telegram** | ❌ | ✅ |
| **Notificaciones 24/7** | ❌ | ✅ (7 AM, 12 PM, 6 PM) |
| **Sugerencias IA** | ❌ | ✅ |
| **Soporte prioritario** | ❌ | ✅ |

### **Diferenciadores de Mercado** 🏆

1. **✅ ÚNICO con integración Telegram en construcción**
2. **✅ ÚNICO con notificaciones proactivas 3x día**
3. **✅ ÚNICO con sugerencias IA de actividades relacionadas**
4. ✅ 816 APUs chilenos (mayor base del mercado)
5. ✅ Comparador 6 tiendas en tiempo real
6. ✅ Offline-first PWA

---

## 🔐 SEGURIDAD

### **Autenticación**
- Firebase Authentication (Email/Password)
- Tokens JWT refresh automático
- Session timeout: 30 días

### **Autorización**
```javascript
// Firestore Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;

      match /projects/{projectId} {
        allow read, write: if request.auth.uid == userId;
      }
    }

    match /telegram_linking_codes/{code} {
      allow read: if request.auth != null;
      allow write: if false; // Solo Cloud Functions
    }
  }
}
```

### **Protección de Datos**
- HTTPS obligatorio
- Tokens Telegram encriptados
- Sin almacenamiento de tarjetas (Stripe/Flow para pagos)

---

## 📊 ANALYTICS

### **Métricas clave:**

```javascript
// Google Analytics 4 Events
gtag('event', 'apu_preview', {
  apu_id: apuData.id,
  categoria: apuData.categoria
});

gtag('event', 'project_created', {
  plan: userPlan
});

gtag('event', 'telegram_linked', {
  user_id: userId
});

gtag('event', 'materials_generated', {
  total_items: materiales.length,
  total_cost: totalCost
});
```

---

## 🐛 CORRECCIONES RECIENTES (2025-01-14)

### **Sesión de mejoras:**

1. ✅ **APU Preview Mejorado**
   - Archivo: `claudia-apu-preview-enhanced.js` (280 líneas NEW)
   - Breakdown visual con colores
   - Tips profesionales
   - Animaciones suaves

2. ✅ **Fix Botón Telegram**
   - Cambio de `onclick` inline a `addEventListener`
   - Mejor manejo de errores
   - Feedback visual hover

3. ✅ **Corrección Números APUs**
   - ❌ Antes: "206 APUs"
   - ✅ Ahora: "816 APUs en 24 categorías"
   - Archivos actualizados:
     - `landing.html`
     - `claudia-email-templates.js`
     - `claudia-complete.js`

4. ✅ **Deploy exitoso**
   - 132 archivos
   - 3 archivos modificados
   - URL: https://claudia-i8bxh.web.app

---

## 📝 ROADMAP FUTURO

### **Q1 2025**
- [ ] API REST pública para APUs
- [ ] Webhooks para notificaciones
- [ ] Integración WhatsApp Business
- [ ] Exportación Excel avanzada

### **Q2 2025**
- [ ] Mobile app nativa (React Native)
- [ ] Modo colaborativo (múltiples usuarios/proyecto)
- [ ] Análisis predictivo de costos (ML)
- [ ] Integración ERP construcción

---

## 👥 TARGET USERS

1. **Maestros constructores** (80%)
   - Gestión de pequeñas/medianas obras
   - Presupuestos rápidos
   - Listas de compras

2. **Constructoras pequeñas** (15%)
   - Múltiples proyectos simultáneos
   - Control de costos

3. **Arquitectos/Ingenieros** (5%)
   - Estimaciones preliminares
   - Validación de costos

---

## 📞 CONTACTO TÉCNICO

**Proyecto:** CLAUDIA - Asistente IA Construcción
**Firebase Project ID:** claudia-i8bxh
**Hosting URL:** https://claudia-i8bxh.web.app
**Landing URL:** https://claudia-i8bxh.web.app/landing.html
**Región GCP:** us-central1
**Última actualización:** 2025-01-14

---

**Developed with ❤️ for Chilean Construction Industry**

*"De maestros, para maestros. Con tecnología de punta."*
