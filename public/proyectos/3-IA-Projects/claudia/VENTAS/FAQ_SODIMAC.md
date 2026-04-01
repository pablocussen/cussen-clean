# ❓ FAQ - Preguntas Frecuentes Sodimac

**Respuestas preparadas para objeciones y dudas típicas**

---

## 📊 COMERCIALES

### **¿Por qué $24 millones base + 10% revenue share?**

**Desglose transparente base $24 MM:**
- Infraestructura GCP/Firebase: $3 MM/año
- Desarrollo y actualizaciones: $8 MM/año
- Soporte 24/7 enterprise: $5 MM/año
- Actualizaciones APUs mensuales: $3 MM/año
- Integraciones y mantención: $5 MM/año

**Revenue share 10%:**
- Alineación de intereses (si Sodimac vende más, Cussen gana más)
- Modelo performance-based
- Riesgo compartido

**Proyección año 1:**
- Base: $24 MM
- Revenue (ventas $150 MM): $15 MM
- Total: $39 MM

**Comparación mercado:**
- App custom desarrollo: $80-120 MM (18 meses)
- Licencia CRM construcción: $25-40 MM/año
- Plataforma B2B e-commerce: $40-60 MM/año

CLAUDIA modelo híbrido es **competitivo y escalable**.

---

### **¿Qué pasa si queremos cancelar?**

**Contrato anual renovable:**
- Aviso 90 días antes de vencimiento
- Sin penalidades por no renovar
- Exportación completa de data usuarios
- Transición asistida 30 días

**Protección Sodimac:**
- No hay lock-in perpetuo
- Pueden evaluar ROI año 1 antes de renovar
- Si no funciona, salen limpio

---

### **¿Cómo medimos el éxito?**

**KPIs contractuales (reportados mensualmente):**

| KPI | Meta Mes 6 | Meta Mes 12 |
|-----|------------|-------------|
| Usuarios activos | 800 | 1,500 |
| Proyectos creados/mes | 2,400 | 4,500 |
| Listas compra generadas | 1,800 | 3,600 |
| Conversión a Sodimac | 35% | 45% |
| NPS Especialistas | 40+ | 50+ |

**Dashboard ejecutivo:**
- Acceso real-time Sodimac
- Exportable Excel/PDF mensual
- Alertas automáticas si KPI bajo meta

---

### **¿Qué incluye "soporte 24/7"?**

**Niveles de soporte:**

| Prioridad | Tiempo Respuesta | Ejemplos |
|-----------|------------------|----------|
| **Crítico** | 1 hora | App caída, data loss |
| **Alto** | 4 horas | Feature no funciona |
| **Medio** | 24 horas | Bug menor |
| **Bajo** | 48 horas | Feature request |

**Canales:**
- Email: soporte@cussen.cl
- WhatsApp: [número]
- Slack channel Sodimac-Cussen (opcional)
- Reunión mensual check-in

**Equipo:**
- 1 developer full-time asignado
- 1 PM punto de contacto
- On-call 24/7 para críticos

---

## 🔧 TÉCNICAS

### **¿Qué tecnología usan?**

**Stack probado enterprise:**

```
Frontend:  PWA (Progressive Web App) - funciona iOS + Android
Backend:   Google Cloud Platform (Firebase)
           - Firestore (database NoSQL)
           - Cloud Functions (serverless)
           - Firebase Hosting (CDN global)
AI:        Google Gemini (Vertex AI)
Bot:       Telegram Bot API oficial
Security:  Firebase Auth + HTTPS + Security Rules
```

**¿Por qué este stack?**
- Google enterprise SLA 99.95%
- Auto-scaling (soporta 50k usuarios simultáneos)
- Sin servidores que mantener
- Actualizaciones sin downtime

---

### **¿Cómo se integra con sistemas Sodimac?**

**APIs necesarias (Sodimac provee):**

1. **API Productos/Precios:**
   - Endpoint: Catálogo productos construcción
   - Actualización: Webhook cada 6 horas
   - Formato: REST API (JSON)

