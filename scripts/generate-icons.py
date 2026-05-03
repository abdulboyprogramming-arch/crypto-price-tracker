#!/usr/bin/env python3
"""
CRYPTO PRICE TRACKER - Icon Generator
Generates all required icons for Web App PWA and Browser Extension
Run: python scripts/generate-icons.py
"""

import os
import sys
from PIL import Image, ImageDraw, ImageFont

# ============================================
# CONFIGURATION
# ============================================

# Web App icon sizes (PWA standard)
WEB_ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

# Browser Extension icon sizes
EXTENSION_ICON_SIZES = [16, 48, 128]

# Output directories (FIXED: removed web-app/ prefix)
WEB_ICON_DIR = "assets/icons"
EXTENSION_ICON_DIR = "browser-extension/icons"

# Colors
PRIMARY_COLOR = (0, 212, 255)      # Cyan (#00d4ff)
SECONDARY_COLOR = (123, 44, 191)   # Purple (#7b2cbf)
BACKGROUND_COLOR = (26, 26, 46)    # Dark blue (#1a1a2e)
ACCENT_COLOR = (16, 185, 129)      # Green (#10b981)

# ============================================
# CREATE DIRECTORIES
# ============================================

def create_directories():
    """Create icon directories if they don't exist"""
    os.makedirs(WEB_ICON_DIR, exist_ok=True)
    os.makedirs(EXTENSION_ICON_DIR, exist_ok=True)
    print(f"✅ Created directories: {WEB_ICON_DIR}, {EXTENSION_ICON_DIR}")

# ============================================
# WEB APP ICONS (PWA)
# ============================================

def create_web_icon(size, filename):
    """Create a professional PWA icon with gradient and chart design"""
    
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw gradient circle background
    for i in range(size):
        # Create radial gradient effect
        t = i / size
        r = int(PRIMARY_COLOR[0] * (1 - t) + SECONDARY_COLOR[0] * t)
        g = int(PRIMARY_COLOR[1] * (1 - t) + SECONDARY_COLOR[1] * t)
        b = int(PRIMARY_COLOR[2] * (1 - t) + SECONDARY_COLOR[2] * t)
        alpha = int(255 * (1 - t * 0.3))
        draw.ellipse([i//2, i//2, size - i//2, size - i//2], fill=(r, g, b, alpha))
    
    # Draw chart line (upward trend)
    margin = size // 6
    chart_points = [
        (margin, size - margin),                           # start low
        (size // 3, size // 2),                            # middle
        (size // 2, size // 3),                            # higher
        (2 * size // 3, size // 4),                        # even higher
        (size - margin, size // 5)                         # peak
    ]
    
    # Draw chart line with glow effect
    line_width = max(3, size // 30)
    for i in range(len(chart_points) - 1):
        draw.line([chart_points[i], chart_points[i+1]], fill=ACCENT_COLOR, width=line_width)
    
    # Draw dots on chart points
    dot_radius = max(2, size // 40)
    for point in chart_points:
        draw.ellipse([
            point[0] - dot_radius, point[1] - dot_radius,
            point[0] + dot_radius, point[1] + dot_radius
        ], fill=(255, 255, 255))
    
    # Draw currency symbol (optional for larger icons)
    if size >= 128:
        try:
            # Try to load a font, fallback to default
            font_size = size // 3
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
        except:
            font = ImageFont.load_default()
        
        draw.text((size // 2, size // 2), "₿", fill=(255, 255, 255, 200), 
                  anchor="mm", font=font)
    
    # Save icon
    img.save(filename, 'PNG', optimize=True)
    print(f"  ✓ Created: {filename} ({size}x{size})")

def generate_web_icons():
    """Generate all PWA icons"""
    print("\n📱 Generating Web App (PWA) Icons...")
    for size in WEB_ICON_SIZES:
        filename = os.path.join(WEB_ICON_DIR, f"icon-{size}x{size}.png")
        create_web_icon(size, filename)
    print(f"✅ Generated {len(WEB_ICON_SIZES)} web app icons")

# ============================================
# BROWSER EXTENSION ICONS
# ============================================

def create_extension_icon(size, filename):
    """Create browser extension icon"""
    
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw circular gradient background
    for i in range(size):
        t = i / size
        r = int(PRIMARY_COLOR[0] * (1 - t) + SECONDARY_COLOR[0] * t)
        g = int(PRIMARY_COLOR[1] * (1 - t) + SECONDARY_COLOR[1] * t)
        b = int(PRIMARY_COLOR[2] * (1 - t) + SECONDARY_COLOR[2] * t)
        draw.ellipse([i//2, i//2, size - i//2, size - i//2], fill=(r, g, b, 255))
    
    # Draw simple chart line for extension icon
    margin = size // 5
    chart_points = [
        (margin, size - margin),
        (size // 2, size // 2),
        (size - margin, size // 3)
    ]
    
    line_width = max(2, size // 25)
    for i in range(len(chart_points) - 1):
        draw.line([chart_points[i], chart_points[i+1]], fill=(255, 255, 255), width=line_width)
    
    # Draw dot at end
    dot_radius = max(1, size // 25)
    draw.ellipse([
        chart_points[-1][0] - dot_radius, chart_points[-1][1] - dot_radius,
        chart_points[-1][0] + dot_radius, chart_points[-1][1] + dot_radius
    ], fill=ACCENT_COLOR)
    
    # Save icon
    img.save(filename, 'PNG', optimize=True)
    print(f"  ✓ Created: {filename} ({size}x{size})")

def generate_extension_icons():
    """Generate all browser extension icons"""
    print("\n🧩 Generating Browser Extension Icons...")
    for size in EXTENSION_ICON_SIZES:
        filename = os.path.join(EXTENSION_ICON_DIR, f"icon{size}.png")
        create_extension_icon(size, filename)
    print(f"✅ Generated {len(EXTENSION_ICON_SIZES)} extension icons")

# ============================================
# CREATE PLACEHOLDER ASSETS
# ============================================

def create_placeholder_images():
    """Create placeholder images for missing assets"""
    
    # Create a simple default coin image
    default_coin_path = os.path.join(WEB_ICON_DIR, "default-coin.png")
    if not os.path.exists(default_coin_path):
        size = 32
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        draw.ellipse([2, 2, size-2, size-2], fill=PRIMARY_COLOR)
        draw.ellipse([size//4, size//4, 3*size//4, 3*size//4], fill=BACKGROUND_COLOR)
        img.save(default_coin_path, 'PNG')
        print(f"  ✓ Created: {default_coin_path}")

# ============================================
# MAIN
# ============================================

def main():
    print("=" * 50)
    print("  CRYPTO TRACKER PRO - ICON GENERATOR")
    print("  Version 1.0")
    print("=" * 50)
    
    # Create directories
    create_directories()
    
    # Generate icons
    generate_web_icons()
    generate_extension_icons()
    create_placeholder_images()
    
    print("\n" + "=" * 50)
    print("  ✅ ICON GENERATION COMPLETE!")
    print("=" * 50)
    print(f"\n📁 Web App Icons: {WEB_ICON_DIR}")
    print(f"📁 Extension Icons: {EXTENSION_ICON_DIR}")
    print("\n💡 Tip: For production, replace with professionally designed icons")

if __name__ == "__main__":
    # Check if Pillow is installed
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        print("❌ Pillow library not installed!")
        print("   Install with: pip install Pillow")
        sys.exit(1)
    
    main()