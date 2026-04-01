# 📊 CLAUDIA v5.0 - Sistema de Analytics y Tracking

## 🎯 Sistema Completo de Captura de Datos del Usuario

---

## ✅ IMPLEMENTADO

### Sistema ClaudiaAnalytics (Clase JavaScript)

**Archivo:** `claudia-analytics.js` (430 líneas)

**Capacidades:**
- User ID único persistente
- Session tracking
- Captura de todas las interacciones
- Almacenamiento en localStorage
- GDPR compliant (exportar/eliminar datos)

---

## 📦 Datos Capturados

### 1. **Perfil del Usuario**
```javascript
{
  user_id: "user_1729600000_abc123",
  profile: {
    created_at: "2025-10-22T12:00:00Z",
    last_active: "2025-10-22T12:30:00Z"
  }
}
```

### 2. **Analytics Generales**
```javascript
analytics: {
  projects_created: 5,
  activities_added: 42,
  favorites_count: 8,
  total_budget: 8750000,
  session_count: 15,
  apus_searched: 127,
  exports_count: 3
}
```

### 3. **Compras de Materiales** 💰
```javascript
purchases: [
  {
    id: "purchase_1729600000",
    project_id: "proj_123",
    activity_id: "apu_pintura",
    material: "Cemento Portland",
    quantity: 50,
    unit: "saco",
    price: 9500,
    total: 475000,
    provider: "Construmart",
    date: "2025-10-22T10:30:00Z",
    notes: "Entrega rápida, buen servicio"
  }
]
```

**Métodos:**
- `addPurchase(purchase)` - Registrar compra
- `getPurchasesByProject(projectId)` - Compras por proyecto
- `getTotalSpent(projectId)` - Total gastado en proyecto

### 4. **Sentimientos del Usuario** 😊😟
```javascript
sentiments: [
  {
    id: "sent_1729600000",
    project_id: "proj_123",
    date: "2025-10-22T15:00:00Z",
    type: "satisfaction", // satisfaction|frustration|excitement|worry
    score: 5, // 1-5
    comment: "Todo va muy bien, equipo trabajando perfecto",
    context: "Durante instalación de pisos"
  }
]
```

**Métodos:**
- `addSentiment(sentiment)` - Registrar sentimiento

### 5. **Experiencias** 📝
```javascript
experiences: [
  {
    id: "exp_1729600000",
    project_id: "proj_123",
    type: "problem", // problem|success|learning|tip
    title: "Cemento llegó con retraso",
    description: "Proveedor tuvo problemas logísticos",
    date: "2025-10-22T09:00:00Z",
    activity_related: "hormigon_h30",
    solution: "Cambié de proveedor para próximas compras"
  }
]
```

**Métodos:**
- `addExperience(experience)` - Registrar experiencia

### 6. **Interacciones** 🖱️
```javascript
interactions: [
  {
    id: "int_1729600000",
    session_id: "session_abc123",
    timestamp: "2025-10-22T12:15:30Z",
    action: "search_apu",
    details: {
      query: "pintura muro",
      results_count: 5
    }
  },
  {
    action: "add_activity",
    details: {
      activity_name: "Hormigón H30",
      total: 250000
    }
  },
  {
    action: "favorite_add",
    details: { apu_id: "pintura_muro" }
  }
]
```

**Acciones trackeadas:**
- `session_start` - Inicio de sesión
- `create_project` - Crear proyecto
- `add_activity` - Agregar actividad
- `search_apu` - Búsqueda de APU
- `favorite_add/remove` - Favoritos
- `export` - Exportar datos
- `add_purchase` - Compra
- `add_sentiment` - Sentimiento
- `add_experience` - Experiencia

### 7. **Proveedores** 🏪
```javascript
providers: [
  {
    id: "prov_1729600000",
    name: "Construmart Maipú",
    category: "materiales",
    phone: "+56912345678",
    email: "ventas@construmart.cl",
    address: "Av. Pajaritos 3000",
    rating: 4, // 1-5
    notes: "Buenos precios, entrega rápida",
    added_date: "2025-10-22T10:00:00Z"
  }
]
```

**Métodos:**
- `addProvider(provider)` - Agregar proveedor
- `getProviders()` - Listar proveedores

### 8. **Time Tracking** ⏱️
```javascript
time_tracking: {
  "hormigon_h30": {
    total_time: 7200000, // ms (2 horas)
    sessions: [
      {
        start: 1729600000000,
        end: 1729603600000
      }
    ]
  }
}
```

**Métodos:**
- `startActivityTimer(activityId)` - Iniciar cronómetro
- `stopActivityTimer(activityId)` - Detener cronómetro
- `getActivityTime(activityId)` - Obtener tiempo total

