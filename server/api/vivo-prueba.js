import { Router } from 'express';
import { config, leerSeed } from '../config.js';
import { chatCompletionConUso, estadoMeta, MetaApiError, registroGeneracionEnVivo } from './meta-client.js';
import { verificarTexto } from './verificador.js';

/**
 * POST /api/vivo-prueba — endpoint de prueba de la llamada en vivo.
 *
 * - Usa una pregunta corta FIJADA, anclada al registro semilla SR-001
 *   (no acepta pregunta del usuario: evita inyección y gasto imprevisto).
 * - Llama a la Meta Model API (config.meta.apiBase, config.meta.modelo).
 * - El texto en vivo pasa por el verificador P6 en código ANTES de
 *   mostrarse; si P6 lo bloquea, no se muestra.
 * - Devuelve el texto y el costo estimado de la llamada.
 * - Si la API no devuelve texto (p. ej. finish_reason=length con el
 *   presupuesto consumido en razonamiento) o la respuesta llega truncada,
 *   se bloquea con el motivo real; un texto cortado no se muestra parcial.
 * - Sin META_API_KEY responde 503 declarado (nada se simula).
 */

export const REGISTRO_ANCLA_ID = 'SR-001-chognacota-agua';

// Tope de tokens de salida. Los modelos con razonamiento interno consumen
// parte del presupuesto antes de producir contenido (observado en vivo:
// 198 y 889 tokens de razonamiento en distintas corridas; con
// max_tokens=200 el tope se agotó en razonamiento con finish_reason=length
// y content nulo). 2000 deja margen para el razonamiento y una respuesta
// breve completa; si algún día se alcanza, la causa se declara.
export const MAX_TOKENS_VIVO_PRUEBA = 2000;

export const PREGUNTA_VIVO_PRUEBA =
  'Según la evaluación de causalidad de OEFA citada en el registro, ¿qué parámetros superaron los ECA para agua de 2008 (categoría 3) en la quebrada Chogñacota y cuál fue el origen determinado?';

const SISTEMA_VIVO_PRUEBA =
  'Eres WillayPacha AI. Respondes SOLO con el contenido del registro oficial proporcionado, en una sola frase breve en español, atribuida a su fuente («Según OEFA…»). Si algo no está en el registro, dices «No consta». Nunca acusas ni calificas hechos.';

const VERSION_PROMPT_VIVO_PRUEBA = 'vivo-prueba-v1';

function nombresTerceros() {
  const seed = leerSeed();
  const nombres = [];
  for (const u of seed.unidades) {
    nombres.push(u.nombre, u.empresa);
    for (const c of u.componentes) nombres.push(c.nombre);
  }
  return nombres.filter(Boolean);
}

/**
 * Estima el costo de una llamada a partir del `usage` de la API.
 * Si la API no reporta uso, estima tokens como ceil(caracteres/4) y lo
 * declara. La tarifa (USD por cada 1000 tokens) sale de
 * META_PRECIO_POR_1K_TOKENS_USD; si no está publicada (0), el costo es 0
 * y la nota lo declara en lugar de inventar un precio.
 */
