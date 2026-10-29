import { Router } from 'express';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { estadoMeta, MetaApiError } from './meta-client.js';

/**
 * POST /api/sam-prueba — endpoint de prueba de la llamada en vivo a SAM 3.1.
 *
 * Vía real, confirmada en la documentación oficial de la Meta Model API:
 * - Endpoint: POST {META_API_BASE}/responses (Responses API, no streaming).
 * - Modelo: sam-3.1 (server/config.js: META_SEGMENT_MODEL).
 * - Cuerpo: input con un mensaje de usuario que lleva input_text (frase
 *   nominal fija, un concepto) + input_image (data URL base64 de la muestra).
 * - Respuesta: output[].content[] con output_text.text en la gramática
 *   "<Nf>id<|box;...|><|mask;...|>" (una línea por fotograma; una imagen es
 *   el fotograma <0f>). Cero coincidencias = output_text vacío (válido).
 * Fuentes: https://dev.meta.ai/docs/media-segmentation
 *          https://dev.meta.ai/docs/sam/overview
 *          https://dev.meta.ai/docs/sam/reading-segmentation
 *          https://dev.meta.ai/docs/sam/segmenting
 *
 * Reglas del protocolo (igual que /api/vivo-prueba):
 * - Imagen y prompt FIJADOS (muestra del proyecto, no acepta entrada del
 *   usuario: evita inyección y gasto imprevisto).
 * - Sin META_API_KEY responde 503 declarado (nada se simula).
 * - Ante 402 de la API: detenerse y reportar, nunca cambiar de proveedor.
 * - NUNCA se inventa geometría: si la respuesta no trae el formato
 *   documentado, se devuelve el texto crudo con motivo declarado.
 * - El verificador P6 NO se toca ni se debilita: no aplica aquí porque la
 *   salida es geometría (cajas y máscaras), no texto generado; ningún texto
 *   del modelo se presenta como afirmación.
 */

export const IMAGEN_MUESTRA_RUTA = path.join('apps', 'web', 'src', 'assets', 'img', 'altiplano-ganado.jpg');
export const PROMPT_SAM_PRUEBA = 'alpaca';
export const MIME_MUESTRA = 'image/jpeg';
export const TIMEOUT_SAM_PRUEBA_MS = 60000;

// Tarifa oficial SAM: segmentación de imagen, por imagen (no por token).
// Fuente: https://dev.meta.ai/docs/pricing-rate-limits ("Image segmentation
// $2.50 per 1,000 images"). La misma tarifa rige streaming y no-streaming.
export const SAM_PRECIO_POR_1K_IMAGENES_USD = 2.5;
export const SAM_PRECIO_FUENTE = 'https://dev.meta.ai/docs/pricing-rate-limits';

