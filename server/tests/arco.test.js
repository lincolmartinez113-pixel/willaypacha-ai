import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { randomBytes } from 'node:crypto';
import { app } from '../index.js';
import { auth, limpiarTodo, db } from './ayudantes.js';

describe('Derechos ARCO (Ley N.° 29733)', () => {
  before(() => limpiarTodo());
  after(() => limpiarTodo());

  let casoId;
  let solicitudId;

  test('Un usuario de prueba registra un caso', async () => {
    const r = await request(app)
      .post('/api/casos')
      .field('relato', 'Caso de prueba para el ejercicio de derechos ARCO sobre datos personales.')
      .field('consentimiento', 'true')
      .field('contacto', 'arco@example.org')
      .attach('evidencias', randomBytes(256), { filename: 'evidencia.png', contentType: 'image/png' });
    assert.equal(r.status, 201);
    casoId = r.body.id;
  });

  test('Acceso: el titular obtiene todos sus datos', async () => {
    const crear = await request(app).post('/api/arco/solicitud').send({ tipo: 'acceso', identificador: 'arco@example.org' });
    assert.equal(crear.status, 201);
    solicitudId = crear.body.id;

    const r = await request(app).post(`/api/arco/${solicitudId}/ejecutar`).set(auth('admin')).send({});
    assert.equal(r.status, 200);
    assert.equal(r.body.respuesta.casos.length, 1);
    assert.equal(r.body.respuesta.casos[0].id, casoId);
  });

  test('Rectificación: se corrige el dato de contacto', async () => {
    const crear = await request(app).post('/api/arco/solicitud').send({ tipo: 'rectificacion', identificador: 'arco@example.org' });
    const r = await request(app)
      .post(`/api/arco/${crear.body.id}/ejecutar`)
      .set(auth('admin'))
      .send({ campo: 'contacto', valor: 'arco-nuevo@example.org' });
    assert.equal(r.status, 200);
    assert.equal(db.estado.casos.find((c) => c.id === casoId).contacto, 'arco-nuevo@example.org');
  });

  test('Cancelación: borrado completo y verificable', async () => {
    const crear = await request(app).post('/api/arco/solicitud').send({ tipo: 'cancelacion', identificador: 'arco-nuevo@example.org' });
    const r = await request(app).post(`/api/arco/${crear.body.id}/ejecutar`).set(auth('admin')).send({});
    assert.equal(r.status, 200);
    assert.deepEqual(r.body.respuesta.eliminados, [casoId]);
    assert.equal(db.estado.casos.length, 0, 'no queda ningún caso vinculado al identificador');
    assert.equal(
      db.estado.solicitudesArco.filter((s) => s.identificador === 'arco-nuevo@example.org').length,
      0,
      'las solicitudes del titular también se eliminan',
    );
  });

  test('Las solicitudes ARCO se atienden solo con rol administrativo', async () => {
    const crear = await request(app).post('/api/arco/solicitud').send({ tipo: 'acceso', identificador: 'x@example.org' });
    const r = await request(app).post(`/api/arco/${crear.body.id}/ejecutar`).send({});
    assert.equal(r.status, 403);
  });
});
