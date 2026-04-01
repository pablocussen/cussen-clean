# 🚀 GUÍA DE PUBLICACIÓN - CLAUDIA SODIMAC

**Objetivo:** Publicar la Web App para que sea accesible desde cualquier lugar

---

## 🎯 OPCIÓN 1: GITHUB PAGES (RECOMENDADO)

### ✅ Ventajas
- Gratis para siempre
- No requiere tarjeta de crédito
- Deploy en 5 minutos
- URL pública inmediata
- Perfecto para demos

### 📋 Requisitos
- Cuenta de GitHub (gratis)
- Git instalado en tu PC

---

## 🚀 PASO A PASO - GITHUB PAGES

### **Paso 1: Crear repositorio en GitHub**

1. Ve a https://github.com
2. Click en el botón verde **"New repository"**
3. Llena los datos:
   - **Repository name:** `claudia-sodimac-demo`
   - **Description:** "CLAUDIA SODIMAC - Asistente IA para Construcción"
   - **Public** (para que sea accesible)
   - ✅ **Add a README file**
4. Click en **"Create repository"**

---

### **Paso 2: Subir los archivos de web_app/**

Dos opciones:

#### Opción A: Desde la terminal (recomendado)

```bash
# 1. Ir a la carpeta del proyecto
cd c:\Users\pablo\claudia_bot

# 2. Si ya tienes git iniciado, hacer:
git remote add github https://github.com/TU_USUARIO/claudia-sodimac-demo.git

# 3. Crear rama especial para GitHub Pages
git checkout -b gh-pages

# 4. Copiar solo archivos de web_app a la raíz para GitHub Pages
# (Lo haremos con comandos específicos)

# 5. Commit y push
git add web_app/
git commit -m "🚀 Deploy CLAUDIA SODIMAC - Web App PRO"
git push github gh-pages
```

#### Opción B: Subir archivos manualmente (más simple)

1. Ve a tu repo en GitHub
2. Click en **"Add file"** → **"Upload files"**
3. Arrastra estos archivos desde `web_app/`:
   - `index.html`
   - `claudia-pro.js`
   - `README.md`
4. Click en **"Commit changes"**

---

### **Paso 3: Activar GitHub Pages**

1. En tu repositorio, ve a **Settings**
2. En el menú lateral, click en **Pages**
3. En **"Source"**, selecciona:
   - Branch: `main` (o `gh-pages` si creaste esa rama)
   - Folder: `/root` (o `/web_app` si subiste todo el proyecto)
4. Click en **"Save"**
5. Espera 2-3 minutos

**¡Listo!** Tu URL será:
```
https://TU_USUARIO.github.io/claudia-sodimac-demo/
```

---

## 🎯 OPCIÓN 2: VERCEL (MÁS PROFESIONAL)

### ✅ Ventajas
- URL más profesional
- Deploy automático desde GitHub
- CDN ultra rápido
- Analytics incluidos

### 📋 Pasos rápidos

1. Ve a https://vercel.com
2. Regístrate con tu cuenta de GitHub
3. Click en **"New Project"**
4. Importa el repositorio `claudia-sodimac-demo`
5. Configura:
   - **Framework Preset:** `Other`
   - **Root Directory:** `./web_app`
6. Click en **"Deploy"**

**¡Listo!** Tu URL será:
```
https://claudia-sodimac-demo.vercel.app
```

---

## 🎯 OPCIÓN 3: FIREBASE HOSTING (YA TIENES LA INFRA)

### ✅ Ventajas
- Integrado con tu backend actual
- Mismo proyecto Google Cloud
- URL: `claudia-sodimac.web.app`

### 📋 Pasos

```bash
# 1. Instalar Firebase CLI (si no lo tienes)
npm install -g firebase-tools

# 2. Login
firebase login

# 3. Ir a la carpeta del proyecto
cd c:\Users\pablo\claudia_bot

# 4. Inicializar Firebase Hosting
firebase init hosting

# Responde:
# - Project: claudia-i8bxh (tu proyecto existente)
# - Public directory: web_app
# - Single page app: No
# - GitHub deploys: No

# 5. Deploy
firebase deploy --only hosting
```