function sha256Hex(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function parsearCamposBox(interior) {
  const campos = {};
  for (const parte of String(interior).split(';')) {
    const eq = parte.indexOf('=');
    if (eq > 0) campos[parte.slice(0, eq)] = parte.slice(eq + 1);
  }
  const entero = (v) => (v !== undefined && /^\d+$/.test(v) ? Number(v) : null);
  return {
    x1: entero(campos.x1),
    y1: entero(campos.y1),
    x2: entero(campos.x2),
    y2: entero(campos.y2),
    w: entero(campos.w),
    h: entero(campos.h),
    c: campos.c !== undefined && campos.c !== '' && Number.isFinite(Number(campos.c)) ? Number(campos.c) : null,
  };
}

function parsearMascara(interior) {
  const m = String(interior).match(/^x=0;y=0(?:;c=([^;]*))?;data=(\d+),(\d+),([~!])([\s\S]*)$/);
  if (!m) return null;
  const [, confianza, h, w, codificacion, payload] = m;
  return {
    h: Number(h),
    w: Number(w),
    codificacion: codificacion === '~' ? 'lossless' : 'one_bit',
    marcador: codificacion,
    c: confianza !== undefined && confianza !== '' && Number.isFinite(Number(confianza)) ? Number(confianza) : null,
    payloadChars: payload.length,
    payload,
  };
}

/**
 * Parsea el output_text de SAM a detecciones.
 * Gramática: "<Nf>id<|box;...|><|mask;...|>(,id<|box;...|><|mask;...|>)*"
 * por línea. El payload base85 puede contener "|" y "," según el alfabeto,
 * así que cada máscara se corta por el inicio del siguiente registro
 * (",<id><|box;") o el fin de línea, no por el primer "|>".
 */
export function parsearSalidaSegmentacion(salidaCruda) {
  const texto = String(salidaCruda ?? '').trim();
  if (!texto) return { detecciones: [], lineas: 0, registrosNoReconocidos: 0 };
  const detecciones = [];
  let registrosNoReconocidos = 0;
  for (const linea of texto.split('\n').map((l) => l.trim()).filter(Boolean)) {
    const marco = linea.match(/^<(\d+)f>/);
    if (!marco) {
      registrosNoReconocidos += 1;
      continue;
    }
    const frame = Number(marco[1]);
    const resto = linea.slice(marco[0].length);
    const patronRegistro = /(\d+)<\|box;([^|]*)\|><\|mask;/g;
    const inicios = [...resto.matchAll(patronRegistro)];
    if (inicios.length === 0) {
      registrosNoReconocidos += 1;
      continue;
    }
    for (let i = 0; i < inicios.length; i += 1) {
      const id = Number(inicios[i][1]);
      const interiorBox = inicios[i][2];
      const inicioMascara = inicios[i].index + inicios[i][0].length;
      // La coma separadora está justo antes del siguiente registro; no se
      // busca hacia atrás porque el payload base85 podría contener comas.
      const finMascara = i + 1 < inicios.length ? inicios[i + 1].index - 1 : resto.length;
      let interiorMascara = resto.slice(inicioMascara, finMascara < inicioMascara ? resto.length : finMascara);
      if (!interiorMascara.endsWith('|>')) {
        const ultimoCierre = interiorMascara.lastIndexOf('|>');
        interiorMascara = ultimoCierre >= 0 ? interiorMascara.slice(0, ultimoCierre) : interiorMascara;
      } else {
        interiorMascara = interiorMascara.slice(0, -2);
      }
      const box = parsearCamposBox(interiorBox);
      const mask = parsearMascara(interiorMascara);
      if (box.x1 === null || mask === null) {
        registrosNoReconocidos += 1;
        continue;
      }
      detecciones.push({ frame, id, box, mask });
    }
  }
  return { detecciones, lineas: texto.split('\n').filter((l) => l.trim()).length, registrosNoReconocidos };
}

/** Extrae el output_text de una respuesta no-streaming de POST /v1/responses. */
export function extraerTextoRespuestas(datos) {
  const piezas = [];
  const salida = datos?.output;
  if (Array.isArray(salida)) {
    for (const item of salida) {
      const contenido = item?.content;
      if (!Array.isArray(contenido)) continue;
      for (const bloque of contenido) {
        if (bloque?.type === 'output_text' && typeof bloque.text === 'string') piezas.push(bloque.text);
      }
    }
  }
  if (piezas.length === 0 && typeof datos?.output_text === 'string') piezas.push(datos.output_text);
  return piezas.join('');
}

export function costoSamImagen({ imagenes = 1 } = {}) {
  const n = Number.isFinite(imagenes) && imagenes > 0 ? imagenes : 1;
  return {
    imagenes: n,
    tarifaPor1kImagenesUSD: SAM_PRECIO_POR_1K_IMAGENES_USD,
    costoEstimadoUSD: Number(((n / 1000) * SAM_PRECIO_POR_1K_IMAGENES_USD).toFixed(6)),
    moneda: 'USD',
    fuente: SAM_PRECIO_FUENTE,
    nota: 'Tarifa oficial SAM image segmentation ($2.50 por cada 1000 imágenes); el precio es por imagen, no por token, y rige igual con streaming o sin él.',
  };
}

async function llamarSamRespuestas({ dataUrl, modelo, apiBase, apiKey }) {
  const respuesta = await fetch(`${apiBase}/responses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelo,
      input: [
        {
          type: 'message',
          role: 'user',
          content: [
            { type: 'input_text', text: PROMPT_SAM_PRUEBA },
            { type: 'input_image', image_url: dataUrl },
          ],
        },
      ],
      metadata: { include_confidence: 'true' },
    }),
    signal: AbortSignal.timeout(TIMEOUT_SAM_PRUEBA_MS),
  });
  if (respuesta.status === 402) {
    throw new MetaApiError('402: créditos de la Meta Model API agotados. El protocolo ordena detenerse y reportar.', { estado: 402, codigo: 'SIN_CREDITOS' });
  }
  if (!respuesta.ok) {
    const cuerpo = await respuesta.text().catch(() => '');
    throw new MetaApiError(`Meta Model API respondió ${respuesta.status}: ${cuerpo.slice(0, 300)}`, { estado: respuesta.status });
  }
  return respuesta.json();
}

export const samPrueba = Router();

samPrueba.post('/sam-prueba', async (req, res) => {
  const meta = estadoMeta();
  if (!meta.habilitada) {
    return res.status(503).json({
      error: 'META_NO_CONFIGURADA',
      modo: 'demo',
      via: `POST ${config.meta.apiBase}/responses (modelo ${config.meta.modeloSegmentacion})`,
      mensaje:
        'Sin META_API_KEY no hay llamada en vivo a SAM 3.1: complete la clave en el archivo .env de la raíz y reinicie el servidor. Nada se simula.',
    });
  }

  let muestra;
  try {
    const rutaAbsoluta = path.join(config.raiz, IMAGEN_MUESTRA_RUTA);
    const bytes = readFileSync(rutaAbsoluta);
    muestra = {
      archivo: IMAGEN_MUESTRA_RUTA.split(path.sep).join('/'),
      bytes: bytes.length,
      sha256: sha256Hex(bytes),
      mime: MIME_MUESTRA,
      prompt: PROMPT_SAM_PRUEBA,
      dataUrl: `data:${MIME_MUESTRA};base64,${bytes.toString('base64')}`,
    };
  } catch {
    return res.status(500).json({
      error: 'MUESTRA_NO_ENCONTRADA',
      modo: 'en-vivo',
      mensaje: `La imagen de muestra fijada no existe en el proyecto: ${IMAGEN_MUESTRA_RUTA.split(path.sep).join('/')}. Sin muestra no hay llamada.`,
    });
  }

  try {
    const datos = await llamarSamRespuestas({
      dataUrl: muestra.dataUrl,
      modelo: config.meta.modeloSegmentacion,
      apiBase: config.meta.apiBase,
      apiKey: config.meta.apiKey,
    });

    const estado = datos?.status ?? null;
    if (estado !== null && estado !== 'completed') {
      return res.status(502).json({
        error: 'SAM_NO_COMPLETADA',
        modo: 'en-vivo',
        modelo: datos?.model ?? config.meta.modeloSegmentacion,
        estado,
        detalle: datos?.error ?? datos?.incomplete_details ?? null,
        mensaje: `SAM 3.1 no completó la segmentación (status: ${estado}). Respuesta declarada, sin geometría inventada.`,
      });
    }

    const salidaCruda = extraerTextoRespuestas(datos);
    const { detecciones, lineas, registrosNoReconocidos } = parsearSalidaSegmentacion(salidaCruda);
    const costo = costoSamImagen({ imagenes: 1 });

    return res.json({
      modo: 'en-vivo',
      modelo: datos?.model ?? config.meta.modeloSegmentacion,
      modeloSolicitado: config.meta.modeloSegmentacion,
      apiBase: config.meta.apiBase,
      via: `POST ${config.meta.apiBase}/responses`,
      estado: estado ?? 'completed',
      muestra: {
        archivo: muestra.archivo,
        bytes: muestra.bytes,
        sha256: muestra.sha256,
        mime: muestra.mime,
        prompt: muestra.prompt,
      },
      verificadorP6: {
        aplica: false,
        motivo: 'La salida de SAM 3.1 es geometría (cajas y máscaras), no texto generado: ningún texto del modelo se presenta como afirmación, así que P6 no tiene texto que verificar. El verificador no se modifica.',
      },
      totalDetecciones: detecciones.length,
      detecciones,
      lineasSalida: lineas,
      registrosNoReconocidos,
      formatoNoReconocido:
        detecciones.length === 0 && registrosNoReconocidos > 0
          ? 'La API devolvió texto que no sigue la gramática documentada (<Nf>id<|box;...|><|mask;...|>); se devuelve íntegro en «salidaCruda» sin inventar geometría.'
          : null,
      notaCeroCoincidencias:
        salidaCruda === ''
          ? 'Cero coincidencias: la API completó con output_text vacío, que la documentación declara como resultado válido (el concepto no aparece), no como error.'
          : null,
      notaMascara:
        'Cada máscara se devuelve con su token íntegro (payload base85) más sus dimensiones H×W y codificación. El ráster binario fila por fila requiere decodificar el base85 con la librería @meta-sam/parser (ver docs/sam/client-libraries); este endpoint no decodifica ni re-renderiza píxeles.',
      salidaCruda,
      costo,
      usage: datos?.usage ?? null,
      respuestaId: datos?.id ?? null,
    });
  } catch (error) {
    if (error instanceof MetaApiError && error.codigo === 'SIN_CREDITOS') {
      return res.status(402).json({
        error: 'SIN_CREDITOS',
        modo: 'en-vivo',
        mensaje: 'Llamada en vivo detenida: créditos de la Meta Model API agotados (402). Según el protocolo, no se sustituye el proveedor.',
      });
    }
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      return res.status(504).json({
        error: 'META_TIMEOUT',
        modo: 'en-vivo',
        mensaje: `La Meta Model API no respondió a tiempo (${TIMEOUT_SAM_PRUEBA_MS / 1000} s). Intento declarado, sin reintento automático.`,
      });
    }
    return res.status(502).json({
      error: 'META_ERROR',
      modo: 'en-vivo',
      mensaje: `La llamada en vivo falló de forma declarada: ${error.message}`,
    });
  }
});
