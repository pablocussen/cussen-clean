# 🚀 CÓMO ABRIR Y PROBAR LA DEMO DE CLAUDIA SODIMAC

**Guía rápida para ver la aplicación funcionando**

---

## ⚡ MÉTODO RÁPIDO (30 segundos)

### Opción 1: Doble Click

1. Navega a la carpeta `web_app/`
2. Haz **doble click** en el archivo `index.html`
3. Se abrirá en tu navegador por defecto
4. ¡Listo! Ya puedes probar todas las funcionalidades

**✅ Funciona en:** Chrome, Edge, Firefox, Safari

---

## 🔧 MÉTODO PROFESIONAL (Con servidor local)

Si quieres una experiencia más realista (como si estuviera en producción):

### Con Python (Recomendado)

```bash
# 1. Abrir terminal/CMD
# 2. Navegar a la carpeta web_app
cd c:\Users\pablo\claudia_bot\web_app

# 3. Iniciar servidor
python -m http.server 8000

# 4. Abrir navegador en:
# http://localhost:8000
```

### Con VSCode Live Server

```bash
# 1. Abrir VSCode
# 2. Instalar extensión "Live Server"
# 3. Click derecho en index.html
# 4. Seleccionar "Open with Live Server"
```

---

## 🎯 QUÉ PROBAR EN LA DEMO

### Test 1: Calculadora de Materiales (2 minutos)

**Pasos:**
1. Mirar el primer card "Calculadora de Materiales"
2. Dejar los valores por defecto:
   - Largo: 10 metros
   - Alto: 2.4 metros
   - Tipo: Ladrillo Princesa
3. Click en "🧮 Calcular Materiales"

**Resultado esperado:**
```
📋 MATERIALES NECESARIOS

Ladrillos princesa: 1,037 unidades
Cemento: 9 sacos 42.5kg
Arena fina: 0.93 m³

COSTO ESTIMADO TOTAL: $559,890
```

✅ **Si ves esto, funciona perfecto!**

---

### Test 2: Optimizador de Presupuestos (2 minutos)

**Pasos:**
1. Mirar el segundo card "Optimizador de Presupuestos"
2. Dejar los valores por defecto:
   - Presupuesto: $2,500,000
   - Tipo: Remodelación
3. Click en "📊 Optimizar Presupuesto"

**Resultado esperado:**
```
💡 OPORTUNIDADES DE AHORRO

Ladrillo princesa → ladrillo fiscal: -$93,750
Cerámica importada → cerámica nacional: -$200,000
Pintura premium → pintura estándar: -$75,000

AHORRO TOTAL: $368,750
PORCENTAJE: 14.8%
```

✅ **Si ves los ahorros, funciona!**

---

### Test 3: Plan de Pagos (1 minuto)

**Pasos:**
1. Mirar el tercer card "Plan de Pagos"
2. Valores por defecto:
   - Monto: $3,000,000
   - Cuotas: 3
3. Click en "📅 Generar Plan"

**Resultado esperado:**
```
💳 TU PLAN DE PAGOS

🔔 Cuota 1 (30%): $900,000
⏳ Cuota 2 (40%): $1,200,000
⏳ Cuota 3 (30%): $900,000
```

✅ **Si ves las 3 cuotas, funciona!**

---

### Test 4: Chat Inteligente (2 minutos)

**Pasos:**
1. Scroll hasta abajo al chat
2. Escribir: `¿Cómo puedo ahorrar en mi presupuesto?`
3. Presionar Enter

**Resultado esperado:**
Claudia responde con información sobre optimización de presupuestos

4. Escribir: `¿Qué normativas conoces?`
5. Presionar Enter

**Resultado esperado:**
Claudia menciona NCh430, NCh433, NCh853, NCh1198

✅ **Si Claudia responde coherentemente, funciona!**

---

## 📱 PROBAR EN MÓVIL

### Opción 1: Con Python server

```bash
# 1. Iniciar servidor (como arriba)
python -m http.server 8000

# 2. En tu celular, conectado a la misma red WiFi
# Abrir navegador y visitar:
# http://[IP-DE-TU-PC]:8000

# Para saber tu IP:
# Windows: ipconfig
# Mac/Linux: ifconfig
```

### Opción 2: Copiar archivos

1. Copiar carpeta `web_app/` a tu celular
2. Abrir `index.html` con navegador móvil

---

## 🎨 LO QUE DEBERÍAS VER

