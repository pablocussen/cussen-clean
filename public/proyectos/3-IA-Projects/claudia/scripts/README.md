# Scripts de Herramientas - ClaudIA

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
