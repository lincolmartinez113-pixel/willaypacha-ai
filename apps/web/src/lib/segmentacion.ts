/** Segmentación visual LOCAL (heurística de color en el cliente).
 *
 *  NO es SAM 3.1 y NO mide química: delimita píxeles cuyo color se aparta del
 *  tono dominante de la imagen (p. ej. una pluma de coloración en el agua) y
 *  calcula el porcentaje del área que ocupan. La interfaz y la lámina llevan
 *  la leyenda obligatoria de límites. Con META_API_KEY, el mismo botón usaría
 *  SAM 3.1 en el servidor; sin ella, el motor activo se declara. */

export interface ResultadoSegmentacion {
  porcentaje: number;
  urlMascara: string;
  ancho: number;
  alto: number;
}

export function segmentarLocal(origen: HTMLImageElement): ResultadoSegmentacion {
  const anchoMax = 560;
  const escala = Math.min(1, anchoMax / (origen.naturalWidth || origen.width));
  const ancho = Math.max(1, Math.round((origen.naturalWidth || origen.width) * escala));
  const alto = Math.max(1, Math.round((origen.naturalHeight || origen.height) * escala));

  const lienzo = document.createElement('canvas');
  lienzo.width = ancho;
  lienzo.height = alto;
  const ctx = lienzo.getContext('2d')!;
  ctx.drawImage(origen, 0, 0, ancho, alto);
  const imagen = ctx.getImageData(0, 0, ancho, alto);
  const d = imagen.data;

  // Tono dominante como referencia (mediana por canal).
  const rs: number[] = [];
  const gs: number[] = [];
  const bs: number[] = [];
  for (let i = 0; i < d.length; i += 40) {
    rs.push(d[i]);
    gs.push(d[i + 1]);
    bs.push(d[i + 2]);
  }
  const mediana = (arr: number[]) => arr.sort((a, b) => a - b)[Math.floor(arr.length / 2)] || 0;
  const r0 = mediana(rs);
  const g0 = mediana(gs);
  const b0 = mediana(bs);

  const mascara = new Uint8ClampedArray(d.length);
  let anomalos = 0;
  let total = 0;
  for (let i = 0; i < d.length; i += 4) {
    total++;
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const distancia = Math.sqrt((r - r0) ** 2 + (g - g0) ** 2 + (b - b0) ** 2);
    const maximo = Math.max(r, g, b);
    const minimo = Math.min(r, g, b);
    const saturacion = maximo === 0 ? 0 : (maximo - minimo) / maximo;
    const calidoDominante = r > g && g >= b * 0.85;
    const anomalo = distancia > 72 || (saturacion > 0.55 && calidoDominante && maximo > 70);
    if (anomalo) {
      anomalos++;
      mascara[i] = 239;
      mascara[i + 1] = 68;
      mascara[i + 2] = 68;
      mascara[i + 3] = 150;
    }
  }

  const salida = ctx.createImageData(ancho, alto);
  // La máscara se dibuja sobre la imagen original (overlay).
  for (let i = 0; i < d.length; i += 4) {
    if (mascara[i + 3] > 0) {
      salida.data[i] = mascara[i];
      salida.data[i + 1] = mascara[i + 1];
      salida.data[i + 2] = mascara[i + 2];
      salida.data[i + 3] = mascara[i + 3];
    } else {
      salida.data[i] = Math.round(d[i] * 0.35 + 10);
      salida.data[i + 1] = Math.round(d[i + 1] * 0.35 + 15);
      salida.data[i + 2] = Math.round(d[i + 2] * 0.35 + 20);
      salida.data[i + 3] = 255;
    }
  }
  ctx.putImageData(salida, 0, 0);

  return {
    porcentaje: total > 0 ? Math.round((anomalos / total) * 1000) / 10 : 0,
    urlMascara: lienzo.toDataURL('image/png'),
    ancho,
    alto,
  };
}

export const LEYENDA_LIMITE =
  'Área visual anómala — una fotografía no mide química: la confirmación corresponde a OEFA o a un laboratorio acreditado.';
