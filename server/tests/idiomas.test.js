import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../index.js';

describe('Capa de idiomas (models abiertos de Meta, límites declarados)', () => {
  test('Los checkpoints MMS son exactamente los de la skill del proyecto', async () => {
    const r = await request(app).get('/api/idiomas/disponibilidad');
    assert.equal(r.status, 200);
    assert.equal(r.body.tts.qu.checkpoint, 'facebook/mms-tts-quz');
    assert.equal(r.body.tts.ay.checkpoint, 'facebook/mms-tts-ayr');
    assert.equal(r.body.tts.ash.checkpoint, 'facebook/mms-tts-cni');
    for (const lengua of ['qu', 'ay', 'ash']) {
      assert.equal(r.body.tts[lengua].licencia, 'CC-BY-NC 4.0');
    }
  });

  test('SeamlessM4T queda declarado como descartado y por qué', async () => {
    const r = await request(app).get('/api/idiomas/disponibilidad');
    const seamless = r.body.descartados.find((d) => /SeamlessM4T/.test(d.motor));
    assert.ok(seamless);
    assert.match(seamless.motivo, /no incluye quechua, aimara ni asháninka/);
  });

  test('NLLB-200 no cubre asháninka: la ruta declarada es Muse Spark + glosario', async () => {
    const r = await request(app).get('/api/idiomas/disponibilidad');
    assert.match(r.body.traduccion.ash.ruta, /NLLB-200 NO cubre/);
    assert.match(r.body.traduccion.ash.ruta, /glosario/);
  });

  test('TTS no disponible se DECLARA, nunca se simula', async () => {
    const r = await request(app).post('/api/voz/tts').send({ texto: 'yaku allinmi', lengua: 'qu' });
    assert.equal(r.status, 503);
    assert.equal(r.body.disponible, false);
    assert.match(r.body.motivo, /no está habilitada en esta instancia|no descargado/);
  });

  test('Transcripción en vivo no disponible se declara con su motivo', async () => {
    const r = await request(app).post('/api/voz/transcribir');
    assert.equal(r.status, 503);
    assert.equal(r.body.disponible, false);
    assert.match(r.body.motivo, /sin META_API_KEY|Web Speech API/);
  });

  test('Variedades declaradas, no escondidas', async () => {
    const r = await request(app).get('/api/idiomas/disponibilidad');
    assert.match(r.body.tts.qu.notaVariedad, /Cusco/);
    assert.match(r.body.tts.qu.notaVariedad, /no idéntico/);
    assert.match(r.body.tts.ash.notaVariedad, /Perené/);
  });

  test('Salud declara el modo y el motor de segmentación activo', async () => {
    const r = await request(app).get('/api/salud');
    assert.equal(r.status, 200);
    assert.equal(r.body.modo, 'demo');
    assert.equal(r.body.segmentacion.motorActivo, 'local-heuristica-cliente');
    assert.match(r.body.segmentacion.declaracion, /NO es SAM 3.1/);
  });

  test('Segmentación: la etiqueta de límites es obligatoria en la respuesta', async () => {
    const r = await request(app).post('/api/segment');
    assert.equal(r.status, 200);
    assert.match(r.body.etiquetaObligatoria, /una fotografía no mide química/);
    assert.doesNotMatch(JSON.stringify(r.body), /contaminación detectada/i);
  });
});
