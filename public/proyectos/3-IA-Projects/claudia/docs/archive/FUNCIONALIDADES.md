# 🎯 CLAUDIA SODIMAC - Funcionalidades Completas

## 🌐 WEB APP (Live: https://claudia-i8bxh.web.app)

### 1️⃣ Sistema de Proyectos
**Archivo:** `web_app/claudia-pro.js`

**Funciones principales:**
- ✅ `loadProject()` - Carga proyecto desde localStorage
- ✅ `saveProject()` - Guarda proyecto automáticamente
- ✅ `renderProject()` - Renderiza lista de actividades
- ✅ `addActivityToProject()` - Agrega APU al proyecto
- ✅ `removeActivity()` - Elimina actividad del proyecto
- ✅ `viewProjectBudget()` - Muestra presupuesto completo con plan de pagos

**Características:**
- 📋 Proyectos con nombre personalizable
- ➕ Agregar múltiples actividades (APUs)
- 💰 Cálculo automático de totales
- 📊 Presupuesto detallado por actividad
- 💳 Plan de pagos integrado (30-40-30)
- 💾 Persistencia en localStorage

---

### 2️⃣ Búsqueda Inteligente de APUs
**Archivo:** `web_app/claudia-pro.js`

**Funciones principales:**
- ✅ `initAPUNavigator()` - Inicializa navegador de APUs
- ✅ `handleSmartSearch()` - Búsqueda inteligente multicriterio
- ✅ `filterByCategory()` - Filtrado por categoría profesional
- ✅ `renderAPUs()` - Renderiza tarjetas de APUs
- ✅ `selectAPU()` - Selecciona APU para agregar

**Características:**
- 🔍 Búsqueda por nombre de actividad
- 📦 Búsqueda por material
- 🏗️ Búsqueda por categoría
- 👷 Búsqueda por tipo de mano de obra
- ⚡ Debounce optimizado (300ms)
- 🎯 Búsqueda semántica con keywords

**Categorías disponibles:**
1. HORMIGONES 🏗️
2. ALBANILERIA 🧱
3. MOVIMIENTO TIERRA ⛏️
4. MOLDAJES 📐
5. ENFIERRADURAS ⚙️
6. REVESTIMIENTOS 🎨
7. PAVIMENTOS 🛣️
8. FAENA 🏕️
9. VARIOS 📦

---

### 3️⃣ Chat con IA
**Archivo:** `web_app/claudia-smart.js`

**Funciones principales:**
- ✅ `sendMessage()` - Envía mensaje a Claudia
- ✅ `getClaudiaResponse()` - Obtiene respuesta de IA
- ✅ `processUserInput()` - Procesa entrada del usuario
- ✅ `generateAlerts()` - Genera alertas inteligentes
- ✅ `updateBitacora()` - Actualiza bitácora de obra

**Características:**
- 💬 Chat conversacional con IA
- 🧠 Contexto de conversación persistente
- 📝 Generación automática de bitácora
- 🔔 Alertas y tareas inteligentes
- ✅ Tareas con checkboxes interactivos
- 💾 Historial guardado en localStorage

**IA Capabilities:**
- Responde consultas de construcción
- Sugiere materiales y cantidades
- Genera tareas según conversación
- Detecta fases de proyecto
- Recomienda mejoras

---

### 4️⃣ Cálculo de Presupuestos
**Archivo:** `web_app/claudia-pro.js`

**Funciones principales:**
- ✅ `calculateAPU()` - Calcula presupuesto de APU
- ✅ `mostrarResultados()` - Muestra resultados detallados
- ✅ `formatMoney()` - Formato chileno de dinero

**Características:**
- 📦 Cálculo de materiales por APU
- 👷 Cálculo de mano de obra
- 💰 Precios actualizados 2024
- 📊 Desglose por ítem
- 💳 Plan de pagos automático
- 🇨🇱 Formato de dinero chileno ($200.000)

**Precios incluidos (28 items):**
- Materiales básicos (cemento, arena, ripio)
- Ladrillos y bloques
- Fierros y mallas
- Madera y clavos
- Mano de obra especializada

---

### 5️⃣ Base de Datos APU
**Archivo:** `web_app/apu_database.json`