2. **API Stock:**
   - Endpoint: Inventario por tienda
   - Consulta: Real-time on-demand
   - Formato: REST API

3. **API Puntos GO:**
   - Endpoint: Cálculo puntos por compra
   - Input: Monto CLP
   - Output: Puntos acumulados

**Tiempo implementación:** 2-3 semanas
**Documentación:** Cussen provee specs OpenAPI

---

### **¿Qué datos quedan en Sodimac vs Cussen?**

**Datos Sodimac (propiedad 100% Sodimac):**
- Identidad especialistas (nombre, email, RUT)
- Proyectos creados por especialistas
- Listas de compra generadas
- Historial compras atribuibles
- Analytics agregados

**Datos Cussen (propiedad Cussen):**
- Base 816 APUs (precios referenciales)
- Algoritmos IA
- Código fuente aplicación
- Infraestructura tech

**Segregación:**
- Firestore proyecto separado por cliente
- Export completo mensual a Sodimac
- GDPR/LOPD compliant

---

### **¿Qué pasa si Cussen desaparece?**

**Protección contractual:**

1. **Escrow code:**
   - Código fuente depositado en escrow neutral
   - Liberado a Sodimac si Cussen incumple/cierra
   - Actualizado cada 3 meses

2. **Documentación completa:**
   - Architecture diagrams
   - Setup instructions
   - API documentation
   - Database schemas

3. **Transición asistida:**
   - 6 meses handover incluido
   - Capacitación equipo Sodimac
   - Traspaso infraestructura GCP

**Resultado:** Sodimac nunca queda sin servicio

---

### **¿Puede escalar si crece mucho?**

**Capacidad actual:**
- 10,000 usuarios simultáneos
- 100,000 proyectos activos
- 1 millón APU queries/día

**Escalamiento automático:**
- Firebase auto-scale hasta 50k usuarios
- CDN global (latencia <100ms anywhere)
- Database sharding si >100k usuarios

**Costo escalamiento:**
- 0-5k usuarios: Incluido en $12 MM
- 5k-15k usuarios: +$2 MM/año
- 15k-50k usuarios: +$5 MM/año

**5,000 especialistas Sodimac:** Totalmente cubierto base.

---

## 🎯 ESTRATÉGICAS

### **¿Easy o Construmart pueden copiar esto?**

**Sí, pero:**

1. **Tiempo desarrollo:** 12-18 meses desde cero
2. **Costo:** $80-120 MM inversión
3. **Riesgo:** Puede fracasar (no hay garantía adopción)
4. **Expertise:** Necesitan equipo especializado IA

**Ventaja Sodimac:**
- Listo HOY (no en 18 meses)
- Inversión 10x menor
- First mover advantage
- 5,000 especialistas ya en ecosistema

**Ventana oportunidad:** 12-18 meses antes que competencia reaccione.

---

### **¿Por qué no desarrollamos esto internamente?**

**Análisis costo-beneficio:**

| Factor | Interno | CLAUDIA (Cussen) |
|--------|---------|------------------|
| **Tiempo** | 18 meses | 30 días |
| **Costo Year 1** | $100 MM | $12 MM |
| **Riesgo** | Alto | Bajo (probado) |
| **Team** | Contratar 5 devs | 0 (Cussen) |
| **Mantención** | $30 MM/año | $12 MM/año |
| **IP** | 100% Sodimac | Licencia |
| **Focus** | Distracción | Core business |

**Recomendación típica:** Licenciar tech no-core, desarrollar interno solo core business.

¿Sodimac es tech company? No. ¿Debe serlo? No. Debe vender construcción mejor que nadie.

---

### **¿Qué pasa con la data de comportamiento de especialistas?**

**Propiedad data:**
- 100% Sodimac
- Exportable mensualmente
- Formato: CSV/JSON/Excel

**Insights valiosos:**

