# 🏗️ CLAUDIA SODIMAC PRO

Asistente Inteligente de Construcción con IA para Sodimac Chile

**Live Demo:** https://claudia-i8bxh.web.app

---

## 📋 Descripción

CLAUDIA SODIMAC es una plataforma integral que combina:

- **Web App** (Frontend): Sistema de presupuestos con APUs profesionales
- **Telegram Bot** (Backend): Asistente IA para maestros constructores

---

## 🚀 Características

### Web App (Deployed)

✅ **Sistema de Proyectos**
- Crear y gestionar proyectos de construcción
- Agregar múltiples actividades (APUs)
- Presupuestos automáticos con materiales + mano de obra
- Plan de pagos integrado (30-40-30)

✅ **Búsqueda Inteligente con IA**
- Búsqueda multicriterio (actividad, material, categoría)
- Filtros por categoría profesional
- Base de datos de APUs chilenos

✅ **Chat con Claudia**
- Asistente IA para consultas de construcción
- Bitácora de obra
- Alertas y tareas sugeridas

✅ **Optimización Móvil**
- Responsive design (celular, tablet, desktop)
- PWA compatible
- UI/UX profesional con branding Sodimac

### Telegram Bot (Backend)

🤖 **Módulos Profesionales:**
- `ai_core_sodimac.py` - Motor de IA con Gemini 1.5
- `materials_calculator.py` - Cálculo de materiales
- `budget_optimizer.py` - Optimización de presupuestos
- `project_manager.py` - Gestión de proyectos y bitácora
- `visual_inspector.py` - Inspección visual con IA
- `sodimac_scraper.py` - Búsqueda de materiales

---

## 📂 Estructura del Proyecto

```
claudia_bot/
├── web_app/                    # Frontend (Firebase Hosting)
│   ├── index.html             # UI principal
│   ├── claudia-pro.js         # Sistema de proyectos
│   ├── claudia-smart.js       # Chat IA + Bitácora
│   └── apu_database.json      # Base de datos APUs
│
├── claudia_modules/            # Backend modules
│   ├── ai_core_sodimac.py     # Core IA
│   ├── materials_calculator.py
│   ├── budget_optimizer.py
│   ├── project_manager.py
│   ├── visual_inspector.py
│   ├── sodimac_scraper.py
│   ├── telegram_api.py
│   └── config.py
│
├── main_sodimac.py            # Cloud Function entry point
├── requirements.txt           # Python dependencies
├── firebase.json              # Firebase config
│
├── APU/                       # APU source files
├── docs/                      # Documentation
├── scripts/                   # Utility scripts
└── tests/                     # Test files
```

---

## 🔧 Tecnologías

**Frontend:**
- HTML5 + CSS3 (Grid, Flexbox)
- Vanilla JavaScript (ES6+)
- Firebase Hosting
- PWA Ready

**Backend:**
- Python 3.11
- Google Cloud Functions
- Firestore (NoSQL Database)
- Gemini 1.5 (Flash + Pro)
- Telegram Bot API

---

## 🚀 Deployment

### Web App (Ya deployado)

```bash
firebase deploy --only hosting
```

**URL Live:** https://claudia-i8bxh.web.app

### Backend (Cloud Functions)

```bash
gcloud functions deploy claudia_webhook \
  --runtime python311 \
  --trigger-http \
  --entry-point main_sodimac \
  --allow-unauthenticated
```

---

## 💾 Base de Datos

**Firestore Collections:**
- `users/` - Datos de usuarios
- `projects/` - Proyectos de construcción
- `bitacora/` - Entradas de bitácora
- `conversations/` - Historial de chat

**LocalStorage (Web App):**
- `claudia_project` - Proyecto actual del usuario
- Chat history y preferencias

---

## 📱 Uso

### Web App

1. Accede a https://claudia-i8bxh.web.app
2. Crea un proyecto
3. Busca actividades APU
4. Agrega al proyecto con cantidades
5. Ve presupuesto completo con plan de pagos
6. Chatea con Claudia para consultas

### Telegram Bot

1. Busca @claudia_sodimac_bot
2. Inicia conversación
3. Consulta sobre construcción
4. Sube fotos para inspección
5. Gestiona proyectos
6. Recibe bitácora diaria

---

## 🛠️ Desarrollo Local

```bash
# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
export GEMINI_API_KEY="tu_api_key"
export TELEGRAM_TOKEN="tu_token"

# Ejecutar localmente
python main_sodimac.py
```

---

## 📊 APU Database

**Fuente:** Elaboración propia con IA
**Total APUs:** 6 actividades profesionales
**Categorías:**
- Hormigones
- Albañilería
- Movimiento Tierra
- Moldajes
- Enfierraduras
- Revestimientos
- Pavimentos
- Faena
- Varios

---

## 👥 Equipo

- **Desarrollo IA:** Claude (Anthropic)
- **Cliente:** Pablo Cussen
- **Plataforma:** Sodimac Chile

---

## 📄 Licencia

Proyecto propietario - Sodimac Chile

---

## 📞 Contacto

**Email:** pablo@cussen.cl
**Proyecto:** ClaudIA Sodimac
**Firebase:** claudia-i8bxh
