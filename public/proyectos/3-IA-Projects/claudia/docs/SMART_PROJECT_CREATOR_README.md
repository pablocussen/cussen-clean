# 🤖 CLAUDIA SMART PROJECT CREATOR

## Resuelve el problema de Pablo Araya

**Problema original:** Cuando un usuario crea un proyecto como "Remodelación baño", tiene que buscar y agregar manualmente cada partida (APU). Es tedioso y se olvidan partidas importantes.

**Solución implementada:** IA (Gemini) sugiere automáticamente 15-25 APUs relevantes con cantidades estimadas basadas en el nombre del proyecto.

---

## 🎯 ¿Qué hace?

1. Usuario escribe "Remodelación baño 6m²"
2. CLAUDIA analiza con IA y sugiere:
   - Demoliciones
   - Gasfitería
   - Cerámicas
   - Sanitarios
   - Instalaciones
   - Terminaciones
   - Etc.
3. Usuario selecciona con checkboxes cuáles agregar
4. Proyecto se crea con APUs pre-cargados

---

## 📁 Archivos Creados

### **Backend (Python + Gemini)**

1. **`claudia_modules/apu_suggestions.py`**
   - Módulo principal de sugerencias IA
   - Función `suggest_apus_for_project()` que llama a Gemini
   - Carga 816 APUs de Firestore
   - Retorna sugerencias con cantidades estimadas

2. **`main.py`** (modificado)
   - Agregado endpoint HTTP `suggest_project_apus`
   - URL: `https://us-central1-claudia-i8bxh.cloudfunctions.net/suggest_project_apus`
   - Método: POST
   - CORS habilitado

### **Frontend (JavaScript + CSS)**

3. **`web_app/js/claudia-smart-project-creator.js`**
   - Modal inteligente para crear proyectos
   - Conexión con API de sugerencias
   - Checkboxes para selección múltiple
   - Loading states con spinner

4. **`web_app/css/smart-project-creator.css`**
   - Estilos PRO para el modal
   - Responsive design
   - Animaciones suaves
   - Badges de confianza (alta/media/baja)

5. **`web_app/js/claudia-complete.js`** (modificado)
   - Función `createNewProject()` ahora llama al modal IA
   - Fallback al método antiguo si módulo no carga

6. **`web_app/index.html`** (modificado)
   - Agregados scripts y CSS del Smart Creator

### **Testing**

7. **`test_smart_suggestions.py`**
   - Script de prueba con 5 casos reales
   - Baño, cocina, casa, quincho, cierre
   - Muestra resultados detallados

---

## 🚀 Deployment

### **Frontend (Hosting) - ✅ DEPLOYADO**

```bash
cd "G:\Mi unidad\Proyectos\3-IA\claudia_bot"
firebase deploy --only hosting
```

**URL:** https://claudia-i8bxh.web.app

### **Backend (Cloud Function) - ⚠️ PENDIENTE**

La Cloud Function `suggest_project_apus` está lista en `main.py` pero necesita ser deployada.

**❌ PROBLEMA CON FIREBASE DEPLOY:**
Firebase CLI está buscando un virtualenv que no existe:
```
Error: spawn "G:\Mi unidad\Proyectos\3-IA\claudia_bot\venv\Scripts\activate.bat" ENOENT
```

**✅ SOLUCIÓN: Deploy Manual desde Google Cloud Console**

1. Ir a: https://console.cloud.google.com/functions?project=claudia-i8bxh
2. Click "CREATE FUNCTION"
3. Configuración:
   - **Environment**: 2nd gen
   - **Function name**: `suggest_project_apus`
   - **Region**: `us-central1`
   - **Trigger type**: HTTPS
   - **Authentication**: Allow unauthenticated invocations ✅
   - **Memory**: 512 MB
   - **Timeout**: 60 seconds
4. Click "NEXT" → Runtime, build, connections and security settings
5. Runtime:
   - **Runtime**: Python 3.11
   - **Entry point**: `suggest_project_apus`
6. Variables de entorno:
   - `GEMINI_API_KEY`: (tu clave de Gemini)