---

## 🔗 Integración Realizada

### Tracking automático en funciones clave:

**1. Crear Proyecto**
```javascript
function createNewProject(name) {
    // ... código existente ...

    if (window.ClaudiaAnalytics) {
        ClaudiaAnalytics.trackCreateProject(newProject);
    }
}
```

**2. Agregar Actividad**
```javascript
function addActivityToProject() {
    // ... código existente ...

    if (window.ClaudiaAnalytics) {
        ClaudiaAnalytics.trackAddActivity(activity, project);
    }
}
```

**3. Favoritos**
```javascript
function toggleFavorite(apuId) {
    // ... código existente ...

    if (window.ClaudiaAnalytics) {
        ClaudiaAnalytics.trackFavorite(apuId, action);
    }
}
```

---

## 📊 Estadísticas Disponibles

### Método: `getStats()`

Retorna objeto completo con:

```javascript
{
  user: {
    id: "user_123",
    member_since: "2025-10-22",
    last_active: "2025-10-22T12:30:00Z",
    session_count: 15
  },
  projects: {
    total_created: 5,
    total_budget: 8750000,
    total_spent: 4200000,
    budget_vs_real: 4550000 // ahorro/sobrecosto
  },
  activities: {
    total_added: 42,
    favorites: 8,
    searches: 127
  },
  purchases: {
    count: 15,
    total_amount: 4200000,
    avg_purchase: 280000
  },
  sentiment: {
    total_entries: 8,
    avg_score: 4.2,
    latest: { /* último sentiment */ }
  },
  experiences: {
    total: 12,
    problems: 3,
    successes: 6,
    learnings: 3
  },
  providers: {
    count: 5
  },
  exports: {
    count: 3
  }
}
```

---

## 🛠️ API Pública

### Métodos disponibles en `window.ClaudiaAnalytics`:

```javascript
// Tracking básico
ClaudiaAnalytics.trackInteraction(action, details)
ClaudiaAnalytics.trackSearch(query, resultsCount)
ClaudiaAnalytics.trackAddActivity(activity, project)
ClaudiaAnalytics.trackCreateProject(project)
ClaudiaAnalytics.trackFavorite(apuId, action)
ClaudiaAnalytics.trackExport(format, projectId)

// Compras
ClaudiaAnalytics.addPurchase(purchase)
ClaudiaAnalytics.getPurchasesByProject(projectId)
ClaudiaAnalytics.getTotalSpent(projectId)

// Sentimientos
ClaudiaAnalytics.addSentiment(sentiment)

// Experiencias
ClaudiaAnalytics.addExperience(experience)

// Proveedores
ClaudiaAnalytics.addProvider(provider)
ClaudiaAnalytics.getProviders()

// Time tracking
ClaudiaAnalytics.startActivityTimer(activityId)
ClaudiaAnalytics.stopActivityTimer(activityId)
ClaudiaAnalytics.getActivityTime(activityId)

// Estadísticas
ClaudiaAnalytics.getStats()

// GDPR
ClaudiaAnalytics.exportUserData() // Descarga JSON
ClaudiaAnalytics.clearUserData() // Elimina todo
```

---

## 💾 Almacenamiento

### LocalStorage Keys:

```
claudia_user_id          - User ID único
claudia_user_data        - Todos los datos del usuario (JSON)
claudia_projects         - Proyectos (existente)
claudia_current_project  - Proyecto activo (existente)
claudia_favorites        - Favoritos (existente)
```

### Tamaño aproximado:
- User data inicial: ~2KB
- Con 500 interacciones: ~150KB
- Con 50 compras: ~10KB
- Con 20 sentimientos: ~5KB

**Total estimado:** ~170KB (muy por debajo del límite de 5MB de localStorage)

---

## 🔒 Privacidad y GDPR

### Compliance:

✅ **User ID anónimo** - No PII (Personal Identifiable Information)
✅ **Datos locales** - Todo en localStorage del navegador del usuario
✅ **Sin envío a servidor** - Los datos nunca salen del dispositivo
✅ **Exportable** - Usuario puede descargar sus datos
✅ **Eliminable** - Usuario puede borrar todo con un click

### Exportar datos:
```javascript
ClaudiaAnalytics.exportUserData()
// Descarga: claudia_user_data_user_123_1729600000.json
```

### Eliminar datos:
```javascript
ClaudiaAnalytics.clearUserData()
// Confirma y elimina TODO
```

---

## 📈 Casos de Uso

