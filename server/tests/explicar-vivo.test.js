import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../index.js';
import { config } from '../config.js';
import { MAX_TOKENS_EXPLICAR } from '../api/explicador.js';
import { MAX_TOKENS_VIVO_PRUEBA } from '../api/vivo-prueba.js';

/**
 * POST /api/explicar en modo en-vivo (Rimay).
 * La llamada real a la Meta Model API se mockea: estas pruebas nunca salen
 * a la red ni gastan créditos.
 *
 * Regresión del 29/10/2026: con max_tokens=2000 la llamada en vivo se
 * truncaba con finish_reason=length porque el razonamiento interno del
 * modelo (~2300 tokens medidos con el contexto completo de 8 registros)
 * agotaba el presupuesto antes de producir contenido. /api/vivo-prueba no
 * trunca porque su prompt es 8 veces menor (1 registro, pregunta fijada).
 * El tope de /api/explicar es propio y mayor; vivo-prueba queda en 2000.
 */

const fetchOriginal = globalThis.fetch;
const apiKeyOriginal = config.meta.apiKey;

afterEach(() => {
  globalThis.fetch = fetchOriginal;
  config.meta.apiKey = apiKeyOriginal;
  delete process.env.META_PRECIO_POR_1K_TOKENS_USD;
});

// Oración con respaldo literal conocido (la misma que acepta P6 en
// verificador.test.js): debe pasar la verificación del endpoint.
const TEXTO_RESPALDADO =
  'Según OEFA (Evaluación ambiental de causalidad del área de influencia de la UM Nueva Acumulación Quenamari – San Rafael, 2014): «Fluoruros, sulfatos y calcio superaron los Estándares de Calidad Ambiental para Agua de 2008 (categoría 3); el estudio determina que su origen proviene directamente del efluente minero P-4».';

function mockFetch({ content, finishReason = 'stop', uso, refusal = null, status = 200 }) {
  const llamadas = [];
  globalThis.fetch = async (url, opts) => {
    llamadas.push({ url, body: JSON.parse(opts.body) });
    if (status !== 200) return new Response('sin créditos', { status });
    return new Response(
      JSON.stringify({
        choices: [{ finish_reason: finishReason, index: 0, message: { role: 'assistant', content, refusal } }],
        usage: uso,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  };
  return llamadas;
}

describe('POST /api/explicar en vivo', () => {
  test('El tope de /api/explicar es propio, mayor que el de vivo-prueba', () => {
    assert.equal(MAX_TOKENS_EXPLICAR, 6000);
    assert.ok(MAX_TOKENS_EXPLICAR > MAX_TOKENS_VIVO_PRUEBA, 'solo /api/explicar sube; vivo-prueba queda en 2000');
    assert.equal(MAX_TOKENS_VIVO_PRUEBA, 2000);
  });

  test('En vivo usa muse-spark-1.3 con el tope propio y reporta costo', async () => {
    config.meta.apiKey = 'test';
    process.env.META_PRECIO_POR_1K_TOKENS_USD = '2';
    const llamadas = mockFetch({
      content: TEXTO_RESPALDADO,
      uso: { prompt_tokens: 1633, completion_tokens: 2432, total_tokens: 4065, completion_tokens_details: { reasoning_tokens: 2304 } },
    });

    const r = await request(app).post('/api/explicar').send({ consulta: '¿Qué dice el informe sobre Chogñacota?', registroId: 'SR-001-chognacota-agua' });

    assert.equal(r.status, 200);
    assert.equal(llamadas.length, 1);
    assert.equal(llamadas[0].url, 'https://api.meta.ai/v1/chat/completions');
    assert.equal(llamadas[0].body.model, 'muse-spark-1.3');
    assert.equal(llamadas[0].body.max_tokens, 6000);
    assert.equal(r.body.modo, 'en-vivo');
    assert.equal(r.body.bloqueado, false);
    assert.match(r.body.texto, /Fluoruros, sulfatos y calcio/);
    assert.equal(r.body.finishReason, 'stop');
    assert.equal(r.body.costoEstimado.tokensRazonamiento, 2304);
    assert.equal(r.body.verificacion.aprobado, true);
  });

  test('Truncado (length): fallback declarado a demo, nada parcial mostrado', async () => {
    config.meta.apiKey = 'test';
    mockFetch({
      content: null,
      finishReason: 'length',
      uso: { prompt_tokens: 1633, completion_tokens: 6000, total_tokens: 7633, completion_tokens_details: { reasoning_tokens: 5980 } },
    });

    const r = await request(app).post('/api/explicar').send({ consulta: 'hola', registroId: 'SR-001-chognacota-agua' });

    assert.equal(r.status, 200);
    assert.equal(r.body.modo, 'demo');
    assert.equal(r.body.finishReason, 'length');
    assert.match(r.body.motivoCaida, /no mostrable/);
    assert.match(r.body.registroGeneracion.nota, /Fallback declarado/);
    assert.equal(r.body.costoEstimado.tokensRazonamiento, 5980);
  });

  test('Si P6 bloquea el texto en vivo: demo declarada, texto no mostrado', async () => {
    config.meta.apiKey = 'test';
    mockFetch({
      content: 'Minsur contaminó la quebrada Chogñacota con fluoruros.',
      uso: { prompt_tokens: 1633, completion_tokens: 60, total_tokens: 1693 },
    });

    const r = await request(app).post('/api/explicar').send({ consulta: 'cuéntame', registroId: 'SR-001-chognacota-agua' });

    assert.equal(r.status, 200);
    assert.equal(r.body.modo, 'demo');
    assert.doesNotMatch(r.body.texto, /contaminó/);
    assert.match(r.body.motivoCaida, /bloqueado por P6/);
    assert.match(r.body.registroGeneracion.nota, /Fallback declarado/);
  });

  test('Ante 402: demo declarada con error SIN_CREDITOS', async () => {
    config.meta.apiKey = 'test';
    mockFetch({ content: 'x', status: 402 });

    const r = await request(app).post('/api/explicar').send({ consulta: 'hola', registroId: 'SR-001-chognacota-agua' });

    assert.equal(r.status, 200);
    assert.equal(r.body.modo, 'demo');
    assert.equal(r.body.error, 'SIN_CREDITOS');
    assert.match(r.body.motivoCaida, /402/);
    assert.match(r.body.registroGeneracion.nota, /Fallback declarado/);
  });
});