1. **Demanda predictiva:**
   - Qué materiales se agregan a proyectos activos
   - Estacionalidad (verano vs invierno)
   - Proyecciones stock 30-60 días

2. **Segmentación clientes:**
   - Tipo proyectos (residencial, comercial, industrial)
   - Ticket promedio por tipo
   - Frecuencia compra

3. **Optimización precios:**
   - Elasticidad demanda por producto
   - Comparación vs competencia
   - Oportunidades descuentos

**Valor data:** Puede valer más que la herramienta misma.

---

### **¿Cómo evitamos que especialistas usen CLAUDIA pero compren en Easy?**

**Estrategias integradas:**

1. **Priorización algoritmo:**
   - IA recomienda Sodimac primero
   - Resalta stock disponible Sodimac
   - Muestra puntos GO potenciales

2. **Descuentos exclusivos:**
   - 5-10% descuento app-exclusive
   - Solo aplica comprando vía CLAUDIA
   - Código único trackeable

3. **Gamificación:**
   - Más proyectos = más beneficios
   - Ranking especialistas top
   - Acceso early a ofertas

4. **Fricción competencia:**
   - Precios competencia actualizados menos frecuente
   - Stock competencia no real-time
   - No deep-link a competencia

**Meta realista:** 45-50% conversión (vs 16% actual sin herramienta)

---

### **¿Qué pasa si queremos comprar CLAUDIA 100%?**

**Opción 3: Compra total IP**

**Precio:** CLP $45.000.000 (one-time)

**Incluye:**
- Código fuente completo (ownership)
- Base 816 APUs + metodología actualización
- Infraestructura GCP (transfer ownership)
- Marca CLAUDIA (trademark)
- 6 meses transición asistida Cussen

**Post-compra:**
- Sodimac 100% propietario
- Puede modificar libremente
- Puede revender/licenciar
- Cussen sale completamente

**Trade-offs:**
- Mayor inversión inicial
- Sodimac debe mantener (team interno)
- Sin updates automáticos Cussen
- Riesgo tech en Sodimac

**Cuándo tiene sentido:**
- Sodimac quiere desarrollar features propios
- Plan >5 años con CLAUDIA
- Equipo tech interno robusto

---

## 💼 LEGALES

### **¿Quién es responsable si hay un problema con los APUs?**

**Disclaimer contractual:**
- APUs son referenciales (no garantía precio exacto)
- Especialista responsable validar precios finales
- Sodimac puede agregar disclaimer en app

**Responsabilidad Cussen:**
- Actualizar APUs trimestralmente
- Corregir errores reportados 48 horas
- Fuentes: ONDAC + mercado chileno

**Protección:**
- Seguro E&O (Errors & Omissions) Cussen
- Indemnización hasta valor contrato
- No responsabilidad por decisiones constructivas

---

### **¿Cumple normativas protección datos?**

**Compliance:**
- ✅ Ley 19.628 Chile (Protección Vida Privada)
- ✅ GDPR ready (si Sodimac exporta)
- ✅ ISO 27001 (Firebase certificado)

**Medidas:**
- Encriptación datos en tránsito (HTTPS)
- Encriptación datos en reposo (Firebase)
- Acceso basado en roles (RBAC)
- Logs auditables 12 meses
- Derecho olvido (GDPR)

**DPO:** Cussen designa Data Protection Officer si requerido.

---

### **¿Qué pasa con la marca CLAUDIA?**

**Opción licencia (Opción 1 y 2):**
- Marca CLAUDIA propiedad Cussen
- Sodimac white-label "Sodimac PRO Constructor powered by CLAUDIA"
- Branding 90% Sodimac, 10% Cussen

**Opción compra (Opción 3):**
- Trademark CLAUDIA transferido a Sodimac
- 100% ownership
- Puede renombrar libremente

---

## 🚀 IMPLEMENTACIÓN

### **¿Cuánto demora estar operativos?**

**Timeline realista:**

