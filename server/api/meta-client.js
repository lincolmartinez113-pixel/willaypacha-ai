import { config } from '../config.js';

/**
 * Cliente de la Meta Model API (único proveedor de IA permitido por diseño).
 * SDK compatible con OpenAI: POST {apiBase}/chat/completions.
 *
 * Reglas del protocolo:
 * - Si no hay META_API_KEY, el sistema corre en MODO DEMO declarado (sin llamadas).
 * - Si la API responde 402 por falta de créditos: detenerse y reportar.
 *   NUNCA sustituir el proveedor de modelos.
 */
export class MetaApiError extends Error {
  constructor(mensaje, { estado, codigo } = {}) {
    super(mensaje);
    this.name = 'MetaApiError';
    this.estado = estado;
    this.codigo = codigo;
  }
}

export function estadoMeta() {
  return {
    habilitada: Boolean(config.meta.apiKey),
    modo: config.meta.apiKey ? 'en-vivo' : 'demo',
    apiBase: config.meta.apiBase,
    modelo: config.meta.modelo,
    modeloVoz: config.meta.modeloVoz,
    modeloSegmentacion: config.meta.modeloSegmentacion,
    nota:
      'Los parámetros de integración se confirman en el portal oficial de la Meta Model API. Ante error 402 (créditos), el protocolo ordena detenerse y reportar, no cambiar de proveedor.',
  };
}

export async function chatCompletion(mensajes, { temperatura = 0.2, maxTokens = 900, promptVersion = '' } = {}) {
  if (!config.meta.apiKey) {
    throw new MetaApiError('META_NO_CONFIGURADA: sin META_API_KEY el sistema corre en modo demo.', { codigo: 'META_NO_CONFIGURADA' });
  }
  const respuesta = await fetch(`${config.meta.apiBase}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.meta.apiKey}`,
    },
    body: JSON.stringify({
      model: config.meta.modelo,
      messages: mensajes,
      temperature: temperatura,
      max_tokens: maxTokens,
      metadata: promptVersion ? { prompt_version: promptVersion } : undefined,
    }),
  });
  if (respuesta.status === 402) {
    throw new MetaApiError('402: créditos de la Meta Model API agotados. El protocolo ordena detenerse y reportar.', { estado: 402, codigo: 'SIN_CREDITOS' });
  }
  if (!respuesta.ok) {
    const cuerpo = await respuesta.text().catch(() => '');
    throw new MetaApiError(`Meta Model API respondió ${respuesta.status}: ${cuerpo.slice(0, 300)}`, { estado: respuesta.status });
  }
  const datos = await respuesta.json();
  return datos?.choices?.[0]?.message?.content ?? '';
}

/** Registro de Generación IA para cualquier salida en vivo. */
export function registroGeneracionEnVivo({ promptNombre, promptVersion, fuentes }) {
  return {
    modo: 'en-vivo',
    modelo: config.meta.modelo,
    proveedor: 'Meta Model API',
    prompt: `${promptNombre} ${promptVersion}`,
    fecha: new Date().toISOString(),
    fuentes,
  };
}
