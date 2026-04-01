# 🤖 Decisión de Estrategia: Bot de Telegram

## Situación Actual

**Bot existente:** @metrorumabot
- ✅ Ya desplegado y funcionando
- ✅ Integrado con Firebase/Firestore
- ✅ IA conversacional (Gemini)
- ❓ Enfoque actual: IA conversacional política/electoral

---

## 🎯 Opciones

### **Opción A: Usar @metrorumabot**

**Pros:**
- ✅ Ya existe, no hay setup inicial
- ✅ TELEGRAM_TOKEN ya configurado
- ✅ Infraestructura lista (Cloud Functions)
- ✅ Sistema de IA ya integrado
- ✅ Rápido de implementar

**Contras:**
- ❌ Nombre no relacionado con construcción ("metroruma")
- ❌ Usuarios existentes podrían confundirse con el cambio
- ❌ Brand identity poco clara

**Recomendación:** ⚠️ **NO RECOMENDADO**
- Nombre confuso para usuarios de construcción
- Mezclar política + construcción diluye el mensaje

---

### **Opción B: Crear bot nuevo @ClaudiaConstructionBot** ✅

**Pros:**
- ✅ **Nombre claro y profesional** relacionado con construcción
- ✅ Brand identity consistente con la web
- ✅ Usuarios nuevos, sin confusión
- ✅ Permite mantener @metrorumabot para otro uso
- ✅ Mensajes de bienvenida específicos para construcción
- ✅ Comandos optimizados para la industria

**Contras:**
- ⚠️ Requiere crear bot nuevo en BotFather (~5 minutos)
- ⚠️ Nuevo TELEGRAM_TOKEN (fácil de actualizar)

**Recomendación:** ✅ **ALTAMENTE RECOMENDADO**

---

## 🏆 Decisión Final: CREAR BOT NUEVO

### **Nombre sugerido:**
- `@ClaudiaConstructionBot`
- `@ClaudiaProBot`
- `@ClaudiaConstruccionBot` (español)

**Razón:** Brand consistency + claridad para usuarios

---

## 🚀 Plan de Acción

### **Paso 1: Crear bot en BotFather (5 min)**

```
1. Abrir Telegram
2. Buscar: @BotFather
3. Enviar: /newbot
4. Nombre: CLAUDIA Construction Assistant
5. Username: @ClaudiaConstructionBot
6. BotFather responde con TOKEN
7. Copiar TOKEN
```

### **Paso 2: Configurar en Google Cloud (2 min)**

```bash
# Actualizar variable de entorno en Cloud Functions
gcloud functions deploy claudia_handler \
  --update-env-vars TELEGRAM_TOKEN=<NUEVO_TOKEN>
```

O desde consola web:
1. Cloud Functions → claudia_handler → Edit
2. Environment variables → TELEGRAM_TOKEN → <NUEVO_TOKEN>
3. Deploy

### **Paso 3: Configurar webhook (1 comando)**

```bash
curl -X POST \
  https://api.telegram.org/bot<TOKEN>/setWebhook \
  -d "url=https://us-central1-claudia-i8bxh.cloudfunctions.net/claudia_handler"
```

### **Paso 4: Personalizar bot (5 min)**

```
En BotFather:

/setdescription @ClaudiaConstructionBot
"Tu asistente inteligente de construcción 24/7. Recibe notificaciones, actualiza proyectos, y obtén ayuda de IA para tu obra."

/setabouttext @ClaudiaConstructionBot
"CLAUDIA - Asistente de Construcción con IA"

/setuserpic @ClaudiaConstructionBot
[Subir logo de CLAUDIA]

/setcommands @ClaudiaConstructionBot
start - Vincular cuenta web
resumen - Ver estado de proyectos
tareas - Lista de tareas pendientes
bitacora - Agregar entrada a bitácora
foto - Subir foto del proyecto
ayuda - Ver todos los comandos
```

---

## 📋 Comandos del Bot

### **Comandos principales:**

```
/start - Vincular cuenta web
/vincular [CÓDIGO] - Confirmar vinculación
/resumen - Estado de todos los proyectos
/tareas - Tareas pendientes
/bitacora [texto] - Agregar a bitácora
/foto - Subir foto (responde con proyecto)
/ayuda - Lista de comandos
/config - Configurar notificaciones
```

### **Comandos admin (futuro):**
```
/stats - Estadísticas de uso
/broadcast - Enviar mensaje a todos
/testai - Probar análisis de IA
```

---

## 💬 Mensaje de Bienvenida

```
👷‍♂️ ¡Hola! Soy CLAUDIA, tu asistente de construcción.

🏗️ ¿Qué puedo hacer por ti?
   • Enviarte resúmenes diarios de tus proyectos
   • Recordarte tareas y materiales pendientes
   • Alertarte sobre retrasos o problemas
   • Responder preguntas sobre construcción
   • Ayudarte a actualizar tu bitácora

📱 Para empezar:
1. Ve a https://claudia-i8bxh.web.app
2. Crea tu proyecto
3. Vincula esta cuenta de Telegram
4. ¡Listo! Yo me encargo del resto

¿Necesitas ayuda? Envía /ayuda
```

---

## 🔄 Migración desde @metrorumabot

**¿Qué pasa con el bot viejo?**

**Opción 1: Mantener separado** ✅
- @metrorumabot → IA política/electoral
- @ClaudiaConstructionBot → Construcción
- Sin conflictos, usos distintos

**Opción 2: Deprecar gradualmente**
- Dejar @metrorumabot con mensaje:
  ```
  Este bot se ha movido a @ClaudiaConstructionBot
  para mejor servicio de construcción.

  Por favor, usa el nuevo bot:
  👉 @ClaudiaConstructionBot
  ```

**Recomendación:** Opción 1 (mantener separado)

---

## ⏱️ Tiempo Total de Setup

| Tarea | Tiempo |
|-------|--------|
| Crear bot en BotFather | 5 min |
| Actualizar env vars | 2 min |
| Configurar webhook | 1 min |
| Personalizar bot | 5 min |
| Testing básico | 5 min |
| **TOTAL** | **18 minutos** |

---

## ✅ Conclusión

**CREAR BOT NUEVO: @ClaudiaConstructionBot**

**Razones:**
1. ✅ Brand consistency profesional
2. ✅ Claridad para usuarios
3. ✅ Mensajes específicos de construcción
4. ✅ Separación de concerns (política vs construcción)
5. ✅ Setup rápido (< 20 minutos)

**Próximos pasos:**
1. Crear bot nuevo
2. Actualizar TOKEN en config
3. Implementar comandos de vinculación
4. Desarrollar sistema proactivo

---

**¿Procedo a crear el nuevo bot?** 🚀