**Estructura:**
```json
{
  "actividades": [
    {
      "id": "radier_10cm",
      "nombre": "Radier e=10cm, 212.5 kg/m3",
      "unidad": "m2",
      "categoria": "HORMIGONES",
      "materiales": [...],
      "mano_obra": [...],
      "rendimiento": "3.5 m2/HH",
      "precio_referencia": 18500
    }
  ],
  "metadata": {
    "fuente": "Elaboración propia con IA",
    "total_apus": 6,
    "categorias": [...]
  }
}
```

**APUs disponibles:**
1. Radier e=10cm
2. Albañilería Ladrillo Fiscal e=15cm
3. Excavación zanja a brazo
4. Moldaje muro (2.5 usos)
5. Enfierradura D=10mm A44-28
6. Estuco exterior sobre albañilería

---

## 🤖 BACKEND (Telegram Bot)

### 1️⃣ Core de IA
**Archivo:** `claudia_modules/ai_core_sodimac.py`

**Clase:** `ClaudiaSodimac`

**Funciones principales:**
- ✅ `get_sodimac_response()` - Respuesta IA principal
- ✅ `process_text_message()` - Procesa mensaje de texto
- ✅ `process_photo_message()` - Procesa foto con análisis IA
- ✅ `get_base_prompt()` - Genera prompt base chileno
- ✅ `extract_calculations()` - Extrae cálculos de texto

**Características:**
- 🧠 Gemini 1.5 Flash (respuestas rápidas)
- 🎓 Gemini 1.5 Pro (análisis complejos)
- 🇨🇱 Personalidad chilena (maestro constructor)
- 📸 Análisis visual de imágenes
- 💾 Contexto persistente en Firestore
- 📊 Generación de reportes

---

### 2️⃣ Calculadora de Materiales
**Archivo:** `claudia_modules/materials_calculator.py`

**Clase:** `MaterialsCalculator`

**Funciones principales:**
- ✅ `calculate_concrete()` - Calcula hormigón
- ✅ `calculate_masonry()` - Calcula albañilería
- ✅ `calculate_excavation()` - Calcula excavación
- ✅ `calculate_steel()` - Calcula fierros
- ✅ `calculate_paint()` - Calcula pintura
- ✅ `estimate_labor()` - Estima mano de obra

**Características:**
- 📐 Fórmulas profesionales NCh
- 🔢 Cálculos precisos por tipo
- 👷 Estimación de HH (horas hombre)
- 📊 Rendimientos estándar chilenos
- ✅ Validación de inputs

---

### 3️⃣ Optimizador de Presupuestos
**Archivo:** `claudia_modules/budget_optimizer.py`

**Clases:**
- `BudgetItem` - Item de presupuesto
- `BudgetOptimizer` - Optimizador principal
- `PaymentPlanGenerator` - Generador de planes

**Funciones principales:**
- ✅ `optimize_budget()` - Optimiza presupuesto
- ✅ `find_alternatives()` - Busca alternativas
- ✅ `calculate_bulk_discount()` - Calcula descuentos
- ✅ `generate_payment_plan()` - Genera plan de pagos
- ✅ `calculate_installments()` - Calcula cuotas

**Características:**
- 💰 Optimización de costos
- 🔄 Búsqueda de alternativas
- 📊 Descuentos por volumen
- 💳 Planes de pago personalizados
- 📈 Análisis de factibilidad

---

### 4️⃣ Gestor de Proyectos
**Archivo:** `claudia_modules/project_manager.py`

**Clases:**
- `Project` - Proyecto de construcción
- `BitacoraEntry` - Entrada de bitácora
- `Task` - Tarea del proyecto
- `ProjectManager` - Gestor principal

**Funciones principales:**
- ✅ `create_project()` - Crea proyecto
- ✅ `update_project()` - Actualiza proyecto
- ✅ `add_bitacora_entry()` - Agrega entrada bitácora
- ✅ `generate_daily_briefing()` - Genera resumen diario
- ✅ `get_project_status()` - Estado del proyecto

**Características:**
- 📋 Gestión completa de proyectos
- 📝 Bitácora automática de obra
- ✅ Sistema de tareas
- 📊 Seguimiento de presupuesto
- 🎯 Alertas de progreso
- 📈 Reportes automáticos

