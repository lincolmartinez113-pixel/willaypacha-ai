import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../index.js';
import { config } from '../config.js';
import {
  IMAGEN_MUESTRA_RUTA,
  PROMPT_SAM_PRUEBA,
  costoSamImagen,
  extraerTextoRespuestas,
  parsearSalidaSegmentacion,
} from '../api/sam-prueba.js';

/**
 * POST /api/sam-prueba — endpoint de prueba de la llamada en vivo a SAM 3.1.
 * La llamada real a la Meta Model API se mockea: estas pruebas nunca salen
 * a la red ni gastan créditos. Los mocks reproducen la forma documentada en
 * https://dev.meta.ai/docs/sam/reading-segmentation (no-streaming:
 * output[].content[] con output_text.text en la gramática
 * "<Nf>id<|box;...|><|mask;...|>").
 */

const fetchOriginal = globalThis.fetch;
const apiKeyOriginal = config.meta.apiKey;

afterEach(() => {
  globalThis.fetch = fetchOriginal;
  config.meta.apiKey = apiKeyOriginal;
});

// Ejemplo con la forma del documento oficial (payloads base85 acortados: el
// parser los captura íntegros sin decodificarlos).
const SALIDA_DOC =
  '<0f>0<|box;x1=353;y1=382;x2=453;y2=427;w=537;h=561|><|mask;x=0;y=0;data=46,101,~zzQ|>'
  + ',1<|box;x1=260;y1=382;x2=340;y2=427;w=537;h=561|><|mask;x=0;y=0;data=46,81,~abC|>';

const SALIDA_CONFIANZA =
  '<0f>1<|box;x1=444;y1=625;x2=679;y2=850;w=1800;h=1200;c=0.9609375|>'
  + '<|mask;x=0;y=0;c=0.9609375;data=226,236,!AAAB|>';

function mockResponses({ outputText = SALIDA_DOC, estado = 'completed', modelo = 'sam-3.1', usage = null, respuestaEstado = 200, cuerpoCrudo = null }) {
  const llamadas = [];
  globalThis.fetch = async (url, opts) => {
    llamadas.push({ url, body: JSON.parse(opts.body) });
    if (cuerpoCrudo !== null) {
      return new Response(cuerpoCrudo, { status: respuestaEstado, headers: { 'Content-Type': 'text/plain' } });
    }
    return new Response(
      JSON.stringify({
        id: 'resp_prueba',
        object: 'response',
        status: estado,
        model: modelo,
        output: [
          {
            id: 'msg_prueba', type: 'message', role: 'assistant', status: 'completed',
            content: [{ type: 'output_text', text: outputText, annotations: [] }],
          },
        ],
        usage,
      }),
      { status: respuestaEstado, headers: { 'Content-Type': 'application/json' } },
    );
  };
  return llamadas;
}