**¡Listo!** Tu URL será:
```
https://claudia-i8bxh.web.app
o
https://claudia-i8bxh.firebaseapp.com
```

---

## 🎯 OPCIÓN 4: NETLIFY (ALTERNATIVA A VERCEL)

### Pasos rápidos

1. Ve a https://netlify.com
2. Arrastra la carpeta `web_app/` completa
3. ¡Ya está publicado!

**URL:** `https://claudia-sodimac-RANDOM.netlify.app`

---

## 📊 COMPARACIÓN DE OPCIONES

| Feature | GitHub Pages | Vercel | Firebase | Netlify |
|---------|--------------|--------|----------|---------|
| **Costo** | Gratis | Gratis | Gratis | Gratis |
| **Velocidad** | 8/10 | 10/10 | 9/10 | 10/10 |
| **Facilidad** | 7/10 | 9/10 | 6/10 | 10/10 |
| **URL custom** | ❌ | ✅ | ✅ | ✅ |
| **Analytics** | ❌ | ✅ | ✅ | ✅ |
| **Integración backend** | ❌ | ⚠️ | ✅ | ⚠️ |

---

## 🎯 MI RECOMENDACIÓN

**Para una demo rápida:** NETLIFY (arrastra carpeta y listo)
**Para algo profesional:** VERCEL (deploy automático + analytics)
**Para producción real:** FIREBASE (integrado con tu backend)

---

## 📋 ¿QUÉ NECESITO DE TI PARA AYUDARTE?

### Opción A: Lo hago yo (necesito)
1. ✅ Confirma qué opción prefieres
2. ✅ Dame acceso a tu GitHub (o créame uno temporal)
3. ✅ 5 minutos de tu tiempo

### Opción B: Te guío paso a paso
1. ✅ Dime qué opción prefieres
2. ✅ Ejecuta los comandos que te voy dando
3. ✅ Confirma cada paso

---

## 🚀 QUICK START: NETLIFY (LO MÁS RÁPIDO)

**Si quieres publicar EN 1 MINUTO:**

```bash
# 1. Instalar Netlify CLI
npm install -g netlify-cli

# 2. Ir a web_app
cd c:\Users\pablo\claudia_bot\web_app

# 3. Deploy
netlify deploy

# Sigue las instrucciones:
# - Autoriza con tu email
# - Create & configure new site
# - Deploy path: . (punto, carpeta actual)

# 4. Para deploy a producción
netlify deploy --prod
```

**Te dará una URL inmediatamente:**
```
https://claudia-sodimac-XXXXX.netlify.app
```

---

## 🔗 URL PERSONALIZADA (OPCIONAL)

Si quieres algo como:
```
https://claudia.sodimac.cl
```

Necesitas:
1. Dominio propio (comprar en NIC Chile ~$12.000/año)
2. Configurar DNS
3. Apuntar a tu hosting

**Pero para la demo, una URL de Netlify/Vercel es perfecta.**

---

## ⚠️ IMPORTANTE: ARCHIVOS A SUBIR

Solo necesitas subir estos 3 archivos de `web_app/`:

1. ✅ `index.html`
2. ✅ `claudia-pro.js`
3. ✅ `README.md` (opcional)

**NO subir:**
- ❌ Archivos de configuración (`.env`, `.env.yaml`)
- ❌ Backend completo (por ahora funciona offline)
- ❌ Carpeta `.git`

---

## 🎬 PRÓXIMOS PASOS

**Dime cuál opción prefieres y empezamos:**

1. **NETLIFY** → 1 minuto (arrastra carpeta)
2. **VERCEL** → 5 minutos (profesional)
3. **GITHUB PAGES** → 10 minutos (clásico)
4. **FIREBASE** → 15 minutos (integrado con backend)

**¿Cuál eliges?** 🚀
