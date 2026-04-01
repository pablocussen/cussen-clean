# CLAUDIA AUTH - Sistema de Usuarios y Monetización

**Fecha**: 24 de Octubre, 2025
**Estado**: ⚠️ **REQUIERE CONFIGURACIÓN DE FIREBASE**

---

## 🎯 LO QUE IMPLEMENTAMOS

### **Sistema Completo de Autenticación**:
1. ✅ Login con email/password
2. ✅ Registro de nuevos usuarios
3. ✅ Login con Google (un click)
4. ✅ Gestión de sesiones
5. ✅ Logout

### **Planes de Monetización**:

| Plan | Precio | Proyectos | Features |
|------|--------|-----------|----------|
| **GRATIS** | $0/mes | 3 máximo | Básicos |
| **PRO** | $9.990/mes | ∞ Ilimitados | Todos |

### **Base de Datos Firestore**:
- 📊 Usuarios (email, plan, fecha registro)
- 📁 Proyectos (guardados en la nube)
- 📈 Analytics (uso, métricas)

---

## ⚙️ CONFIGURACIÓN REQUERIDA

### **PASO 1: Habilitar Firebase Auth y Firestore**

1. **Ir a Firebase Console**:
   - URL: https://console.firebase.google.com/project/claudia-i8bxh

2. **Habilitar Authentication**:
   - Menú lateral → "Authentication"
   - Click "Get Started"
   - Habilitar proveedores:
     - ✅ Email/Password
     - ✅ Google

3. **Habilitar Firestore Database**:
   - Menú lateral → "Firestore Database"
   - Click "Create database"
   - Modo: **Production mode** (con reglas de seguridad)
   - Ubicación: **us-central1** (más cercano)

### **PASO 2: Obtener Configuración Real**

1. **En Firebase Console**:
   - Menú lateral → ⚙️ "Project Settings"
   - Scroll down → "Your apps"
   - Si no hay app web, click "Add app" → Web (</>)
   - Si ya hay, click en el icono </>

2. **Copiar firebaseConfig**:
   ```javascript
   const firebaseConfig = {
       apiKey: "AIzaSy...",  // ← COPIAR
       authDomain: "claudia-i8bxh.firebaseapp.com",
       projectId: "claudia-i8bxh",
       storageBucket: "claudia-i8bxh.appspot.com",
       messagingSenderId: "...",
       appId: "..."
   };
   ```

3. **Actualizar en index.html**:
   - Buscar línea ~2681: `const firebaseConfig = {`
   - Reemplazar con los valores REALES

### **PASO 3: Desplegar Firestore Rules**

```bash
firebase deploy --only firestore:rules
```

Esto desplegará las reglas de seguridad que ya creamos en `firestore.rules`.

---

## 🎨 INTERFAZ DE LOGIN

### **Diseño Implementado**:

