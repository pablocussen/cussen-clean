# TapizeroCL - Sistema de Gestión de Tapicería

Una aplicación web progresiva (PWA) profesional y completa para gestionar negocios de tapicería en Chile.

## Características

### 6 Módulos Principales

#### 1. 👔 **TRABAJOS**
- Crear y gestionar proyectos de tapicería
- Tipos de muebles: sofá, sillón, silla comedor, cabecera, asiento auto, cortinas, cojines, ottoman, banqueta
- Estados de trabajo: Pendiente, En Progreso, Completado, Entregado
- Tipos de trabajo: Retapizado completo, Reparación, Cambio espuma, Cambio tela, Restauración
- Seguimiento por cliente, tela, dimensiones, precio y fecha de entrega
- Edición y actualización de estado rápida
- Notas y observaciones por proyecto

#### 2. 🧵 **TELAS**
- Catálogo completo de telas y materiales
- Tipos: Cuerina, Tela, Cuero, Terciopelo, Lino, Chenille, Microfibra, Outdoor
- Información: Color, ancho, stock, costo por metro, proveedor, durabilidad
- Gestión de inventario en tiempo real
- Seguimiento de proveedores

#### 3. 💰 **COTIZADOR**
- Calculadora inteligente de presupuestos
- Parámetros: Tipo mueble, dimensiones (ancho, largo, profundidad)
- Selección de tela con costo automático
- Horas de trabajo + tarifa configurable
- Multiplicador de complejidad (0.8 - 2.0)
- Costo de espuma/relleno separado
- Desglose detallado (tela, espuma, mano de obra)
- Guardado de cotizaciones

#### 4. 📦 **INSUMOS**
- Inventario de materiales y suministros
- Tipos: Espuma densidades, relleno, tachuelas, grapas, pegamento, hilo, cierres, patas
- Stock y costo por unidad
- Múltiples unidades: kg, metro, caja, rollo, unidad
- Gestión de proveedores

#### 5. 📊 **FINANZAS**
- Dashboard con métricas clave
- Ingresos del mes
- Costos de materiales
- Ganancia total y margen
- Gráficos:
  - Ingresos por tipo de mueble (gráfico de torta)
  - Ingresos por mes (gráfico de barras)
- Resumen con: trabajos completados, margen %, promedio por trabajo

#### 6. 👥 **CLIENTES**
- Base de datos de clientes
- Información: Nombre, teléfono, email, dirección
- Preferencias de tela y estilo
- Historial de trabajos por cliente
- Enlaces directos para llamadas y emails

## Características Técnicas

### Progressive Web App (PWA)
- ✅ Funciona offline
- ✅ Instalable en home screen (iOS y Android)
- ✅ Manifestación web (manifest.json)
- ✅ Service Worker simulado
- ✅ Icono personalizado
- ✅ Soporte para Dark Mode (sistema operativo)

### Diseño Responsive
- 📱 Mobile-first (optimizado para teléfono)
- 💻 Adaptable a tablets y desktop
- 🔒 Safe Area insets (notch/Dynamic Island)
- 🎨 Interfaz moderna y profesional

### Almacenamiento
- 💾 localStorage con try/catch para iOS
- 🔒 Datos persistentes entre sesiones
- 📦 Datos de demostración incluidos
- 🚀 Carga rápida sin backend

### UI/UX
- ⌨️ Input font-size 16px (sin zoom iOS)
- 🎯 Navegación por tabs y footer
- 🔘 Botones grandes y accesibles
- 📊 Gráficos con Chart.js
- 🎨 Colores profesionales (púrpura #581c87 / beige #fef9c3)
- 🌐 Interfaz completamente en español (Chile)

### Seguridad
- 🔐 Datos solo en cliente
- 🛡️ Sin conexiones externas (excepto CDN para librerías)
- 📵 Sin tracking ni analytics invasivos
- 🔒 Cumplimiento GDPR (datos locales)

## Paleta de Colores

- **Primario**: #581c87 (Púrpura Profundo)
- **Primario Oscuro**: #3f1360
- **Primario Claro**: #7c3aed
- **Acento**: #fef9c3 (Beige Cálido)
- **Éxito**: #22c55e (Verde)
- **Advertencia**: #f59e0b (Naranja)
- **Peligro**: #ef4444 (Rojo)

## Instalación

1. Copiar archivos a un servidor web
2. Servir desde HTTPS (requerido para PWA)
3. Acceder a `/tapizerocl/index.html`

## Dispositivos Soportados

- ✅ iPhone / iPad (iOS 11.3+)
- ✅ Android (Chrome, Firefox, Edge)
- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Tablets

## Datos de Demostración

La aplicación incluye datos de ejemplo:
- 2 clientes pre-cargados
- 3 telas disponibles
- 2 insumos en inventario
- 1 trabajo en progreso

**Todos los datos se guardan automáticamente en localStorage.**

## Funcionalidades Destacadas

1. **Cálculo automático de presupuestos** con multiplicadores
2. **Gráficos de finanzas** en tiempo real
3. **Gestión completa de inventario**
4. **Historial de clientes** y sus proyectos
5. **Seguimiento de estados** de trabajos
6. **Múltiples opciones de muebles y materiales**
7. **Notas y detalles** por proyecto
8. **Enlaces rápidos** a teléfono y email

## Especificaciones de Desarrollo

- **Líneas de código**: 2,037 líneas
- **Tamaño HTML**: 77 KB
- **Librerías externas**:
  - Google Fonts (Inter)
  - Chart.js (gráficos)
- **Sin dependencias npm** - Funciona sin build
- **Compatible con todos los navegadores modernos**

## Uso Offline

La aplicación funciona completamente sin conexión a internet:
1. Los datos se guardan en localStorage
2. Los gráficos se generan localmente
3. Todas las funciones están disponibles offline
4. Los cambios se sincronizan automáticamente

## Notas

- Los datos se almacenan solo en el dispositivo cliente
- No se envían datos a servidores externos
- Para respaldar datos: exportar desde navegador (DevTools → Application)
- Compatible con Firebase Hosting y otros servidores estáticos

---

**Desarrollado para profesionales de la tapicería en Chile**
Versión 1.0 | Marzo 2026
