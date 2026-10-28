"""Optimización de fotografías del proyecto (reproducible).
Convierte los JPG de apps/web/src/assets/img a WebP calidad 80 (máx. 1600 px),
lo que reduce el peso del archivo único sin tocar la procedencia ni el crédito.
Uso: python tools/optimizar-fotos.py
"""
from pathlib import Path
from PIL import Image

RAIZ = Path('apps/web/src/assets/img')
total_jpg = 0
total_webp = 0

for jpg in sorted(RAIZ.glob('*.jpg')):
    webp = jpg.with_suffix('.webp')
    total_jpg += jpg.stat().st_size
    with Image.open(jpg) as im:
        im = im.convert('RGB')
        if im.width > 1600:
            alto = round(im.height * 1600 / im.width)
            im = im.resize((1600, alto), Image.LANCZOS)
        im.save(webp, 'WEBP', quality=80, method=6)
    total_webp += webp.stat().st_size
    print(f'{jpg.name} → {webp.name}  {jpg.stat().st_size/1024:.0f} KB → {webp.stat().st_size/1024:.0f} KB')

print(f'\nTOTAL: {total_jpg/1048576:.2f} MB → {total_webp/1048576:.2f} MB '
      f'(ahorro {100 - total_webp*100/total_jpg:.0f} %)')
