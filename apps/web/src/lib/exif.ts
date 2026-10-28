/** Lector EXIF mínimo para JPEG (APP1/TIFF): fecha de toma, cámara y GPS.
 *  Los metadatos se muestran en la ficha y pueden ocultarse de las vistas
 *  públicas; la evidencia original nunca se edita. */

export interface MetadatosExif {
  fechaToma?: string;
  camara?: string;
  coordenadas?: { lat: number; lng: number };
}

export function leerExif(buffer: ArrayBuffer): MetadatosExif | null {
  try {
    const v = new DataView(buffer);
    if (v.byteLength < 12 || v.getUint16(0) !== 0xffd8) return null; // no es JPEG
    let offset = 2;
    while (offset + 4 < v.byteLength) {
      if (v.getUint8(offset) !== 0xff) break;
      const marcador = v.getUint8(offset + 1);
      if (marcador === 0xd8 || marcador === 0x01 || (marcador >= 0xd0 && marcador <= 0xd7)) {
        offset += 2; // marcadores sin longitud
        continue;
      }
      const tamano = v.getUint16(offset + 2);
      if (marcador === 0xda) break; // inicio de la imagen
      if (marcador === 0xe1 && tamano > 8 && v.getUint32(offset + 4) === 0x45786966) {
        return leerTiff(v, offset + 10);
      }
      offset += 2 + tamano;
    }
    return null;
  } catch {
    return null;
  }
}

function leerTiff(v: DataView, base: number): MetadatosExif | null {
  const little = v.getUint16(base) === 0x4949;
  const u16 = (p: number) => v.getUint16(p, little);
  const u32 = (p: number) => v.getUint32(p, little);

  const tamanos: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };

  /** Devuelve cada tag con la posición ABSOLUTA donde viven sus datos. */
  function leerIfd(ifd: number): Map<number, { tipo: number; cuenta: number; posDato: number }> {
    const entradas = new Map<number, { tipo: number; cuenta: number; posDato: number }>();
    const n = u16(ifd);
    for (let i = 0; i < n; i++) {
      const p = ifd + 2 + i * 12;
      const tag = u16(p);
      const tipo = u16(p + 2);
      const cuenta = u32(p + 4);
      const total = (tamanos[tipo] || 1) * cuenta;
      entradas.set(tag, { tipo, cuenta, posDato: total <= 4 ? p + 8 : base + u32(p + 8) });
    }
    return entradas;
  }

  const texto = (e: { cuenta: number; posDato: number }): string => {
    let s = '';
    for (let i = 0; i < e.cuenta - 1; i++) s += String.fromCharCode(v.getUint8(e.posDato + i));
    return s.trim();
  };

  const resultado: MetadatosExif = {};
  const ifd0 = base + u32(base + 4);
  const dir0 = leerIfd(ifd0);

  const make = dir0.get(0x010f);
  const model = dir0.get(0x0110);
  if (make) resultado.camara = texto(make);
  if (model) resultado.camara = `${resultado.camara ?? ''} ${texto(model)}`.trim();

  const fecha = dir0.get(0x0132);
  if (fecha) resultado.fechaToma = texto(fecha);

  // Sub-IFD Exif: el puntero es un LONG inline; su VALOR (leído en posDato) es
  // el desplazamiento relativo al encabezado TIFF.
  const punteroExif = dir0.get(0x8769);
  if (punteroExif) {
    const exif = leerIfd(base + u32(punteroExif.posDato));
    const dto = exif.get(0x9003);
    if (dto) resultado.fechaToma = texto(dto);
  }

  // Sub-IFD GPS.
  const punteroGps = dir0.get(0x8825);
  if (punteroGps) {
    const gps = leerIfd(base + u32(punteroGps.posDato));
    const latRef = gps.get(0x0001);
    const latVal = gps.get(0x0002);
    const lngRef = gps.get(0x0003);
    const lngVal = gps.get(0x0004);
    const racional = (e: { posDato: number }, i: number): number => {
      const p = e.posDato + i * 8;
      return u32(p) / (u32(p + 4) || 1);
    };
    if (latRef && latVal && lngRef && lngVal) {
      const lat = racional(latVal, 0) + racional(latVal, 1) / 60 + racional(latVal, 2) / 3600;
      const lng = racional(lngVal, 0) + racional(lngVal, 1) / 60 + racional(lngVal, 2) / 3600;
      const refLat = String.fromCharCode(v.getUint8(latRef.posDato));
      const refLng = String.fromCharCode(v.getUint8(lngRef.posDato));
      resultado.coordenadas = {
        lat: refLat === 'S' ? -lat : lat,
        lng: refLng === 'W' ? -lng : lng,
      };
    }
  }

  return resultado.camara || resultado.fechaToma || resultado.coordenadas ? resultado : null;
}
