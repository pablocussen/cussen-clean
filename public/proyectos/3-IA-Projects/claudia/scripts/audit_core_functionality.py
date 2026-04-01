"""
Auditoría completa de funcionalidad core de ClaudIA
Verifica integridad de datos, archivos críticos y configuración
"""

import json
import os
from pathlib import Path

print("=" * 60)
print("AUDITORÍA COMPLETA - ClaudIA v8.4")
print("=" * 60)

errors = []
warnings = []
successes = []

# ===== 1. VERIFICAR ARCHIVOS CRÍTICOS =====
print("\n[1/7] Verificando archivos críticos...")

critical_files = [
    "web_app/index.html",
    "web_app/apu_database.json",
    "web_app/apu_database.min.json",
    "web_app/apu_index.json",
    "web_app/css/claudia-main.min.css",
    "web_app/js/claudia-complete.js",
    "web_app/js/claudia-telegram-linking.js",
    "web_app/js/claudia-export-pro.js",
    "web_app/js/claudia-smart-suggestions.js",
    "web_app/js/claudia-search-optimized.js",
]

for filepath in critical_files:
    if os.path.exists(filepath):
        size = os.path.getsize(filepath) / 1024
        successes.append(f"✅ {filepath} ({size:.1f}KB)")
    else:
        errors.append(f"❌ FALTA: {filepath}")

# ===== 2. VERIFICAR INTEGRIDAD DE APUs =====
print("\n[2/7] Verificando integridad de base de datos APU...")

try:
    with open("web_app/apu_database.json", "r", encoding="utf-8") as f:
        data = json.load(f)
        apus = data.get("actividades", [])

    # Verificar estructura de cada APU
    apu_issues = 0
    campos_requeridos = ["id", "nombre", "categoria", "unidad"]

    for i, apu in enumerate(apus):
        for campo in campos_requeridos:
            if campo not in apu or not apu[campo]:
                apu_issues += 1
                if apu_issues <= 5:  # Solo mostrar primeros 5
                    warnings.append(
                        f"⚠️ APU #{i} falta campo '{campo}': {apu.get('nombre', 'SIN NOMBRE')}"
                    )

    if apu_issues == 0:
        successes.append(f"✅ {len(apus)} APUs con estructura correcta")
    else:
        warnings.append(f"⚠️ {apu_issues} APUs con campos faltantes")

    # Verificar categorías
    categorias = set(apu.get("categoria", "SIN CATEGORIA") for apu in apus)
    successes.append(f"✅ {len(categorias)} categorías únicas encontradas")

    # Verificar precios
    apus_sin_precio = sum(
        1 for apu in apus if not apu.get("precio") and not apu.get("precio_referencia")
    )
    if apus_sin_precio > 0:
        warnings.append(f"⚠️ {apus_sin_precio} APUs sin precio")
    else:
        successes.append(f"✅ Todos los APUs tienen precio")

except Exception as e:
    errors.append(f"❌ Error leyendo APU database: {e}")

# ===== 3. VERIFICAR ÍNDICE Y CHUNKS =====
print("\n[3/7] Verificando índice y sistema de chunks...")

try:
    with open("web_app/apu_index.json", "r", encoding="utf-8") as f:
        index = json.load(f)

    total_apus_index = index.get("total_apus", 0)
    total_categorias = index.get("total_categorias", 0)

    if total_apus_index == len(apus):
        successes.append(f"✅ Índice sincronizado: {total_apus_index} APUs")
    else:
        warnings.append(f"⚠️ Índice desincronizado: {total_apus_index} vs {len(apus)}")

    successes.append(f"✅ {total_categorias} categorías indexadas")

except Exception as e:
    errors.append(f"❌ Error verificando índice: {e}")

# Verificar chunks
chunk_files = list(Path("web_app/apu_chunks").glob("*.json"))
if len(chunk_files) >= 24:
    successes.append(f"✅ {len(chunk_files)} archivos de chunks encontrados")
else:
    warnings.append(f"⚠️ Solo {len(chunk_files)} chunks (esperados 24+)")

# ===== 4. VERIFICAR PLANTILLAS =====
print("\n[4/7] Verificando plantillas de proyecto...")

try:
    with open("web_app/js/claudia-complete.js", "r", encoding="utf-8") as f:
        content = f.read()

    # Buscar projectTemplates
    if "const projectTemplates = [" in content:
        # Contar plantillas (buscar 'id:' dentro de projectTemplates)
        start = content.find("const projectTemplates = [")
        end = content.find("];", start)
        templates_section = content[start:end]
        template_count = templates_section.count("id: '")

        if template_count >= 10:
            successes.append(f"✅ {template_count} plantillas de proyecto disponibles")
        else:
            warnings.append(f"⚠️ Solo {template_count} plantillas (esperadas 10)")
    else:
        warnings.append(f"⚠️ No se encontró array de plantillas")

