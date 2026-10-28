import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../index.js';

describe('Explicador (P2/P3 → P6)', () => {
  test('Explica el resultado SIN hallazgo de Larancota con el mismo cuidado que el hallazgo', async () => {
    const r = await request(app)
      .post('/api/explicar')
      .send({ registroId: 'SR-002-larancota-agua' });
    assert.equal(r.status, 200);
    assert.equal(r.body.bloqueado, false);
    assert.match(r.body.texto, /No se registró influencia negativa/);
    assert.equal(r.body.citas[0].semaforo, 'verde');
    assert.equal(r.body.registroGeneracion.verificacion.aprobado, true);
  });

  test('La explicación en quechua marca estado borrador y usa el glosario', async () => {
    const r = await request(app)
      .post('/api/explicar')
      .send({ registroId: 'SR-001-chognacota-agua', lengua: 'qu' });
    assert.equal(r.status, 200);
    assert.equal(r.body.bloqueado, false);
    assert.ok(r.body.textoLengua, 'debe existir texto en la lengua');
    assert.match(r.body.estadoTraduccion, /borrador — pendiente de validación/);
    assert.ok(r.body.terminosGlosario.length >= 1, 'debe registrar los términos del glosario usados');
    for (const t of r.body.terminosGlosario) assert.equal(t.estado, 'borrador');
  });

  test('El asháninka no traduce «río» porque el glosario no tiene valor validado', async () => {
    const r = await request(app)
      .post('/api/explicar')
      .send({ registroId: 'SR-001-chognacota-agua', lengua: 'ash' });
    assert.equal(r.status, 200);
    // El término río/ash está declarado sin valor: no se inventa equivalencia.
    const terminosRio = r.body.terminosGlosario.filter((t) => t.es === 'río');
    assert.equal(terminosRio.length, 0);
  });

  test('Registro de Generación incluye modelo, prompt y fuentes', async () => {
    const r = await request(app).post('/api/explicar').send({ registroId: 'SR-003-sedimentos' });
    assert.equal(r.status, 200);
    const rg = r.body.registroGeneracion;
    assert.ok(rg.modelo);
    assert.match(rg.prompt, /P2/);
    assert.match(rg.prompt, /P6/);
    assert.ok(Array.isArray(rg.fuentes));
    assert.equal(rg.fuentes[0].id, 'SR-003-sedimentos');
    assert.equal(rg.fuentes[0].hash, null, 'el hash se declara pendiente, no se fabrica');
  });

  test('Sin registro ni consulta responde 400', async () => {
    const r = await request(app).post('/api/explicar').send({});
    assert.equal(r.status, 400);
  });
});
