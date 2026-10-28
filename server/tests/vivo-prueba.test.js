import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../index.js';
import { config } from '../config.js';
import { PREGUNTA_VIVO_PRUEBA, estimarCosto } from '../api/vivo-prueba.js';
import { extraerTextoContenido } from '../api/meta-client.js';

/**
 * POST /api/vivo-prueba — endpoint de prueba de la llamada en vivo.
 * La llamada real a la Meta Model API se mockea: estas pruebas nunca salen
 * a la red ni gastan créditos. Los mocks reproducen la forma observada en
 * vivo (finish_reason, content cadena/bloques/null, usage con detalles).
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

function mockFetch({ content, finishReason = 'stop', uso, refusal = null }) {
  const llamadas = [];
  globalThis.fetch = async (url, opts) => {
    llamadas.push({ url, body: JSON.parse(opts.body) });
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

describe('POST /api/vivo-prueba', () => {
  test('Sin META_API_KEY responde 503 declarado, sin texto simulado', async () => {
    config.meta.apiKey = '';
    const r = await request(app).post('/api/vivo-prueba').send({});
    assert.equal(r.status, 503);
    assert.equal(r.body.error, 'META_NO_CONFIGURADA');
    assert.equal(r.body.texto, undefined);
  });

  test('Con clave llama a la Meta Model API y devuelve texto P6 + costo', async () => {
    config.meta.apiKey = 'test';
    process.env.META_PRECIO_POR_1K_TOKENS_USD = '2';
    const llamadas = mockFetch({
      content: TEXTO_RESPALDADO,
      uso: { prompt_tokens: 120, completion_tokens: 60, total_tokens: 180 },
    });

    const r = await request(app).post('/api/vivo-prueba').send({});

    assert.equal(r.status, 200);
    assert.equal(llamadas.length, 1);
    assert.equal(llamadas[0].url, 'https://api.meta.ai/v1/chat/completions');
    assert.equal(llamadas[0].body.model, 'muse-spark');
    assert.equal(llamadas[0].body.max_tokens, 2000);
    assert.ok(llamadas[0].body.messages[1].content.includes('Chogñacota'), 'la pregunta va anclada al registro semilla');

    assert.equal(r.body.bloqueado, false);
    assert.equal(r.body.finishReason, 'stop');
    assert.match(r.body.texto, /Fluoruros, sulfatos y calcio/);
    assert.equal(r.body.verificacion.aprobado, true);
    assert.equal(r.body.citas[0].registroId, 'SR-001-chognacota-agua');
    assert.equal(r.body.costoEstimado.tokensTotal, 180);
    assert.equal(r.body.costoEstimado.tokensEstimados, false);
    assert.equal(r.body.costoEstimado.tokensRazonamiento, null);
    assert.equal(r.body.costoEstimado.costoEstimadoUSD, 0.36);
  });

  test('Si P6 bloquea el texto en vivo, el texto no se muestra y el motivo es real', async () => {
    config.meta.apiKey = 'test';
    mockFetch({
      content: 'Minsur contaminó la quebrada Chogñacota con fluoruros.',
      uso: { prompt_tokens: 100, completion_tokens: 20, total_tokens: 120 },
    });

    const r = await request(app).post('/api/vivo-prueba').send({});

    assert.equal(r.status, 200);
    assert.equal(r.body.bloqueado, true);
    assert.match(r.body.texto, /No consta/);
    assert.doesNotMatch(r.body.texto, /contaminó/);
    assert.match(r.body.motivoBloqueo, /vocabulario de acusación/);
    assert.equal(r.body.verificacion.aprobado, false);
    assert.equal(r.body.costoEstimado.tokensTotal, 120);
  });

  test('Content en bloques se extrae y verifica igual que una cadena', async () => {
    config.meta.apiKey = 'test';
    mockFetch({
      content: [{ type: 'text', text: TEXTO_RESPALDADO }],
      uso: { prompt_tokens: 120, completion_tokens: 60, total_tokens: 180 },
    });

    const r = await request(app).post('/api/vivo-prueba').send({});

    assert.equal(r.status, 200);
    assert.equal(r.body.bloqueado, false);
    assert.match(r.body.texto, /Fluoruros, sulfatos y calcio/);
    assert.equal(r.body.verificacion.aprobado, true);
  });

  test('Content nulo con tope agotado en razonamiento: motivo real, nada mostrado', async () => {
    config.meta.apiKey = 'test';
    mockFetch({
      content: null,
      finishReason: 'length',
      uso: {
        prompt_tokens: 288,
        completion_tokens: 200,
        total_tokens: 488,
        completion_tokens_details: { reasoning_tokens: 198 },
        prompt_tokens_details: { cached_tokens: 0 },
      },
    });

    const r = await request(app).post('/api/vivo-prueba').send({});

    assert.equal(r.status, 200);
    assert.equal(r.body.bloqueado, true);
    assert.equal(r.body.finishReason, 'length');
    assert.match(r.body.motivoBloqueo, /no devolvió texto mostrable/);
    assert.match(r.body.motivoBloqueo, /finish_reason: length/);
    assert.match(r.body.motivoBloqueo, /198 de 200 tokens de salida fueron razonamiento interno/);
    assert.match(r.body.texto, /No consta/);
    assert.equal(r.body.costoEstimado.tokensTotal, 488);
    assert.equal(r.body.costoEstimado.tokensRazonamiento, 198);
  });

  test('Respuesta truncada con texto parcial: no se muestra parcial', async () => {
    config.meta.apiKey = 'test';
    mockFetch({
      content: TEXTO_RESPALDADO.slice(0, 120),
      finishReason: 'length',
      uso: { prompt_tokens: 288, completion_tokens: 200, total_tokens: 488 },
    });

    const r = await request(app).post('/api/vivo-prueba').send({});

    assert.equal(r.status, 200);
    assert.equal(r.body.bloqueado, true);
    assert.match(r.body.motivoBloqueo, /truncada por el tope de tokens/);
    assert.match(r.body.texto, /No consta/);
    assert.doesNotMatch(r.body.texto, /Fluoruros/);
  });

  test('Content vacío con finish stop: motivo real de respuesta vacía', async () => {
    config.meta.apiKey = 'test';
    mockFetch({ content: '', uso: { prompt_tokens: 288, completion_tokens: 0, total_tokens: 288 } });

    const r = await request(app).post('/api/vivo-prueba').send({});

    assert.equal(r.status, 200);
    assert.equal(r.body.bloqueado, true);
    assert.match(r.body.motivoBloqueo, /no devolvió texto mostrable/);
    assert.match(r.body.motivoBloqueo, /finish_reason: stop/);
    assert.match(r.body.texto, /No consta/);
  });

  test('Negativa del modelo: el motivo la cita', async () => {
    config.meta.apiKey = 'test';
    mockFetch({
      content: null,
      uso: { prompt_tokens: 288, completion_tokens: 5, total_tokens: 293 },
      refusal: 'No puedo responder a eso.',
    });

    const r = await request(app).post('/api/vivo-prueba').send({});

    assert.equal(r.status, 200);
    assert.equal(r.body.bloqueado, true);
    assert.match(r.body.motivoBloqueo, /negativa/);
    assert.match(r.body.texto, /No consta/);
  });

  test('La pregunta está anclada a los datos semilla (SR-001, Chogñacota)', () => {
    assert.match(PREGUNTA_VIVO_PRUEBA, /Chogñacota/);
    assert.match(PREGUNTA_VIVO_PRUEBA, /ECA/);
  });

  test('extraerTextoContenido acepta cadena, bloques y nulo', () => {
    assert.equal(extraerTextoContenido({ content: 'hola' }), 'hola');
    assert.equal(
      extraerTextoContenido({ content: [{ type: 'text', text: 'ho' }, { type: 'text', text: 'la' }] }),
      'hola',
    );
    assert.equal(extraerTextoContenido({ content: null }), '');
    assert.equal(extraerTextoContenido(undefined), '');
  });

  test('Sin usage de la API, los tokens se estiman de forma declarada', () => {
    const c = estimarCosto({ uso: null, textoEntrada: 'x'.repeat(400), textoSalida: 'y'.repeat(200) });
    assert.equal(c.tokensEstimados, true);
    assert.equal(c.tokensEntrada, 100);
    assert.equal(c.tokensSalida, 50);
    assert.equal(c.tokensRazonamiento, null);
    assert.match(c.nota, /Tarifa oficial no publicada/);
  });

  test('Con usage con detalles, se reportan los tokens de razonamiento', () => {
    const c = estimarCosto({
      uso: { prompt_tokens: 288, completion_tokens: 200, completion_tokens_details: { reasoning_tokens: 198 } },
    });
    assert.equal(c.tokensRazonamiento, 198);
    assert.equal(c.tokensTotal, 488);
  });
});
