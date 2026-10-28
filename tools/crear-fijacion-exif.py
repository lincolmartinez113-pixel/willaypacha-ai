"""Genera un JPEG de prueba con EXIF GPS para verificar el lector del cliente."""
from PIL import Image

try:
    import piexif
    CON_PIEXIF = True
except ImportError:
    CON_PIEXIF = False

img = Image.new('RGB', (64, 48), (30, 90, 120))
ruta = r'tools\fijacion-exif.jpg'

if CON_PIEXIF:
    exif_dict = {
        '0th': {
            piexif.ImageIFD.Make: b'TestCam',
            piexif.ImageIFD.Model: b'ModelX',
            piexif.ImageIFD.DateTime: b'2026:10:20 15:30:00',
        },
        'Exif': {piexif.ExifIFD.DateTimeOriginal: b'2026:10:20 15:30:00'},
        'GPS': {
            piexif.GPSIFD.GPSLatitudeRef: b'S',
            piexif.GPSIFD.GPSLatitude: ((14, 1), (45, 1), (0, 1)),
            piexif.GPSIFD.GPSLongitudeRef: b'W',
            piexif.GPSIFD.GPSLongitude: ((70, 1), (34, 1), (48, 1)),
        },
    }
    img.save(ruta)
    piexif.insert(piexif.dump(exif_dict), ruta, ruta)
    print('fixture con GPS OK (piexif)')
else:
    img.save(ruta, exif=b'')
    print('piexif no disponible: fixture sin GPS')