export function estimarCosto({ uso = null, textoEntrada = '', textoSalida = '' } = {}) {
  const tokensReporte = uso && Number.isFinite(uso.prompt_tokens) && Number.isFinite(uso.completion_tokens);
  const tokensEntrada = tokensReporte ? uso.prompt_tokens : Math.ceil(String(textoEntrada).length / 4);
  const tokensSalida = tokensReporte ? uso.completion_tokens : Math.ceil(String(textoSalida).length / 4);
  const tarifa = Number(process.env.META_PRECIO_POR_1K_TOKENS_USD || 0);
  const tarifaValida = Number.isFinite(tarifa) && tarifa >= 0 ? tarifa : 0;
  const total = tokensEntrada + tokensSalida;
  const razonamiento = uso?.completion_tokens_details?.reasoning_tokens;
  return {
    tokensEntrada,
    tokensSalida,
    tokensTotal: total,
    tokensRazonamiento: Number.isFinite(razonamiento) ? razonamiento : null,
    tokensEstimados: !tokensReporte,
    metodoEstimacion: tokensReporte ? 'usage reportado por la API' : 'estimación declarada: ceil(caracteres/4) por tramo',
    tarifaPor1kTokensUSD: tarifaValida,
    costoEstimadoUSD: Number(((total / 1000) * tarifaValida).toFixed(6)),
    moneda: 'USD',
    nota:
      tarifaValida === 0
        ? 'Tarifa oficial no publicada: configure META_PRECIO_POR_1K_TOKENS_USD con el precio del portal de la Meta Model API para un costo en dinero; los tokens sí se reportan.'
        : 'Estimación con la tarifa configurada en META_PRECIO_POR_1K_TOKENS_USD.',
  };
}

/**
 * Causas de bloqueo propias de la INTEGRACIÓN, previas al verificador P6.
 * Devuelve null cuando hay texto completo y P6 debe decidir; si no, el
 * motivo real y un texto sustituto fijo («No consta…»). Nunca expone texto
 * del modelo sin aprobación: vacía o truncada, la salida no se muestra.
 */
export function motivoBloqueoIntegracion({ texto = '', finishReason = null, negativa = null, uso = null } = {}) {
  const hayTexto = String(texto || '').trim().length > 0;
  const salida = uso?.completion_tokens;
  const razonamiento = uso?.completion_tokens_details?.reasoning_tokens;
  const detalleRazonamiento = Number.isFinite(razonamiento) && Number.isFinite(salida)
    ? `; ${razonamiento} de ${salida} tokens de salida fueron razonamiento interno del modelo`
    : '';
  if (!hayTexto) {
    const negativaTxt = typeof negativa === 'string' && negativa.trim()
      ? ` El modelo devolvió una negativa: «${negativa.trim().slice(0, 200)}».`
      : '';
    return {
      causa: 'respuesta-vacia',
      motivo: `La API no devolvió texto mostrable (finish_reason: ${finishReason ?? 'desconocido'}${detalleRazonamiento}).${negativaTxt} Sin texto no hay verificación posible: nada se muestra.`,
      texto: 'No consta. La llamada en vivo no devolvió texto mostrable (ver «motivoBloqueo»); nada se muestra sin pasar por el verificador P6.',
    };
  }
  if (finishReason === 'length') {
    return {
      causa: 'respuesta-truncada',
      motivo: `La respuesta llegó truncada por el tope de tokens (finish_reason: length, max_tokens: ${MAX_TOKENS_VIVO_PRUEBA}). Un texto cortado no se presenta como completo: nada se muestra.`,
      texto: 'No consta. La respuesta en vivo llegó truncada por el tope de tokens (ver «motivoBloqueo»); un texto cortado no se presenta como completo.',
    };
  }
  return null;
}

export const vivoPrueba = Router();