### 1. **Análisis de presupuesto vs real**
```javascript
const stats = ClaudiaAnalytics.getStats();
const budgetVsReal = stats.projects.budget_vs_real;

if (budgetVsReal < 0) {
  alert(`Estás ${formatMoney(Math.abs(budgetVsReal))} sobre presupuesto`);
} else {
  alert(`Has ahorrado ${formatMoney(budgetVsReal)}!`);
}
```

### 2. **Registrar compra de material**
```javascript
ClaudiaAnalytics.addPurchase({
  project_id: project.id,
  material: "Cemento Portland",
  quantity: 50,
  unit: "saco",
  price: 9500,
  provider: "Construmart",
  notes: "Buen precio"
});
```

### 3. **Capturar sentimiento del usuario**
```javascript
ClaudiaAnalytics.addSentiment({
  project_id: project.id,
  type: "frustration",
  score: 2,
  comment: "Proveedor con retrasos constantes",
  context: "Esperando materiales"
});
```

### 4. **Registrar aprendizaje**
```javascript
ClaudiaAnalytics.addExperience({
  project_id: project.id,
  type: "learning",
  title: "Mejor calcular 10% extra de cemento",
  description: "Me quedé corto y tuve que hacer segunda compra",
  activity_related: "hormigon_h30"
});
```

### 5. **Guardar proveedor confiable**
```javascript
ClaudiaAnalytics.addProvider({
  name: "Ferretería Don José",
  category: "materiales",
  phone: "+56912345678",
  rating: 5,
  notes: "Excelente atención, precios justos"
});
```

---

## 🎯 Próximas Mejoras

### UI para Analytics (Pendiente):

1. **Dashboard de Usuario**
   - Gráfico presupuesto vs real
   - Timeline de proyecto
   - Proveedores favoritos

2. **Registro de Compras**
   - Modal para agregar compras
   - Lista de compras por proyecto
   - Total gastado vs presupuestado

3. **Diario Emocional**
   - Modal para registrar cómo se siente
   - Historial de sentimientos
   - Gráfico de satisfacción

4. **Bitácora de Aprendizajes**
   - Sección para registrar tips
   - Problemas y soluciones
   - Compartir con comunidad

5. **Directorio de Proveedores**
   - Lista con ratings
   - Filtros por categoría
   - Contacto directo

---

## 🚀 Deploy

**Versión:** v5.0
**Fecha:** 2025-10-22 11:59:58 UTC
**URL:** https://claudia-i8bxh.web.app
**Estado:** ✅ Desplegado y funcionando

**Archivos nuevos:**
- `claudia-analytics.js` (430 líneas)

**Archivos modificados:**
- `index.html` - Script tag para analytics
- `claudia-pro.js` - 3 tracking calls integrados

---

## 📝 Cómo Usar

### Para desarrolladores:

```javascript
// El objeto Analytics está disponible globalmente
const stats = ClaudiaAnalytics.getStats();
console.log('Proyectos creados:', stats.projects.total_created);

// Tracking manual
ClaudiaAnalytics.trackInteraction('custom_action', {
  detail1: 'value1',
  detail2: 'value2'
});
```

### Para usuarios:

**Ver datos en consola:**
```javascript
ClaudiaAnalytics.getStats()
```

**Exportar datos:**
```javascript
ClaudiaAnalytics.exportUserData()
```

**Ver interacciones recientes:**
```javascript
const userData = ClaudiaAnalytics.getUserData();
console.log(userData.interactions.slice(-10)); // Últimas 10
```

---

## 🎉 Resumen

### Lo que tenemos ahora:

✅ **Sistema completo de tracking** funcionando
✅ **Captura automática** de acciones principales
✅ **Almacenamiento local** seguro y privado
✅ **API pública** para extensibilidad
✅ **GDPR compliant** con exportar/eliminar
✅ **430 líneas** de código robusto
✅ **Documentación** completa

### Lo que capturamos:

📊 Interacciones (500 últimas)
💰 Compras de materiales
😊 Sentimientos del usuario
📝 Experiencias y aprendizajes
🏪 Proveedores
⏱️ Tiempo dedicado
📈 Estadísticas completas

### Valor para el usuario:

1. **Presupuesto vs Real** - Saber si está en presupuesto
2. **Histórico de compras** - No olvidar cuánto pagó
3. **Diario emocional** - Registrar altos y bajos
4. **Bitácora de tips** - Aprender de errores
5. **Proveedores confiables** - Directorio personal

---

**Sistema listo para escalar y añadir UI visual**
**Toda la infraestructura de datos está en su lugar**

**Desarrollado con ❤️ por Claude + Pablo**
**CLAUDIA v5.0 - Analytics System**
**22 de Octubre, 2025**
