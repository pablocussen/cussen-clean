"""
Organizar y consolidar archivos del proyecto ClaudIA
Mover scripts de herramientas a carpeta dedicada
"""

import os
import shutil
from pathlib import Path

print("=" * 60)
print("ORGANIZANDO PROYECTO CLAUDIA")
print("=" * 60)

# Crear estructura de carpetas
folders_to_create = [
    "scripts",  # Scripts Python de herramientas
    "docs/audits",  # Reportes de auditoría
    "docs/optimizations",  # Documentación de optimizaciones
]

print("\n[1/4] Creando estructura de carpetas...")
for folder in folders_to_create:
    Path(folder).mkdir(parents=True, exist_ok=True)
    print(f"  OK: {folder}/")

# Scripts Python a mover a /scripts
print("\n[2/4] Moviendo scripts de herramientas...")
scripts_to_move = [
    "expand_apus.py",
    "expand_to_800.py",
    "add_final_apus.py",
    "normalize_categories.py",
    "create_apu_index.py",
    "create_apu_chunks.py",
    "optimize_css.py",
    "audit_core_functionality.py",
    "audit_simple.py",
    "organize_project.py",  # Este mismo script
]

moved = 0
for script in scripts_to_move:
    if os.path.exists(script):
        dest = f"scripts/{script}"
        if not os.path.exists(dest):  # No sobrescribir
            shutil.copy2(script, dest)
            print(f"  Copiado: {script} -> scripts/")
            moved += 1

print(f"  Total: {moved} scripts organizados")

# Documentación a mover a /docs
print("\n[3/4] Organizando documentación...")
docs_to_organize = {
    "OPTIMIZACIONES_COMPLETADAS.md": "docs/optimizations/",
    "AUDIT_REPORT.txt": "docs/audits/",
}

for doc, dest_folder in docs_to_organize.items():
    if os.path.exists(doc):
        dest = f"{dest_folder}{doc}"
        if not os.path.exists(dest):
            shutil.copy2(doc, dest)
            print(f"  Movido: {doc} -> {dest_folder}")

# Crear README en scripts/
print("\n[4/4] Creando documentación de scripts...")
readme_content = """# Scripts de Herramientas - ClaudIA

Este directorio contiene scripts Python para mantenimiento y optimización.

## Scripts de Expansión de APUs
- `expand_apus.py` - Expansión inicial de APUs (206 -> 336)
- `expand_to_800.py` - Expansión completa (336 -> 706)
- `add_final_apus.py` - APUs finales (706 -> 816)

## Scripts de Optimización
- `normalize_categories.py` - Normaliza categorías (elimina duplicados)
- `create_apu_index.py` - Crea índice de búsqueda rápida
- `create_apu_chunks.py` - Divide APUs en chunks por categoría
- `optimize_css.py` - Minifica y externaliza CSS

## Scripts de Auditoría
- `audit_core_functionality.py` - Auditoría completa con emojis
- `audit_simple.py` - Auditoría simplificada (sin unicode)

## Scripts de Organización
- `organize_project.py` - Este script (organiza estructura)

## Uso

Ejecutar desde la raíz del proyecto:
```bash
python scripts/nombre_script.py
```

## Notas
- Todos los scripts se ejecutan desde la raíz del proyecto
- No tienen dependencias externas (solo stdlib Python)
- Generan reportes en formato TXT/JSON/MD
"""

with open("scripts/README.md", "w", encoding="utf-8") as f:
    f.write(readme_content)

print("  OK: scripts/README.md")

# Generar estructura del proyecto
print("\n" + "=" * 60)
print("ESTRUCTURA FINAL DEL PROYECTO")
print("=" * 60)


def print_tree(directory, prefix="", max_depth=3, current_depth=0):
    """Imprime árbol de directorios"""
    if current_depth >= max_depth:
        return

    try:
        items = sorted(os.listdir(directory))
        dirs = [
            i
            for i in items
            if os.path.isdir(os.path.join(directory, i))
            and not i.startswith(".")
            and not i.startswith("__")
        ]

        for i, item in enumerate(dirs):
            is_last = i == len(dirs) - 1
            path = os.path.join(directory, item)

            connector = "└── " if is_last else "├── "
            print(f"{prefix}{connector}{item}/")

            extension = "    " if is_last else "│   "
            print_tree(path, prefix + extension, max_depth, current_depth + 1)
    except PermissionError:
        pass


print("\nclaudia_bot/")
print_tree(".", "")

print("\n" + "=" * 60)
print("RESUMEN")
print("=" * 60)
print(f"\n• Scripts organizados en: scripts/")
print(f"• Documentación en: docs/")
print(f"• Aplicación web en: web_app/")
print(f"• Archivos Python: {len([f for f in os.listdir('scripts') if f.endswith('.py')])} scripts")
print(f"• Documentos: {len([f for f in os.listdir('docs', recursive=True)])} archivos")

print("\nPROYECTO ORGANIZADO")