---

### 5️⃣ Inspector Visual
**Archivo:** `claudia_modules/visual_inspector.py`

**Clase:** `VisualInspector`

**Funciones principales:**
- ✅ `analyze_image()` - Analiza imagen con IA
- ✅ `detect_issues()` - Detecta problemas
- ✅ `measure_progress()` - Mide avance
- ✅ `generate_inspection_report()` - Genera reporte
- ✅ `compare_images()` - Compara antes/después

**Características:**
- 📸 Análisis visual con Gemini Vision
- 🔍 Detección de problemas
- 📏 Estimación de medidas
- 📊 Reportes de inspección
- ⚠️ Identificación de riesgos
- ✅ Validación de calidad

---

### 6️⃣ Scraper de Sodimac
**Archivo:** `claudia_modules/sodimac_scraper.py`

**Funciones principales:**
- ✅ `search_materials()` - Busca materiales
- ✅ `get_product_details()` - Obtiene detalles
- ✅ `get_price()` - Obtiene precio actualizado
- ✅ `check_availability()` - Verifica stock

**Características:**
- 🛒 Búsqueda en catálogo Sodimac
- 💰 Precios en tiempo real
- 📦 Verificación de stock
- 🔗 Links directos a productos
- 📊 Comparación de opciones

---

### 7️⃣ API de Telegram
**Archivo:** `claudia_modules/telegram_api.py`

**Clase:** `TelegramSender`

**Funciones principales:**
- ✅ `send_message()` - Envía mensaje
- ✅ `send_photo()` - Envía foto
- ✅ `send_document()` - Envía documento
- ✅ `edit_message()` - Edita mensaje
- ✅ `answer_callback()` - Responde callbacks

**Características:**
- 📱 Integración completa Telegram
- 🖼️ Envío de multimedia
- ⌨️ Teclados inline
- 📄 Envío de documentos
- ✅ Confirmaciones de lectura

---

## 📊 Bases de Datos

### Firestore Collections:

1. **users/**
   - user_id
   - name
   - phone
   - registration_date
   - preferences

2. **projects/**
   - project_id
   - user_id
   - name
   - phase
   - budget
   - start_date
   - status

3. **bitacora/**
   - entry_id
   - project_id
   - date
   - activity
   - materials_used
   - hours_worked
   - notes
   - photos

4. **conversations/**
   - user_id
   - messages[]
   - context
   - last_updated

### LocalStorage (Web):

1. **claudia_project**
   - name
   - activities[]
   - total

2. **claudia_chat_history**
   - messages[]
   - timestamp

3. **claudia_bitacora**
   - entries[]

---

## 🎨 UI/UX Features

### Responsive Design
- ✅ Mobile First (768px breakpoint)
- ✅ Tablet optimized (769-1200px)
- ✅ Desktop full (1200px+)

### Animations
- ✅ Smooth scrolls
- ✅ Hover effects
- ✅ Transitions (0.3s ease)
- ✅ Scale transforms

### Accessibility
- ✅ Touch targets (44px minimum)
- ✅ Readable fonts (14-18px)
- ✅ High contrast colors
- ✅ Clear visual hierarchy

---

## ⚡ Performance

- ✅ Debounced search (300ms)
- ✅ Lazy loading de componentes
- ✅ LocalStorage para caché
- ✅ Optimización de imágenes
- ✅ Minificación de assets

---

## 🔐 Seguridad

- ✅ Input validation
- ✅ XSS protection
- ✅ HTTPS only
- ✅ API key management
- ✅ Rate limiting (backend)

---

## 📈 Próximas Mejoras Sugeridas

1. **PWA Completa**
   - Service Worker
   - Offline mode
   - Install prompt

2. **Más APUs**
   - Ampliar base de datos
   - 576 APUs de ONDA
   - Categorización avanzada

3. **Export/Share**
   - PDF de presupuestos
   - Share en WhatsApp
   - Email reports

4. **Multi-proyecto**
   - Gestión de múltiples proyectos
   - Comparación de presupuestos
   - Archivo histórico

5. **Integración Sodimac**
   - API real de productos
   - Compra directa
   - Puntos CMR

---

**Última actualización:** Octubre 2024
**Versión:** 1.0 PRO