```
┌─────────────────────────────────────────────┐
│  💼 CLAUDIA PRO                             │
│  Presupuestos Profesionales que Generan     │
│  Utilidades                                 │
│                                             │
│  ┌──────────┬──────────┐                    │
│  │ Ingresar │ Crear Cuenta │                │
│  └──────────┴──────────┘                    │
│                                             │
│  Email                                      │
│  ┌─────────────────────────────────────┐   │
│  │ tu@email.com                        │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Contraseña                                 │
│  ┌─────────────────────────────────────┐   │
│  │ ••••••••                            │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ 🔓 Ingresar                         │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ─────────── o continúa con ────────────   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ 🔍 Ingresar con Google              │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### **Features del Formulario**:
- ✨ Diseño moderno con gradientes violetas
- 🎨 Tabs para Login / Registro
- 🔍 Botón de Google prominente
- 💳 Selector de planes (GRATIS vs PRO)
- 📱 Responsive (se ve bien en móvil)
- ⌨️ Enter key funciona
- ⚡ Validación de campos

---

## 💰 PLANES Y LÍMITES

### **Plan GRATIS** (Default para nuevos usuarios):
```javascript
{
    proyectos: 3 máximo,
    features: [
        'Calculadora de materiales',
        'Comparador de precios',
        'Export Excel básico'
    ],
    limitaciones: [
        'No puede crear más de 3 proyectos',
        'Sin optimizador de costos avanzado'
    ]
}
```

### **Plan PRO** ($9.990/mes):
```javascript
{
    proyectos: ∞ ilimitados,
    features: [
        'TODO lo del plan gratis',
        'Proyectos ilimitados',
        'Optimizador de costos',
        'Descuentos mayoristas',
        'Excel PRO + PDF',
        'Comparador en tiempo real',
        'Sin publicidad',
        'Soporte prioritario'
    ]
}
```

### **Implementación de Límites**:

```javascript
// En claudia-complete.js - función createNewProject()
function createNewProject() {
    // Verificar límite ANTES de crear
    const check = window.claudiaAuth.canCreateProject();

    if (!check.allowed) {
        // Mostrar mensaje de upgrade
        alert(check.message);

        // TODO: Mostrar modal de upgrade a PRO
        return;
    }

    // Continuar con creación...
}
```

---

## 📊 ESTRUCTURA DE DATOS EN FIRESTORE

### **Colección `users`**:
```javascript
/users/{userId} = {
    email: "maestro@example.com",
    plan: "free", // o "pro"
    projectCount: 2,
    createdAt: timestamp,
    lastLogin: timestamp,
    subscription: { // Solo si plan === "pro"
        startDate: timestamp,
        endDate: timestamp,
        status: "active" // "active", "cancelled", "expired"
    }
}
```

### **Colección `projects`** (guardados en la nube):
```javascript
/projects/{projectId} = {
    userId: "user123",
    name: "Casa 60m²",
    activities: [...],
    tasks: [...],
    photos: [...],
    createdAt: timestamp,
    updatedAt: timestamp,
    totalCost: 2450000
}
```

### **Colección `analytics`** (para ti):
```javascript
/analytics/{eventId} = {
    userId: "user123",
    event: "project_created", // "login", "export_excel", etc
    timestamp: timestamp,
    metadata: {
        projectCost: 2450000,
        activityCount: 15
    }
}
```

---

## 🔐 REGLAS DE SEGURIDAD

Ya implementadas en `firestore.rules`:

```javascript
// Usuario solo puede ver/editar SUS propios datos
match /users/{userId} {
    allow read, write: if request.auth.uid == userId;
}

// Proyectos solo accesibles por el dueño
match /projects/{projectId} {
    allow read, write: if request.auth.uid == resource.data.userId;
}

// Analytics: solo escritura (tú lees desde admin)
match /analytics/{docId} {
    allow read: if false; // Solo admin
    allow create: if request.auth != null;
}
```

---

## 🚀 FLUJO COMPLETO DEL USUARIO

### **Usuario Nuevo**:

1. Entra a CLAUDIA → Ve modal de login
2. Click "Crear Cuenta" → Llena email/password
3. Ve selector de planes:
   - Plan GRATIS (seleccionado por default)
   - Plan PRO (con badge "⭐ RECOMENDADO")
4. Click "Crear Cuenta GRATIS"
5. **Sistema crea**:
   - Usuario en Firebase Auth
   - Perfil en Firestore con plan "free"
6. Modal se cierra → Ve interfaz de CLAUDIA
7. Crea su primer proyecto

### **Usuario Alcanza Límite** (Plan GRATIS):

1. Usuario tiene 3 proyectos
2. Click "Nuevo Proyecto"
3. **Sistema detecta**:
   ```javascript
   claudiaAuth.canCreateProject() → {
       allowed: false,
       message: "Has alcanzado el límite de 3 proyectos..."
   }
   ```
4. **Muestra modal de upgrade**:
   ```
   ┌───────────────────────────────────────┐
   │ ⚠️ Límite Alcanzado                   │
   │                                       │
   │ Has creado 3 proyectos (máximo del   │
   │ plan GRATIS).                         │
   │                                       │
   │ Actualiza a PRO para:                 │
   │ ✅ Proyectos ILIMITADOS               │
   │ ✅ Optimizador de costos              │
   │ ✅ Descuentos mayoristas              │
   │ ✅ Y mucho más...                     │
   │                                       │
   │ Solo $9.990/mes                       │
   │                                       │
   │ ┌─────────────────────────────────┐  │
   │ │ 💳 Actualizar a PRO ahora       │  │
   │ └─────────────────────────────────┘  │
   │                                       │
   │ [ Cancelar ]                          │
   └───────────────────────────────────────┘
   ```

---

## 💳 INTEGRACIÓN DE PAGOS (Siguiente Paso)

### **Opciones para Chile**:

1. **Flow (Recomendado)** ⭐
   - Acepta: WebPay, Tarjetas, Transferencias
   - Comisión: ~3.5% + IVA
   - Fácil integración
   - https://www.flow.cl

2. **Mercado Pago**
   - Acepta: Tarjetas, Khipu
   - Comisión: ~3.9% + IVA
   - Muy popular

3. **Stripe** (Internacional)
   - Acepta: Tarjetas internacionales
   - Comisión: ~3.9% + $0.30 USD
   - Mejor para escalar internacionalmente

### **Implementación con Flow**:
```javascript
// Cuando usuario click "Actualizar a PRO"
async function upgradeToPro() {
    // 1. Crear orden en Flow
    const order = await createFlowOrder({
        amount: 9990,
        subject: "CLAUDIA PRO - Suscripción Mensual",
        email: user.email
    });

    // 2. Redirigir a Flow
    window.location.href = order.paymentUrl;

    // 3. Flow redirige de vuelta con resultado
    // 4. Webhook actualiza plan en Firestore
}
```

---

## 📈 ANALYTICS Y MÉTRICAS

### **Datos que Recolectamos**:

```javascript
// Cada vez que usuario hace algo importante
async function trackEvent(eventName, metadata) {
    const { collection, addDoc, serverTimestamp } = firebaseModules;

    await addDoc(collection(firebaseDb, 'analytics'), {
        userId: claudiaAuth.currentUser.uid,
        event: eventName,
        timestamp: serverTimestamp(),
        metadata: metadata
    });
}