except Exception as e:
    errors.append(f"❌ Error verificando plantillas: {e}")

# ===== 5. VERIFICAR MÓDULOS JAVASCRIPT =====
print("\n[5/7] Verificando módulos JavaScript...")

js_modules = [
    "claudia-complete.js",
    "claudia-telegram-linking.js",
    "claudia-export-pro.js",
    "claudia-smart-suggestions.js",
    "claudia-search-optimized.js",
    "claudia-search-filter.js",
    "claudia-analytics.js",
]

for module in js_modules:
    filepath = f"web_app/js/{module}"
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        # Verificar sintaxis básica (no puede haber errores obvios)
        if "function" in content or "const" in content or "let" in content:
            size = len(content) / 1024
            successes.append(f"✅ {module} ({size:.1f}KB) - válido")
        else:
            warnings.append(f"⚠️ {module} puede estar corrupto")
    else:
        warnings.append(f"⚠️ Falta módulo: {module}")

# ===== 6. VERIFICAR HTML PRINCIPAL =====
print("\n[6/7] Verificando HTML principal...")

try:
    with open("web_app/index.html", "r", encoding="utf-8") as f:
        html = f.read()

    # Verificar referencias críticas
    checks = [
        ("claudia-main.min.css", "CSS minificado"),
        ("claudia-complete.js", "Script core"),
        ("claudia-telegram-linking.js", "Módulo Telegram"),
        ("telegram-linking-modal", "Modal Telegram"),
        ("apu-database", "Sección APU"),
        ("project-activities", "Sección actividades"),
    ]

    for check, description in checks:
        if check in html:
            successes.append(f"✅ HTML contiene: {description}")
        else:
            warnings.append(f"⚠️ HTML no contiene: {description}")

    # Verificar tamaño
    html_size = len(html) / 1024
    if html_size < 150:
        successes.append(f"✅ HTML optimizado: {html_size:.1f}KB")
    else:
        warnings.append(f"⚠️ HTML grande: {html_size:.1f}KB")

except Exception as e:
    errors.append(f"❌ Error verificando HTML: {e}")

# ===== 7. VERIFICAR ESTRUCTURA DE DIRECTORIOS =====
print("\n[7/7] Verificando estructura de directorios...")

required_dirs = [
    "web_app",
    "web_app/js",
    "web_app/css",
    "web_app/apu_chunks",
]

for directory in required_dirs:
    if os.path.isdir(directory):
        file_count = len(os.listdir(directory))
        successes.append(f"✅ {directory}/ ({file_count} archivos)")
    else:
        errors.append(f"❌ Falta directorio: {directory}")

# ===== RESUMEN FINAL =====
print("\n" + "=" * 60)
print("RESUMEN DE AUDITORÍA")
print("=" * 60)

print(f"\n✅ ÉXITOS: {len(successes)}")
for success in successes:
    print(f"  {success}")

if warnings:
    print(f"\n⚠️ ADVERTENCIAS: {len(warnings)}")
    for warning in warnings:
        print(f"  {warning}")

if errors:
    print(f"\n❌ ERRORES CRÍTICOS: {len(errors)}")
    for error in errors:
        print(f"  {error}")
else:
    print(f"\n❌ ERRORES CRÍTICOS: 0")

# Calcular nivel de confianza
total_checks = len(successes) + len(warnings) + len(errors)
confidence_score = (len(successes) + len(warnings) * 0.5) / total_checks * 100

print("\n" + "=" * 60)
print(f"NIVEL DE CONFIANZA: {confidence_score:.1f}%")
print("=" * 60)

if confidence_score >= 95:
    print("🟢 PRODUCCIÓN LISTA - Alta confiabilidad")
elif confidence_score >= 85:
    print("🟡 PRODUCCIÓN OK - Confiabilidad buena con advertencias menores")
elif confidence_score >= 70:
    print("🟠 REQUIERE ATENCIÓN - Confiabilidad media")
else:
    print("🔴 NO APTO PARA PRODUCCIÓN - Problemas críticos")

print("\n")

# Guardar reporte
with open("AUDIT_REPORT.txt", "w", encoding="utf-8") as f:
    f.write(f"AUDITORÍA ClaudIA - {confidence_score:.1f}% Confianza\n")
    f.write("=" * 60 + "\n\n")
    f.write(f"ÉXITOS: {len(successes)}\n")
    for s in successes:
        f.write(f"{s}\n")
    f.write(f"\nADVERTENCIAS: {len(warnings)}\n")
    for w in warnings:
        f.write(f"{w}\n")
    f.write(f"\nERRORES: {len(errors)}\n")
    for e in errors:
        f.write(f"{e}\n")

print("Reporte guardado en: AUDIT_REPORT.txt")
