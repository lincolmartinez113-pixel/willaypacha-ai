import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../index.js';
import { auth, limpiarTodo } from './ayudantes.js';

describe('Módulo D — Documentos y bandeja de expertos', () => {
  before(() => limpiarTodo());
  after(() => limpiarTodo());

  let docId;

  test('Genera un borrador con estado borrador-ia', async () => {
    const r = await request(app)
      .post('/api/documentos')
      .send({ tipo: 'informe', unidadId: 'san-rafael', datos: { solicitante: 'Comunidad de prueba' } });
    assert.equal(r.status, 201);
    assert.equal(r.body.estado, 'borrador-ia');
    assert.match(r.body.aviso, /Borrador/);
    docId = r.body.id;
  });

  test('El PDF del borrador existe y es un PDF', async () => {
    const r = await request(app).get(`/api/documentos/${docId}/pdf`);
    assert.equal(r.status, 200);
    assert.match(r.headers['content-type'], /application\/pdf/);
    assert.equal(r.body.subarray(0, 4).toString(), '%PDF');
    assert.ok(r.body.length > 5000);
  });

  test('El PDF final está bloqueado antes de la aprobación experta', async () => {
    const r = await request(app).get(`/api/documentos/${docId}/pdf?version=final`);
    assert.equal(r.status, 403);
    assert.match(r.body.error, /bloqueado/);
  });

  test('No se puede aprobar sin pasar por revisión', async () => {
    const r = await request(app)
      .post(`/api/documentos/${docId}/revision`)
      .set(auth('verificador'))
      .send({ accion: 'aprobar', experto: { nombre: 'Ing. Prueba', colegiatura: '123456', tipo: 'CIP' } });
    assert.equal(r.status, 409);
  });

  test('Aprobar exige nombre y colegiatura CIP/CAL', async () => {
    await request(app).post(`/api/documentos/${docId}/revision`).set(auth('verificador')).send({ accion: 'revisar' });
    const sinColegiatura = await request(app)
      .post(`/api/documentos/${docId}/revision`)
      .set(auth('verificador'))
      .send({ accion: 'aprobar', experto: { nombre: 'Ing. Prueba', colegiatura: '', tipo: 'CIP' } });
    assert.equal(sinColegiatura.status, 400);
    assert.match(sinColegiatura.body.error, /colegiatura/i);
  });

  test('Observar devuelve el documento a borrador con las observaciones', async () => {
    const r = await request(app)
      .post(`/api/documentos/${docId}/revision`)
      .set(auth('verificador'))
      .send({ accion: 'observar', observaciones: 'Falta precisar la página de la cita del sedimentograma.' });
    assert.equal(r.status, 200);
    assert.equal(r.body.estado, 'borrador-ia');
  });

  test('Aprobación completa: estado aprobado y PDF final habilitado con hash', async () => {
    await request(app).post(`/api/documentos/${docId}/revision`).set(auth('verificador')).send({ accion: 'revisar' });
    const aprobado = await request(app)
      .post(`/api/documentos/${docId}/revision`)
      .set(auth('verificador'))
      .send({ accion: 'aprobar', experto: { nombre: 'Ing. Ana Quispe', colegiatura: '98765', tipo: 'CIP' } });
    assert.equal(aprobado.status, 200);
    assert.equal(aprobado.body.estado, 'aprobado');
    assert.match(aprobado.body.pdfFinalUrl, /version=final/);
    assert.match(aprobado.body.hash, /^[a-f0-9]{64}$/);

    const final = await request(app).get(`/api/documentos/${docId}/pdf?version=final`);
    assert.equal(final.status, 200);
    assert.equal(final.body.subarray(0, 4).toString(), '%PDF');
  });

  test('La bitácora registra todos los estados y el experto', async () => {
    const r = await request(app).get(`/api/documentos/${docId}`);
    assert.equal(r.status, 200);
    const eventos = r.body.bitacora.map((b) => b.evento);
    assert.ok(eventos.includes('borrador-ia'));
    assert.ok(eventos.includes('en-revision'));
    assert.ok(eventos.includes('observado'));
    assert.ok(eventos.includes('aprobado'));
    assert.equal(r.body.experto.nombre, 'Ing. Ana Quispe');
    assert.equal(r.body.experto.tipo, 'CIP');
  });

  test('La revisión exige rol: sin clave no hay acceso', async () => {
    const r = await request(app).post(`/api/documentos/${docId}/revision`).send({ accion: 'revisar' });
    assert.equal(r.status, 403);
  });

  test('Los tres tipos de documento se generan', async () => {
    for (const tipo of ['acta', 'denuncia']) {
      const r = await request(app).post('/api/documentos').send({ tipo, unidadId: 'san-vicente' });
      assert.equal(r.status, 201, JSON.stringify(r.body));
    }
  });
});