```
Semana 1-2:  Setup técnico (APIs, white-label)
Semana 3:    Testing interno Sodimac
Semana 4:    Piloto 50 especialistas
Semana 5-8:  Ajustes + lanzamiento gradual
Semana 9-12: Onboarding masivo 5,000 especialistas

Total: 3 meses operación plena
```

**Fast-track posible:** 6 semanas si hay urgencia.

---

### **¿Qué necesita Sodimac proveer?**

**Recursos Sodimac:**

1. **Técnicos:**
   - 1 developer API integration (2 semanas)
   - Acceso APIs (productos, stock, puntos GO)
   - Credentials GCP (si quieren proyecto separado)

2. **Comerciales:**
   - Lista emails Círculo Especialistas
   - Material comunicación (logo, colores, copy)
   - Sponsor ejecutivo (Gerente Comercial B2B)

3. **Operacionales:**
   - Capacitadores (3 personas) para eventos presenciales
   - Espacio eventos lanzamiento (tienda flagship)

**Total esfuerzo Sodimac:** ~100 horas team (1 mes part-time)

---

### **¿Cómo capacitamos a los especialistas?**

**Plan onboarding:**

**Digital:**
- Video tutorial 3 minutos (in-app)
- Guía PDF descargable
- FAQs interactivo
- Tooltips in-app

**Presencial:**
- 3 eventos lanzamiento (Santiago, Conce, Valpo)
- 2 horas cada uno (50 especialistas c/u)
- Demo en vivo + hands-on
- Cussen + Sodimac co-presentan

**Soporte:**
- WhatsApp grupal primeros 30 días
- Webinar mensual Q&A
- Video tips semanales

**Meta:** 60% adopción primeros 90 días.

---

## 💡 MISCELÁNEAS

### **¿Por qué Telegram y no WhatsApp?**

**Telegram ventajas:**
- API gratuita ilimitada
- Bots nativos (WhatsApp requiere WhatsApp Business)
- Sin límites mensajes (WhatsApp cobra por mensaje)
- Mejor UX para notificaciones automatizadas
- Canales broadcasts (WhatsApp limitado)

**Realidad:**
- 80% constructores tienen Telegram (muy usado en obra)
- WhatsApp puede agregarse Fase 2 si Sodimac quiere ($5k setup)

---

### **¿Puede personalizarse más allá del white-label?**

**Sí, features custom:**

Ejemplos pedidos típicos:
- Integración ERP propio Sodimac
- Módulo cotizaciones formales PDF
- Sistema tickets soporte integrado
- Reportes ejecutivos personalizados

**Costo:** Variable según complejidad
**Timeline:** 2-8 semanas según feature
**Proceso:** Backlog priorizado trimestral

---

### **¿Qué tan maduro está el producto?**

**Status actual:**
- ✅ En producción desde octubre 2024
- ✅ 150+ usuarios activos (versión pública)
- ✅ 98.5% uptime últimos 3 meses
- ✅ 4.2/5 rating usuarios beta
- ✅ 0 incidentes críticos

**No es MVP:** Es producto maduro ready-to-scale.

---

### **¿Puedo ver referencias de otros clientes?**

**Actualmente:** CLAUDIA no tiene clientes enterprise (Sodimac sería primero)

**Por qué es bueno para Sodimac:**
- ✅ Exclusividad sector construcción
- ✅ No hay competencia usando misma tech
- ✅ Customize 100% a necesidades Sodimac

**Referencias tech Cussen:**
- Portfolio: cussen.cl
- Proyectos IA: 17 apps desarrolladas
- LinkedIn/GitHub verificables

---

## 📞 CONTACTO DUDAS TÉCNICAS

**Cussen Tech:**
- Email técnico: dev@cussen.cl
- Email comercial: info@cussen.cl
- WhatsApp: [número]
- Reunión Zoom: Agendar vía Pablo Araya

**Pablo Araya (Facilitador Comercial):**
- Email: [email Pablo]
- WhatsApp: [WhatsApp Pablo]

---

**Última actualización:** 2025-01-14
**Versión documento:** 1.0
