#!/usr/bin/env python3
"""
Test rápido del módulo de sugerencias inteligentes.
Prueba casos reales: baño, cocina, ampliación.
"""

import json
import logging
from claudia_modules import apu_suggestions

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

def test_case(name, description="", surface=None):
    print(f"\n{'='*70}")
    print(f"🧪 TEST: {name}")
    print(f"{'='*70}")

    result = apu_suggestions.suggest_apus_for_project(
        project_name=name,
        project_description=description,
        surface_area=surface
    )

    if result['success']:
        print(f"✅ SUCCESS - {result['count']} APUs sugeridos")
        print(f"💰 Total estimado: ${result['total_estimated']:,.0f}")
        print(f"📊 Confianza: {result['confidence']}")
        print(f"🏗️  Tipo: {result['project_type']}")

        if result.get('warnings'):
            print(f"\n⚠️  ADVERTENCIAS:")
            for w in result['warnings']:
                print(f"   - {w}")

        print(f"\n📋 APUs SUGERIDOS:")
        for i, sugg in enumerate(result['suggestions'][:10], 1):  # Primeros 10
            print(f"   {i}. {sugg['nombre']}")
            print(f"      {sugg['cantidad_estimada']} {sugg['unidad']} × ${sugg['precio_unitario']:,.0f} = ${sugg['subtotal']:,.0f}")
            if sugg.get('justificacion'):
                print(f"      💡 {sugg['justificacion']}")

        if result['count'] > 10:
            print(f"\n   ... y {result['count'] - 10} APUs más")

    else:
        print(f"❌ ERROR: {result.get('error', 'Unknown error')}")

    return result

if __name__ == "__main__":
    print("🤖 CLAUDIA - TEST DE SUGERENCIAS INTELIGENTES")
    print("="*70)

    # Casos de prueba
    test_cases = [
        ("Remodelación baño 6m²", "Baño completo con ducha", 6.0),
        ("Ampliación cocina", "Agregar 15m² a cocina existente", 15.0),
        ("Casa básica 80m²", "", 80.0),
        ("Quincho 4x6m", "Quincho con asador", 24.0),
        ("Cierre perímetro", "Muro 20 metros lineales", None),
    ]

    results = []
    for name, desc, surface in test_cases:
        result = test_case(name, desc, surface)
        results.append({
            'name': name,
            'success': result['success'],
            'count': result.get('count', 0),
            'total': result.get('total_estimated', 0)
        })

    # Resumen
    print(f"\n\n{'='*70}")
    print("📊 RESUMEN DE PRUEBAS")
    print(f"{'='*70}")

    for r in results:
        status = "✅" if r['success'] else "❌"
        print(f"{status} {r['name']}: {r['count']} APUs, ${r['total']:,.0f}")

    success_rate = sum(1 for r in results if r['success']) / len(results) * 100
    print(f"\n🎯 Tasa de éxito: {success_rate:.0f}%")
