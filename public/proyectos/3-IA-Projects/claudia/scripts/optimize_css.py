"""
Extraer, limpiar y minificar CSS del HTML
"""

import re

# Leer HTML
with open("web_app/index.html", "r", encoding="utf-8") as f:
    html = f.read()

# Extraer CSS entre <style> y </style>
style_match = re.search(r"<style>(.*?)</style>", html, re.DOTALL)
if not style_match:
    print("No se encontró CSS inline")
    exit(1)

css = style_match.group(1)

print(f"CSS original: {len(css)} caracteres")

# LIMPIEZAS Y OPTIMIZACIONES

# 1. Remover variables CSS de Sodimac (cambiadas según feedback del usuario)
css = css.replace("--sodimac-red:", "--primary-color:")
css = css.replace("--sodimac-red-light:", "--primary-light:")
css = css.replace("--sodimac-red-dark:", "--primary-dark:")
css = css.replace("--sodimac-white:", "--color-white:")
css = css.replace("--sodimac-black:", "--color-black:")
css = css.replace("--sodimac-gray-light:", "--gray-light:")
css = css.replace("--sodimac-gray:", "--gray-medium:")
css = css.replace("--sodimac-gray-dark:", "--gray-dark:")
css = css.replace("--sodimac-gray-darker:", "--gray-darker:")

# 2. Actualizar referencias a las variables
css = css.replace("var(--sodimac-red)", "var(--primary-color)")
css = css.replace("var(--sodimac-red-light)", "var(--primary-light)")
css = css.replace("var(--sodimac-red-dark)", "var(--primary-dark)")
css = css.replace("var(--sodimac-white)", "var(--color-white)")
css = css.replace("var(--sodimac-black)", "var(--color-black)")
css = css.replace("var(--sodimac-gray-light)", "var(--gray-light)")
css = css.replace("var(--sodimac-gray)", "var(--gray-medium)")
css = css.replace("var(--sodimac-gray-dark)", "var(--gray-dark)")
css = css.replace("var(--sodimac-gray-darker)", "var(--gray-darker)")

# 3. Minificar: remover comentarios
css = re.sub(r"/\*.*?\*/", "", css, flags=re.DOTALL)

# 4. Remover espacios en blanco excesivos
css = re.sub(r"\n\s*\n", "\n", css)  # Múltiples líneas en blanco
css = re.sub(r"\s+", " ", css)  # Espacios múltiples
css = re.sub(r"\s*{\s*", "{", css)  # Espacios alrededor de {
css = re.sub(r"\s*}\s*", "}", css)  # Espacios alrededor de }
css = re.sub(r"\s*:\s*", ":", css)  # Espacios alrededor de :
css = re.sub(r"\s*;\s*", ";", css)  # Espacios alrededor de ;
css = re.sub(r";\s*}", "}", css)  # ; antes de }

print(f"CSS limpio y minificado: {len(css)} caracteres")
print(
    f"Reducción: {len(style_match.group(1)) - len(css)} caracteres ({100 - len(css)*100/len(style_match.group(1)):.1f}%)"
)

# Guardar CSS externo
with open("web_app/css/claudia-main.min.css", "w", encoding="utf-8") as f:
    f.write(css.strip())

print("CSS guardado en web_app/css/claudia-main.min.css")

# Actualizar HTML para usar CSS externo
html_updated = html.replace(
    style_match.group(0), '<link rel="stylesheet" href="css/claudia-main.min.css">'
)

with open("web_app/index.html", "w", encoding="utf-8") as f:
    f.write(html_updated)

print("HTML actualizado para usar CSS externo")
print(f"Tamaño HTML reducido en {len(html) - len(html_updated)} caracteres")
