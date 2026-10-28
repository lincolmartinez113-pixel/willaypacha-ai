import { existsSync } from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';

/**
 * Capa de lenguas originarias con modelos abiertos de Meta.
 * Fuente de verdad: skills/lenguas-originarias-meta (SKILL.md del proyecto).
 *
 * Reglas que este módulo hace cumplir:
 * 1. El TTS se ejecuta en el SERVIDOR, nunca en el navegador.
 * 2. Cada audio se etiqueta «voz sintética — modelo MMS de Meta» (u Omnilingual).
 *    Nunca se presenta como voz de un hablante nativo.
 * 3. Si una síntesis no está disponible, se DECLARA; nunca se simula.
 * 4. NLLB-200 solo cubre quechua (quy_Latn, Ayacucho) y aimara (ayr_Latn);
 *    asháninka NO está cubierto: su ruta es Muse Spark + glosario validado.
 * 5. SeamlessM4T queda DESCARTADO: su lista oficial de 101 lenguas de entrada
 *    de voz no incluye quechua, aimara ni asháninka.
 */

const TTS_MMS = {
  qu: { checkpoint: 'facebook/mms-tts-quz', lengua: 'Quechua (Cusco)', licencia: 'CC-BY-NC 4.0', notaVariedad: 'quz = quechua del Cusco; referencia para el Cusco-Collao de Puno, no idéntico' },
  ay: { checkpoint: 'facebook/mms-tts-ayr', lengua: 'Aimara (Central)', licencia: 'CC-BY-NC 4.0', notaVariedad: 'ayr = aimara central' },
  ash: { checkpoint: 'facebook/mms-tts-cni', lengua: 'Asháninka (general)', licencia: 'CC-BY-NC 4.0', notaVariedad: 'cni = asháninka general; la comunidad es del Perené, variedad no idéntica' },
};

const ASR = {
  preferido: {
    motor: 'Omnilingual ASR (Meta AI, 2025)',
    licencia: 'Apache 2.0',
    estado: 'código de la lengua por confirmar en la lista oficial del modelo antes de usar (ítem expreso de la auditoría de la Etapa 4)',
  },
  respaldo: {
    motor: 'facebook/mms-1b-all + adaptador por lengua',
    licencia: 'CC-BY-NC 4.0',
  },
  navegador: {
    motor: 'Web Speech API (respaldo del navegador)',
    licencia: 'según el navegador',
    nota: 'Respaldo de transcripción declarado en la interfaz; cobertura confiable principalmente en español.',
  },
};

const TRADUCCION = {
  qu: { ruta: 'NLLB-200 (quy_Latn — quechua de Ayacucho)', licencia: 'CC-BY-NC 4.0', nota: 'la variedad de NLLB es Ayacucho; se declara' },
  ay: { ruta: 'NLLB-200 (ayr_Latn)', licencia: 'CC-BY-NC 4.0' },
  ash: { ruta: 'NLLB-200 NO cubre asháninka → ruta Muse Spark + glosario validado (P3 + P6)', licencia: '—' },
};

function ttsDisponible(lengua) {
  if (!config.idiomas.ttsHabilitado) {
    return {
      disponible: false,
      motivo: 'La síntesis de voz de MMS no está habilitada en esta instancia (requiere IDIOMAS_TTS_HABILITADO=true y los checkpoints descargados en el servidor). La interfaz lo declara en lugar de simularla.',
    };
  }
  const rutaModelos = config.idiomas.ttsRutaModelos;
  if (!rutaModelos || !existsSync(path.join(rutaModelos, TTS_MMS[lengua]?.checkpoint || '_'))) {
    return {
      disponible: false,
      motivo: `Checkpoint ${TTS_MMS[lengua]?.checkpoint || lengua} no descargado en ${rutaModelos || '(sin ruta configurada)'}.`,
    };
  }
  return { disponible: true, etiqueta: `voz sintética — modelo MMS de Meta (${TTS_MMS[lengua].lengua})` };
}

export function disponibilidadIdiomas() {
  return {
    tts: Object.fromEntries(
      Object.entries(TTS_MMS).map(([lengua, info]) => [
        lengua,
        { ...info, ...ttsDisponible(lengua), etiqueta: 'voz sintética — modelo MMS de Meta' },
      ]),
    ),
    ttsEjecucion: 'servidor (server/idiomas/) — nunca en el navegador',
    asr: ASR,
    traduccion: TRADUCCION,
    descartados: [
      { motor: 'SeamlessM4T v2', motivo: 'su lista oficial (101 lenguas de entrada de voz) no incluye quechua, aimara ni asháninka' },
    ],
    limitesDeclarados: [
      'Variedades: los checkpoints no son réplica exacta de las variedades locales (quz = Cusco; cni = asháninka general; quy de NLLB = Ayacucho). La validación por hablantes es obligatoria.',
      'Calidad: modelos de investigación con corpus limitados (en MMS, en gran parte lecturas grabadas); la inteligibilidad se prueba con hablantes antes de uso público serio.',
      'Licencia: MMS y NLLB-200 son CC-BY-NC 4.0 (no comercial). Un despliegue comercial futuro exige otra ruta o licencia. Omnilingual ASR es Apache 2.0.',
    ],
  };
}

/** TTS en servidor. Sin modelos, responde declarando indisponibilidad (nunca simula). */
export function sintetizarVoz({ texto, lengua }) {
  if (!TTS_MMS[lengua]) {
    return { ok: false, estado: 400, cuerpo: { error: `lengua no soportada para TTS: ${lengua}` } };
  }
  const disponibilidad = ttsDisponible(lengua);
  if (!disponibilidad.disponible) {
    return { ok: false, estado: 503, cuerpo: { disponible: false, ...disponibilidad, checkpoint: TTS_MMS[lengua].checkpoint, licencia: TTS_MMS[lengua].licencia } };
  }
  // Punto de integración con transformers (VitsModel + AutoTokenizer) cuando los
  // checkpoints estén descargados. Aquí no se simula audio: se devuelve la ruta.
  return { ok: false, estado: 501, cuerpo: { disponible: false, motivo: 'punto de integración definido; requiere la librería de transformers en el servidor con el checkpoint descargado', checkpoint: TTS_MMS[lengua].checkpoint, etiqueta: 'voz sintética — modelo MMS de Meta' } };
}

/** Transcripción en servidor (Muse Voice / Omnilingual / MMS-1b-all). */
export function transcribir() {
  return {
    disponible: false,
    estado: 503,
    motivo: estadoMetaNota(),
  };
}

function estadoMetaNota() {
  return config.meta.apiKey
    ? 'Endpoint de transcripción a confirmar con la documentación oficial de la Meta Model API.'
    : 'Sin META_API_KEY en esta instancia: la transcripción en vivo no está disponible. Respaldo declarado: Web Speech API del navegador (principalmente español).';
}