vivoPrueba.post('/vivo-prueba', async (req, res) => {
  const meta = estadoMeta();
  if (!meta.habilitada) {
    return res.status(503).json({
      error: 'META_NO_CONFIGURADA',
      modo: 'demo',
      mensaje:
        'Sin META_API_KEY no hay llamada en vivo: complete la clave en el archivo .env de la raíz y reinicie el servidor. Nada se simula.',
    });
  }

  try {
    const seed = leerSeed();
    const ancla = seed.registros.find((r) => r.id === REGISTRO_ANCLA_ID);
    if (!ancla) {
      return res.status(500).json({ error: 'registro ancla no encontrado', registro: REGISTRO_ANCLA_ID });
    }
    const contexto = JSON.stringify({
      id: ancla.id,
      hecho: ancla.hecho,
      fecha: ancla.fecha,
      cita: ancla.citaLiteral,
      organismo: ancla.fuente.organismo,
      documento: ancla.fuente.documento,
      estadoProcesal: ancla.estadoProcesal,
    });
    const mensajes = [
      { role: 'system', content: SISTEMA_VIVO_PRUEBA },
      { role: 'user', content: `Registro oficial: ${contexto}\nPregunta: ${PREGUNTA_VIVO_PRUEBA}` },
    ];

    const { texto, uso, finishReason, negativa } = await chatCompletionConUso(
      mensajes,
      { temperatura: 0.2, maxTokens: MAX_TOKENS_VIVO_PRUEBA, promptVersion: VERSION_PROMPT_VIVO_PRUEBA, timeoutMs: 20000 },
    );

    // P6 en código ANTES de mostrar: una sola afirmación no soportada
    // bloquea la salida completa.
    const verificacion = verificarTexto(texto, [ancla], { nombresTerceros: nombresTerceros() });
    const costoEstimado = estimarCosto({ uso, textoEntrada: JSON.stringify(mensajes), textoSalida: texto });
    const citas = [
      {
        registroId: ancla.id,
        organismo: ancla.fuente.organismo,
        documento: ancla.fuente.documento,
        url: ancla.fuente.url,
        busqueda: ancla.fuente.busqueda,
        fecha: ancla.fecha,
        citaLiteral: ancla.citaLiteral,
        hashDocumento: ancla.hashDocumento,
      },
    ];
    const registroGeneracion = {
      ...registroGeneracionEnVivo({
        promptNombre: 'vivo-prueba',
        promptVersion: VERSION_PROMPT_VIVO_PRUEBA,
        fuentes: [{ id: ancla.id, hash: ancla.hashDocumento }],
      }),
      pregunta: PREGUNTA_VIVO_PRUEBA,
      verificacion,
    };

    // Causa de integración (vacía/truncada) antes que P6: P6 decide solo
    // sobre texto completo. En ambos casos, lo no aprobado no se muestra.
    const bloqueoIntegracion = motivoBloqueoIntegracion({ texto, finishReason, negativa, uso });
    if (bloqueoIntegracion || !verificacion.aprobado) {
      return res.json({
        modo: 'en-vivo',
        modelo: config.meta.modelo,
        apiBase: config.meta.apiBase,
        bloqueado: true,
        finishReason: finishReason ?? null,
        texto: bloqueoIntegracion ? bloqueoIntegracion.texto : 'No consta. El texto generado en vivo no superó la verificación P6 y no se muestra.',
        motivoBloqueo: bloqueoIntegracion ? bloqueoIntegracion.motivo : verificacion.motivoBloqueo,
        verificacion,
        costoEstimado,
        citas,
        registroGeneracion,
      });
    }

    return res.json({
      modo: 'en-vivo',
      modelo: config.meta.modelo,
      apiBase: config.meta.apiBase,
      bloqueado: false,
      finishReason: finishReason ?? null,
      texto,
      verificacion,
      costoEstimado,
      citas,
      registroGeneracion,
    });
  } catch (error) {
    if (error instanceof MetaApiError && error.codigo === 'SIN_CREDITOS') {
      // Protocolo: ante 402, detenerse y reportar; nunca cambiar de proveedor.
      return res.status(402).json({
        error: 'SIN_CREDITOS',
        modo: 'en-vivo',
        texto: 'Llamada en vivo detenida: créditos de la Meta Model API agotados (402). Según el protocolo, no se sustituye el proveedor.',
      });
    }
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      return res.status(504).json({
        error: 'META_TIMEOUT',
        modo: 'en-vivo',
        mensaje: 'La Meta Model API no respondió a tiempo (20 s). Intento declarado, sin reintento automático.',
      });
    }
    return res.status(502).json({
      error: 'META_ERROR',
      modo: 'en-vivo',
      mensaje: `La llamada en vivo falló de forma declarada: ${error.message}`,
    });
  }
});
