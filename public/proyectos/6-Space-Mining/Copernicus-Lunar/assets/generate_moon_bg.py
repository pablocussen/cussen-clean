"""
Generate a dark lunar-textured background image.
Produces a subtle, dark surface texture with crater-like features.
Designed to be used with CSS opacity ~0.08 as a web page background.

Usage: python generate_moon_bg.py
Output: moon-bg.jpg in the same directory as this script.

Requirements: pip install Pillow numpy
"""
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
from pathlib import Path
import os

WIDTH, HEIGHT = 1920, 1080
SEED = 42


def make_noise(w, h, scale=1.0, rng=None):
    """Generate smooth noise via upscaled random + blur."""
    if rng is None:
        rng = np.random.default_rng(SEED)
    small_w = max(4, int(w / scale))
    small_h = max(4, int(h / scale))
    noise = rng.random((small_h, small_w), dtype=np.float32)
    img = Image.fromarray((noise * 255).astype(np.uint8), mode='L')
    img = img.resize((w, h), Image.BICUBIC)
    img = img.filter(ImageFilter.GaussianBlur(radius=scale * 0.8))
    return np.array(img, dtype=np.float32) / 255.0


def add_craters(canvas, rng):
    """Draw realistic crater features: mostly tiny, few large, blended."""
    h, w = canvas.shape
    result = canvas.copy()

    # Power-law size distribution: many small craters, few large
    # Small craters (2-8 px): 300
    # Medium craters (8-30 px): 40
    # Large craters (30-100 px): 8
    crater_specs = [
        (300, 2, 8),
        (40, 8, 30),
        (8, 30, 100),
    ]

    for count, r_min, r_max in crater_specs:
        for _ in range(count):
            cx = int(rng.integers(0, w))
            cy = int(rng.integers(0, h))
            r = int(rng.integers(r_min, r_max))
            depth = float(rng.uniform(0.02, 0.08))  # subtle depth

            # Create crater mask using distance field
            y_lo = max(0, cy - r - 2)
            y_hi = min(h, cy + r + 3)
            x_lo = max(0, cx - r - 2)
            x_hi = min(w, cx + r + 3)

            if y_hi <= y_lo or x_hi <= x_lo:
                continue

            yy, xx = np.ogrid[y_lo:y_hi, x_lo:x_hi]
            dist = np.sqrt((xx - cx) ** 2.0 + (yy - cy) ** 2.0)

            # Interior depression (smooth falloff)
            interior = np.clip(1.0 - dist / r, 0, 1) ** 1.5
            result[y_lo:y_hi, x_lo:x_hi] -= interior * depth

            # Raised rim (ring just outside crater)
            rim = np.exp(-((dist - r) ** 2) / (2 * (r * 0.15) ** 2))
            rim_height = depth * 0.4
            result[y_lo:y_hi, x_lo:x_hi] += rim * rim_height

            # Shadow on one side (simulate low sun angle from upper-left)
            shadow_offset_x = (xx - cx).astype(np.float32) / max(r, 1)
            shadow_mask = np.clip(-shadow_offset_x * 0.5, 0, 1) * interior
            result[y_lo:y_hi, x_lo:x_hi] -= shadow_mask * depth * 0.3

    return np.clip(result, 0, 1)


def generate_moon_bg():
    rng = np.random.default_rng(SEED)

    # Layer 1: large-scale brightness variation (maria = darker, highlands = lighter)
    base = make_noise(WIDTH, HEIGHT, scale=250, rng=rng)
    base = base * 0.12 + 0.10  # Very dark overall (range ~0.10-0.22)

    # Layer 2: medium-scale terrain undulation
    med = make_noise(WIDTH, HEIGHT, scale=60, rng=rng)
    base += med * 0.05

    # Layer 3: fine terrain texture
    fine = make_noise(WIDTH, HEIGHT, scale=15, rng=rng)
    base += fine * 0.03

    # Layer 4: micro texture (regolith grain)
    micro = make_noise(WIDTH, HEIGHT, scale=4, rng=rng)
    base += micro * 0.015

    # Layer 5: pixel-level noise
    grain = rng.random((HEIGHT, WIDTH), dtype=np.float32)
    base += grain * 0.01

    base = np.clip(base, 0, 1)

    # Add craters with realistic size distribution
    base = add_craters(base, rng=rng)

    # Subtle radial vignette (darker edges)
    y, x = np.ogrid[:HEIGHT, :WIDTH]
    vcx, vcy = WIDTH / 2.0, HEIGHT / 2.0
    dist = np.sqrt((x - vcx) ** 2 + (y - vcy) ** 2)
    max_dist = np.sqrt(vcx ** 2 + vcy ** 2)
    vignette = 1.0 - 0.25 * (dist / max_dist) ** 2.0
    base = base * vignette

    # Final: clamp, convert to 8-bit grayscale, then blur slightly for smoothness
    base = np.clip(base * 255, 0, 255).astype(np.uint8)
    img = Image.fromarray(base, mode='L')
    img = img.filter(ImageFilter.GaussianBlur(radius=0.7))

    # Convert to RGB
    img_rgb = img.convert('RGB')

    # Save
    out_path = Path(__file__).parent / 'moon-bg.jpg'
    img_rgb.save(str(out_path), 'JPEG', quality=88)
    size_kb = os.path.getsize(out_path) / 1024
    print(f"Saved: {out_path} ({size_kb:.0f} KB)")
    print(f"Dimensions: {WIDTH}x{HEIGHT}")


if __name__ == '__main__':
    generate_moon_bg()
