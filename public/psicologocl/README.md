# PsicologoCL - Sistema de Gestión para Psicólogos Clínicos

## Descripción General

PsicologoCL es una Progressive Web App (PWA) profesional y completa diseñada específicamente para psicólogos y terapeutas en Chile. Proporciona herramientas de gestión integral de práctica clínica con almacenamiento local de datos.

**Especificaciones:**
- Aplicación HTML5 de archivo único (2054 líneas)
- 82 KB minificado
- Funciona completamente offline con localStorage
- Diseño mobile-first y responsive
- Colores profesionales: Indigo (#4f46e5) y Lavanda suave (#ede9fe)

## Funcionalidades Principales

### 1. PACIENTES (👥)
Gestión completa de base de datos de pacientes:
- Registrar nuevo paciente con nombre, RUT, edad, contacto
- Diagnóstico CIE-10 (F32.0-F63.2): depresión, ansiedad, trastornos de adaptación, insomnio, etc.
- Fuente de referencia: autorreferencia, médico general, psiquiatra, recomendación, Fonasa, Isapre
- Tipos de sesión preferida: individual, pareja, familiar, grupal
- Contacto de emergencia
- Cobertura de salud: Particular, Fonasa, Isapre
- Estadísticas: Total de pacientes activos y nuevos este mes

### 2. SESIONES (📝)
Registro clínico estructurado de sesiones:
- Formato SOAP estándar:
  - S (Subjetivo): Relato del paciente, síntomas reportados
  - O (Objetivo): Observaciones conductuales, afecto, lenguaje
  - A (Análisis): Interpretación clínica, hipótesis
  - P (Plan): Intervenciones realizadas, tareas asignadas
- Evaluación del ánimo (1-10 escala interactiva)
- Duración: 45, 60, 90 minutos
- Tipos de sesión: individual, pareja, familiar, grupal
- Filtrado por paciente
- Vista detallada con expandible

### 3. AGENDA (📅)
Calendario y gestión de citas:
- Próximas citas hoy (listado con hora)
- Calendario semanal visual 7 días
- Detección automática de citas programadas
- Listado de próximas citas (próximas 10)
- Edición y eliminación de citas
- Notas por cita

### 4. HERRAMIENTAS (🧪)
Pruebas psicométricas validadas:
- PHQ-9 - Escala de Depresión (9 preguntas, 0-27 puntos)
  - Mínima, Leve, Moderada, Moderadamente Severa, Severa
- GAD-7 - Escala de Ansiedad Generalizada (7 preguntas, 0-21 puntos)
  - Mínima, Leve, Moderada, Severa
- AUDIT - Consumo de Alcohol (10 preguntas, 0-40 puntos)
  - Bajo Riesgo, Riesgo Moderado, Riesgo Alto, Posible Dependencia
- Auto-scoring en tiempo real
- Historial de evaluaciones por paciente con timeline
- Severidad codificada por color

### 5. FINANZAS (💰)
Gestión financiera y aranceles:
- Ingresos del mes actual calculados automáticamente
- Aranceles configurables por tipo de sesión:
  - Individual: 45, 60, 90 minutos
  - Pareja: 60 minutos
  - Familiar: 60 minutos
  - Grupal: 60 minutos
- Descuentos automáticos para Fonasa/Isapre
- Gráfico de ingresos últimos 6 meses (Chart.js)
- Pendientes de pago (framework preparado)

### 6. INFORMES (📊)
Reportes y análisis:
- Total de sesiones realizadas
- Duración promedio de sesiones
- Tendencias de evaluaciones (PHQ-9 y GAD-7) con gráfico
- Resumen por paciente (sesiones + evaluaciones)
- Generador de informes clínicos en TXT
- Exportación de informe por paciente
- Compartir vía WhatsApp (link generado)

## Tecnología y Características Técnicas

### Stack
- HTML5: Estructura semántica
- CSS3: Grid, Flexbox, variables CSS, media queries
- JavaScript Vanilla: Sin dependencias (excepto Chart.js CDN)
- LocalStorage: Almacenamiento persistente con try/catch iOS safe
- Chart.js 4.4.1: Gráficos de ingresos y evaluaciones

### Características de Seguridad
- localStorage envuelto en try/catch (compatibilidad iOS)
- Escape de HTML para prevenir XSS
- Font-size inputs = 16px (previene auto-zoom iOS)
- Sin overflow-x:hidden en body (accesibilidad)

### Responsividad
- Mobile-first design
- Grid 2 columnas → 1 en <640px
- Tabs scrollables horizontales
- Modal responsive con max-height
- Safe area insets (notches iOS)
- Scrollbar personalizado (estilos modernos)

### Persistencia de Datos
- Todos los datos se guardan en localStorage automáticamente
- Carga al iniciar la app
- Backup frecuente en beforeunload
- Estructura JSON limpia

## Especificidades Chilenas

1. CIE-10: Códigos diagnósticos (F32.0, F41.1, F51.0, etc.)
2. Fonasa/Isapre: Cobertura de salud con descuentos automáticos
3. Localización: Español completo, formato de fechas chilenas
4. Terminología: "Sesión" en lugar de "appointment", "Ánimo" en lugar de "mood"
5. Moneda: Pesos chilenos (CLP) con formato local

## Instrucciones de Uso

### Instalación
1. Copiar index.html al servidor Firebase
2. Acceder a /psicologocl/ en el navegador
3. Permitir instalar PWA (si el navegador lo solicita)

### Primeros Pasos
1. Crear paciente: Tab "Pacientes" → "+ Nuevo"
2. Registrar sesión: Tab "Sesiones" → "+ Nueva"
3. Agendar cita: Tab "Agenda" → "+ Cita"
4. Aplicar evaluación: Tab "Herramientas" → Seleccionar PHQ-9/GAD-7/AUDIT
5. Configurar aranceles: Tab "Finanzas" → "Configurar Aranceles"

### Datos de Prueba
Cargar el formulario de pacientes con:
- Nombre: Juan Pérez García
- RUT: 16456879K
- Diagnóstico: F32.1 (Depresión Moderada)
- Cobertura: Fonasa

## Rendimiento

- Tamaño: 82 KB (archivo único)
- Líneas: 2054
- Carga inicial: <200ms
- Charts: Renderización suave con Chart.js
- Almacenamiento: ~100KB localStorage (suficiente para 500+ registros)

## Navegadores Soportados

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Navegadores móviles modernos (iOS 13+, Android 10+)

## Características PWA

- Manifest JSON embebido
- Service Worker inline
- Instalable en pantalla de inicio
- Funciona offline (datos locales)
- Icono SVG embebido (Ψ griega)

## Notas de Desarrollo

- Agregar backend para sincronización cloud
- Implementar cifrado de datos sensibles
- Exportar a FHIR/HL7 para integración hospitalaria
- Integrar con APIs de Transactional Email para alertas
- Agregar firma digital en reportes (legal Chile)

---

Versión: 1.0.0 - Marzo 2026
Desarrollado para: Psicólogos clínicos de Chile
Licencia: Privada/Propietaria