7. Código fuente:
   - **Source code**: Inline editor
   - Copiar contenido de `main.py` completo
   - Crear carpeta `claudia_modules/` y copiar `apu_suggestions.py`
   - Copiar `requirements.txt`
8. Click "DEPLOY"
9. Esperar ~2-3 minutos
10. URL final: `https://us-central1-claudia-i8bxh.cloudfunctions.net/suggest_project_apus`

**Opción alternativa si tienes gcloud funcionando:**

```bash
gcloud functions deploy suggest_project_apus \
  --gen2 \
  --runtime=python311 \
  --region=us-central1 \
  --source=. \
  --entry-point=suggest_project_apus \
  --trigger-http \
  --allow-unauthenticated \
  --project=claudia-i8bxh
```

---

## 📊 API Endpoint

### **Request**

```bash
POST https://us-central1-claudia-i8bxh.cloudfunctions.net/suggest_project_apus
Content-Type: application/json

{
  "project_name": "Remodelación baño 6m²",
  "project_description": "Baño completo con ducha",  // opcional
  "surface_area": 6.0  // opcional
}
```

### **Response**

```json
{
  "success": true,
  "project_type": "baño",
  "confidence": "high",
  "count": 18,
  "total_estimated": 1547000,
  "suggestions": [
    {
      "apu_id": "abc123",
      "nombre": "Demolición muro ladrillo",
      "categoria": "DEMOLICIONES",
      "unidad": "m2",
      "cantidad_estimada": 15.0,
      "precio_unitario": 8500,
      "subtotal": 127500,
      "justificacion": "Necesario para remodelación completa",
      "confidence": "high"
    },
    ...
  ],
  "warnings": [
    "Verificar instalaciones existentes antes de demoler"
  ]
}
```

---

## 🧪 Testing Local

```bash
# Probar el módulo Python directamente
cd "G:\Mi unidad\Proyectos\3-IA\claudia_bot"
python test_smart_suggestions.py
```

**Casos de prueba incluidos:**
- ✅ Remodelación baño 6m²
- ✅ Ampliación cocina 15m²
- ✅ Casa básica 80m²
- ✅ Quincho 4x6m
- ✅ Cierre perímetro 20m

---

## 🎨 UI Features

### **Modal Inteligente**
- Input nombre proyecto
- Textarea descripción (opcional)
- Input superficie m² (opcional)
- Botón "Crear Sin Sugerencias" (fallback)
- Botón "🤖 Generar Sugerencias IA"

### **Loading State**
- Spinner animado
- Mensaje: "CLAUDIA está analizando tu proyecto..."
- Tip: "Esto puede tomar 5-10 segundos"

### **Resultados**
- Badge de confianza (Alta ✅ / Media ⚠️ / Baja ❓)
- 3 stats principales:
  - 📊 APUs Sugeridos
  - 💰 Presupuesto Estimado
  - 🏗️ Tipo de Proyecto
- Advertencias si existen
- Lista scrollable de APUs con checkboxes
- Botones "Seleccionar Todos" / "Deseleccionar Todos"

### **Cada APU muestra:**
- ✅ Checkbox (checked por defecto)
- Nombre del APU
- Categoría (badge coloreado)
- Cantidad estimada + unidad
- Precio subtotal
- 💡 Justificación (por qué es necesario)

---

## 💡 Cómo Funciona (Técnico)

### **1. Usuario crea proyecto**
```javascript
createNewProject() → showSmartProjectCreationModal()
```

### **2. Usuario ingresa datos**
- Nombre: "Remodelación baño 6m²"
- (Opcional) Descripción: "Baño completo con ducha"
- (Opcional) Superficie: 6

### **3. Click "Generar Sugerencias IA"**
```javascript
generateSmartSuggestions() → fetch Cloud Function
```

### **4. Cloud Function procesa**
```python
suggest_project_apus() {
    1. Obtener 816 APUs de Firestore
    2. Crear prompt para Gemini con categorías
    3. Gemini analiza y retorna 15-25 APUs relevantes
    4. Validar APUs vs database
    5. Calcular precios y subtotales
    6. Retornar JSON
}
```