describe('POST /api/sam-prueba', () => {
  test('Sin META_API_KEY responde 503 declarado, sin geometría simulada', async () => {
    config.meta.apiKey = '';
    const r = await request(app).post('/api/sam-prueba').send({});
    assert.equal(r.status, 503);
    assert.equal(r.body.error, 'META_NO_CONFIGURADA');
    assert.equal(r.body.detecciones, undefined);
    assert.equal(r.body.salidaCruda, undefined);
    assert.match(r.body.via, /\/responses/);
  });

  test('Con clave llama a POST /responses con sam-3.1 y la muestra fijada', async () => {
    config.meta.apiKey = 'test';
    const llamadas = mockResponses({ outputText: SALIDA_DOC });

    const r = await request(app).post('/api/sam-prueba').send({});

    assert.equal(r.status, 200);
    assert.equal(llamadas.length, 1);
    assert.equal(llamadas[0].url, 'https://api.meta.ai/v1/responses');
    assert.equal(llamadas[0].body.model, 'sam-3.1');
    assert.equal(llamadas[0].body.stream, undefined);
    assert.equal(llamadas[0].body.metadata.include_confidence, 'true');
    const contenido = llamadas[0].body.input[0].content;
    assert.equal(llamadas[0].body.input[0].type, 'message');
    assert.equal(contenido[0].type, 'input_text');
    assert.equal(contenido[0].text, 'alpaca');
    assert.equal(contenido[1].type, 'input_image');
    assert.match(contenido[1].image_url, /^data:image\/jpeg;base64,/);
    assert.ok(contenido[1].image_url.length > 100000, 'la muestra real va en base64');

    assert.equal(r.body.modo, 'en-vivo');
    assert.equal(r.body.modelo, 'sam-3.1');
    assert.equal(r.body.estado, 'completed');
    assert.equal(r.body.muestra.prompt, 'alpaca');
    assert.match(r.body.muestra.archivo, /altiplano-ganado\.jpg$/);
    assert.match(r.body.muestra.sha256, /^[0-9a-f]{64}$/);
    assert.equal(r.body.totalDetecciones, 2);
    assert.deepEqual(r.body.detecciones[0].box, { x1: 353, y1: 382, x2: 453, y2: 427, w: 537, h: 561, c: null });
    assert.equal(r.body.detecciones[0].mask.h, 46);
    assert.equal(r.body.detecciones[0].mask.w, 101);
    assert.equal(r.body.detecciones[0].mask.codificacion, 'lossless');
    assert.equal(r.body.detecciones[0].mask.payload, 'zzQ');
    assert.equal(r.body.detecciones[1].id, 1);
    assert.equal(r.body.registrosNoReconocidos, 0);
    assert.equal(r.body.costo.costoEstimadoUSD, 0.0025);
    assert.equal(r.body.costo.tarifaPor1kImagenesUSD, 2.5);
    assert.equal(r.body.verificadorP6.aplica, false);
    assert.equal(r.body.salidaCruda, SALIDA_DOC);
  });

  test('Confianza y codificación one_bit se parsean por clave', async () => {
    config.meta.apiKey = 'test';
    mockResponses({ outputText: SALIDA_CONFIANZA });

    const r = await request(app).post('/api/sam-prueba').send({});

    assert.equal(r.status, 200);
    assert.equal(r.body.totalDetecciones, 1);
    assert.equal(r.body.detecciones[0].frame, 0);
    assert.equal(r.body.detecciones[0].id, 1);
    assert.equal(r.body.detecciones[0].box.c, 0.9609375);
    assert.equal(r.body.detecciones[0].mask.c, 0.9609375);
    assert.equal(r.body.detecciones[0].mask.codificacion, 'one_bit');
    assert.equal(r.body.detecciones[0].mask.payload, 'AAAB');
  });

  test('Cero coincidencias (output_text vacío) es válido, no error', async () => {
    config.meta.apiKey = 'test';
    mockResponses({ outputText: '' });

    const r = await request(app).post('/api/sam-prueba').send({});

    assert.equal(r.status, 200);
    assert.equal(r.body.totalDetecciones, 0);
    assert.deepEqual(r.body.detecciones, []);
    assert.match(r.body.notaCeroCoincidencias, /válido/);
    assert.equal(r.body.formatoNoReconocido, null);
    assert.equal(r.body.costo.costoEstimadoUSD, 0.0025);
  });

  test('Texto fuera de gramática: se declara y no se inventa geometría', async () => {
    config.meta.apiKey = 'test';
    mockResponses({ outputText: 'esto no es una caja ni una máscara' });

    const r = await request(app).post('/api/sam-prueba').send({});

    assert.equal(r.status, 200);
    assert.equal(r.body.totalDetecciones, 0);
    assert.ok(r.body.registrosNoReconocidos > 0);
    assert.match(r.body.formatoNoReconocido, /sin inventar geometría/);
    assert.equal(r.body.salidaCruda, 'esto no es una caja ni una máscara');
  });

  test('Status no completado se declara con su detalle', async () => {
    config.meta.apiKey = 'test';
    globalThis.fetch = async () => new Response(
      JSON.stringify({ id: 'resp_x', status: 'failed', model: 'sam-3.1', error: { code: 'server_error', message: 'x' } }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );

    const r = await request(app).post('/api/sam-prueba').send({});

    assert.equal(r.status, 502);
    assert.equal(r.body.error, 'SAM_NO_COMPLETADA');
    assert.equal(r.body.estado, 'failed');
    assert.equal(r.body.detecciones, undefined);
  });

  test('402 de la API: detenerse y reportar (SIN_CREDITOS)', async () => {
    config.meta.apiKey = 'test';
    globalThis.fetch = async () => new Response('pago requerido', { status: 402 });

    const r = await request(app).post('/api/sam-prueba').send({});

    assert.equal(r.status, 402);
    assert.equal(r.body.error, 'SIN_CREDITOS');
  });

  test('Error HTTP de la API se declara (META_ERROR)', async () => {
    config.meta.apiKey = 'test';
    globalThis.fetch = async () => new Response('boom', { status: 500 });

    const r = await request(app).post('/api/sam-prueba').send({});

    assert.equal(r.status, 502);
    assert.equal(r.body.error, 'META_ERROR');
    assert.match(r.body.mensaje, /500/);
  });

  test('La muestra y el prompt están fijados al proyecto', () => {
    assert.equal(PROMPT_SAM_PRUEBA, 'alpaca');
    assert.match(IMAGEN_MUESTRA_RUTA, /altiplano-ganado\.jpg$/);
  });

  test('costoSamImagen usa la tarifa oficial por imagen, no por token', () => {
    const c = costoSamImagen({ imagenes: 1 });
    assert.equal(c.costoEstimadoUSD, 0.0025);
    assert.equal(c.tarifaPor1kImagenesUSD, 2.5);
    assert.equal(c.moneda, 'USD');
    assert.equal(c.fuente, 'https://dev.meta.ai/docs/pricing-rate-limits');
  });

  test('extraerTextoRespuestas acepta output[], output_text directo y vacío', () => {
    assert.equal(
      extraerTextoRespuestas({ output: [{ content: [{ type: 'output_text', text: 'a' }, { type: 'otro', text: 'x' }] }] }),
      'a',
    );
    assert.equal(extraerTextoRespuestas({ output_text: 'b' }), 'b');
    assert.equal(extraerTextoRespuestas({ output: [] }), '');
    assert.equal(extraerTextoRespuestas(null), '');
  });

  test('parsearSalidaSegmentacion: multilínea por fotograma e ids dispersos', () => {
    const p = parsearSalidaSegmentacion(
      '<0f>0<|box;x1=1;y1=2;x2=3;y2=4;w=10;h=10|><|mask;x=0;y=0;data=2,2,~AB|>\n'
      + '<2f>2<|box;x1=5;y1=6;x2=7;y2=8;w=10;h=10|><|mask;x=0;y=0;data=2,2,~CD|>',
    );
    assert.equal(p.detecciones.length, 2);
    assert.equal(p.detecciones[0].frame, 0);
    assert.equal(p.detecciones[1].frame, 2);
    assert.equal(p.detecciones[1].id, 2);
    assert.equal(p.registrosNoReconocidos, 0);
    assert.deepEqual(parsearSalidaSegmentacion('').detecciones, []);
    assert.deepEqual(parsearSalidaSegmentacion(null).detecciones, []);
  });
});