// Ejemplos:
trackEvent('project_created', { cost: 2450000 });
trackEvent('excel_exported', { activityCount: 15 });
trackEvent('price_compared', { material: 'cemento' });
```

### **Dashboard Admin** (Para Ti):

Puedes ver en Firebase Console → Firestore:

- Usuarios totales
- Usuarios PRO vs Gratis
- Proyectos creados por día
- Features más usados
- Revenue potencial

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### **OBLIGATORIO** (para que funcione):
- [ ] Habilitar Firebase Authentication (Email + Google)
- [ ] Habilitar Firestore Database
- [ ] Copiar firebaseConfig REAL al index.html
- [ ] Desplegar reglas: `firebase deploy --only firestore:rules`

### **RECOMENDADO**:
- [ ] Configurar dominio personalizado
- [ ] Integrar Flow para pagos
- [ ] Crear función Cloud para webhooks de pago
- [ ] Agregar Google Analytics
- [ ] Configurar email templates (bienvenida, recordatorios)

### **OPCIONAL**:
- [ ] Login con Facebook
- [ ] Login con Apple
- [ ] Exportar lista de usuarios
- [ ] Dashboard de admin personalizado

---

## 🎯 PRÓXIMOS PASOS

1. **Configurar Firebase** (5 minutos)
   - Habilitar Auth y Firestore
   - Copiar config real

2. **Desplegar** (2 minutos)
   ```bash
   firebase deploy --only hosting,firestore:rules
   ```

3. **Probar** (10 minutos)
   - Crear cuenta nueva
   - Login/Logout
   - Crear 3 proyectos
   - Verificar límite funciona

4. **Integrar Pagos** (1-2 días)
   - Crear cuenta en Flow
   - Implementar checkout
   - Webhooks para actualizar plan

5. **Marketing** (Ongoing)
   - Promocionar plan PRO
   - Email marketing
   - Descuentos temporales

---

## 🔥 VALOR PARA EL NEGOCIO

### **Monetización**:
- **Meta**: 100 usuarios PRO = $999,000/mes
- **Conversión**: 10% free → pro = realista
- **Necesitas**: 1,000 usuarios totales

### **Base de Datos**:
- Sabes quién usa CLAUDIA
- Qué proyectos crean
- Cuánto presupuestan
- Qué features usan más

### **Diferenciación**:
- Competidores: Solo apps locales sin login
- CLAUDIA: Nube, multi-dispositivo, sincronizado

---

**Generado el**: 24 de Octubre, 2025
**Estado**: ⚠️ Requiere configuración Firebase
**Próximo paso**: Habilitar Auth y Firestore en Firebase Console
