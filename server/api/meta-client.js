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

/**
 * Variante que además devuelve el uso de tokens reportado por la API
 * (`usage`), el `finish_reason` y la negativa (`refusal`) del modelo.
 * La usan /api/vivo-prueba y la ruta en vivo de /api/explicar.
 * El texto se extrae con extraerTextoContenido (cadena, bloques o null).
 * chatCompletion queda como variante simple sin uso reportado.
 * No altera la firma de chatCompletion.
 */
/**
 * Extrae el texto mostrable de un mensaje de chat completion.
 * Formas OpenAI-compatibles: cadena, arreglo de bloques ({type: 'text',
 * text: '…'}) o null cuando el modelo no produjo contenido (p. ej. el
 * presupuesto de tokens se agotó en razonamiento interno con
 * finish_reason=length). Nunca lanza: lo desconocido es cadena vacía y la
 * causa real la reporta quien llama con finish_reason y usage.
 */
export function extraerTextoContenido(mensaje) {
  const contenido = mensaje?.content;
  if (typeof contenido === 'string') return contenido;
  if (Array.isArray(contenido)) {
    return contenido
      .filter((b) => b && typeof b.text === 'string' && (b.type === undefined || b.type === 'text'))
      .map((b) => b.text)
      .join('');
  }
  return '';
}

export async function chatCompletionConUso(mensajes, { temperatura = 0.2, maxTokens = 900, promptVersion = '', timeoutMs = 0 } = {}) {
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
    signal: timeoutMs > 0 ? AbortSignal.timeout(timeoutMs) : undefined,
  });
  if (respuesta.status === 402) {
    throw new MetaApiError('402: créditos de la Meta Model API agotados. El protocolo ordena detenerse y reportar.', { estado: 402, codigo: 'SIN_CREDITOS' });
  }
  if (!respuesta.ok) {
    const cuerpo = await respuesta.text().catch(() => '');
    throw new MetaApiError(`Meta Model API respondió ${respuesta.status}: ${cuerpo.slice(0, 300)}`, { estado: respuesta.status });
  }
  const datos = await respuesta.json();
  return {
    texto: extraerTextoContenido(datos?.choices?.[0]?.message),
    finishReason: datos?.choices?.[0]?.finish_reason ?? null,
    negativa: datos?.choices?.[0]?.message?.refusal ?? null,
    uso: datos?.usage ?? null,
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