### En Desktop

- Header con logo de Claudia
- 3 cards horizontales (Calculadora, Optimizador, Pagos)
- Chat interface abajo
- Colores: Gradientes morado/azul, naranja Sodimac
- Animaciones suaves al hacer hover

### En Móvil

- Todo apilado verticalmente
- Cards en columna única
- Chat ocupa todo el ancho
- Botones grandes y táctiles

---

## ⚠️ SOLUCIÓN DE PROBLEMAS

### Problema 1: No se ve nada

**Causa:** JavaScript no cargó

**Solución:**
1. Abrir consola del navegador (F12)
2. Buscar errores en rojo
3. Verificar que `claudia-pro.js` esté en la misma carpeta

---

### Problema 2: Botones no funcionan

**Causa:** JavaScript con error

**Solución:**
1. F12 → Consola
2. Buscar mensaje de error
3. Reportar el error exacto

---

### Problema 3: Diseño se ve mal

**Causa:** Navegador muy antiguo

**Solución:**
- Usar Chrome, Edge, Firefox o Safari actualizados
- Versión mínima: Chrome 90+, Edge 90+, Firefox 88+

---

## 📊 MÉTRICAS QUE DEBERÍAS VER

Si todo funciona bien, al usar cada función deberías ver:

### Calculadora
- ✅ Lista de materiales
- ✅ Cantidades específicas
- ✅ Unidades correctas (sacos, m³, unidades)
- ✅ Costo total en pesos chilenos
- ✅ Mermas incluidas

### Optimizador
- ✅ 3 alternativas de ahorro
- ✅ Porcentajes realistas (25%, 40%, 30%)
- ✅ Impacto en calidad (✅ o ⚠️)
- ✅ Ahorro total calculado

### Plan de Pagos
- ✅ Distribución 30-40-30
- ✅ Fechas futuras calculadas
- ✅ Descripciones de cada fase
- ✅ Emojis de estado

### Chat
- ✅ Respuestas contextuales
- ✅ Sin latencia (instantáneo)
- ✅ Scroll automático
- ✅ Mensajes bien formateados

---

## 🎬 PARA LA PRESENTACIÓN EJECUTIVA

### Checklist Pre-Demo

- [ ] Laptop con batería al 100%
- [ ] Navegador abierto con la app
- [ ] Backup en USB (por si falla internet)
- [ ] Segunda pantalla/proyector testeado
- [ ] Conexión a internet (aunque funciona offline)

### Durante la Demo

1. **No recargues la página** (pierdes los resultados)
2. **Usa los valores por defecto** (están optimizados)
3. **Muestra todo en orden:** Calculadora → Optimizador → Pagos → Chat
4. **Destaca los números:** ahorros, costos, porcentajes
5. **Termina con el chat** (es lo más impresionante)

---

## 💡 TIPS PROFESIONALES

### Para Impresionar

1. **Velocidad:** Todo responde instantáneamente (offline)
2. **Precisión:** Números basados en normativas reales NCh
3. **Diseño:** Limpio, moderno, profesional
4. **Funcionalidad:** Todo funciona SIN backend (por ahora)

### Mensajes Clave

Mientras muestras cada función, di:

- **Calculadora:** "Esto ahorra 30 minutos de cálculos manuales"
- **Optimizador:** "Esto puede significar ganar o perder un proyecto"
- **Pagos:** "Esto permite tomar proyectos más grandes"
- **Chat:** "Esto genera lealtad emocional con Sodimac"

---

## 📞 SOPORTE

Si tienes problemas:

1. Revisa la consola del navegador (F12)
2. Verifica que los archivos estén en la carpeta correcta
3. Intenta con otro navegador
4. Revisa `web_app/README.md` para más detalles

---

## ✅ CHECKLIST FINAL

Antes de presentar, verifica:

- [ ] La app abre sin errores
- [ ] Los 3 calculadores funcionan
- [ ] El chat responde
- [ ] Los números se ven correctos
- [ ] El diseño se ve profesional
- [ ] Funciona en el proyector/pantalla externa

---

**🚀 ¡Listo! Ya puedes mostrar CLAUDIA SODIMAC al mundo.**

**Cada clic, cada cálculo, cada optimización es una demostración del futuro de la construcción retail en Chile.**

---

*Documento de soporte técnico - Octubre 2025*
*CLAUDIA SODIMAC - Construyendo juntos*