### **5. Frontend muestra resultados**
```javascript
- Ocultar loading
- Mostrar badge confianza
- Render lista APUs con checkboxes
- Usuario selecciona cuáles agregar
```

### **6. Crear proyecto con APUs**
```javascript
createProjectWithSuggestions() {
    1. Crear proyecto vacío
    2. Foreach checkbox checked → agregar APU
    3. Guardar en LocalStorage
    4. Actualizar UI
    5. Toast "✅ Proyecto creado con X APUs"
}
```

---

## 🔥 Ventajas vs Templates Estáticos

### **Antes (Templates)**
- ❌ Solo 6 templates predefinidos
- ❌ Cantidades genéricas
- ❌ No se adapta al proyecto específico
- ❌ Usuario igual tiene que agregar partidas faltantes

### **Ahora (IA Inteligente)**
- ✅ Análisis personalizado de cada proyecto
- ✅ Cantidades estimadas según superficie
- ✅ Justificación de por qué cada APU es necesario
- ✅ Detecta partidas que el usuario podría olvidar
- ✅ Se adapta a cualquier tipo de proyecto
- ✅ Badge de confianza (alta/media/baja)
- ✅ Warnings si hay consideraciones especiales

---

## 📈 Próximas Mejoras (Futuro)

1. **Aprendizaje continuo**
   - Guardar proyectos completados
   - Mejorar sugerencias basadas en histórico

2. **Fotos + IA Vision**
   - Subir foto del terreno
   - Gemini Vision analiza y sugiere más preciso

3. **Comparación presupuesto real vs estimado**
   - Feedback loop para mejorar precisión

4. **Sugerencias durante el proyecto**
   - "Agregaste radier, ¿olvidaste la malla Acma?"

---

## ✅ Status Implementación

| Componente | Status | Notas |
|------------|--------|-------|
| Backend Python | ✅ Completo | `apu_suggestions.py` funcional |
| Endpoint HTTP | ✅ Completo | `suggest_project_apus` en `main.py` |
| Frontend JS | ✅ Completo | Modal + checkboxes implementados |
| Frontend CSS | ✅ Completo | Diseño PRO responsive |
| Hosting Deploy | ✅ Deployado | https://claudia-i8bxh.web.app |
| Function Deploy | ⚠️ Pendiente | Requiere `gcloud deploy` manual |
| Testing Script | ✅ Completo | `test_smart_suggestions.py` |

---

## 🎬 Demo Flow (Usuario Final)

1. Click botón "Nuevo Proyecto"
2. Se abre modal "🤖 Crear Proyecto Inteligente"
3. Escribe "Remodelación baño 6m²"
4. Click "🤖 Generar Sugerencias IA"
5. **Espera 5-10 segundos** (Gemini pensando...)
6. Ve 18 APUs sugeridos con checkboxes
7. Deselecciona 2-3 que no necesita
8. Click "✅ Crear Proyecto con APUs Seleccionados"
9. Proyecto creado con 15 APUs pre-cargados
10. **Ahorra 30 minutos** vs agregar manualmente

---

## 🛠️ Troubleshooting

### **Error: "Servicio de sugerencias no disponible"**
- Verificar que Cloud Function está deployada
- Verificar GEMINI_API_KEY configurada
- Verificar Firestore tiene APUs cargados

### **Error: "No se pudieron cargar APUs"**
- Verificar conexión a Firestore
- Verificar colección "apus" existe
- Verificar permisos de lectura

### **Sugerencias con confianza baja**
- Proyecto muy específico/único
- Nombre poco descriptivo
- Gemini no tiene contexto suficiente
- **Solución:** Agregar descripción detallada

### **Precios muy altos/bajos**
- Precios unitarios pueden estar desactualizados
- **Solución:** Actualizar precios en Firestore

---

## 📞 Contacto

**Desarrollador:** Claude + Pablo Cussen
**Fecha:** 2025-01-17
**Versión:** 1.0 PRO
**Tiempo desarrollo:** 2 horas (como solicitado)

---

**🎯 Objetivo cumplido: Pablo ahora tiene sugerencias inteligentes en lugar de buscar APUs manualmente.**
