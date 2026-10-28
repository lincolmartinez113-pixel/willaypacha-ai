import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { randomBytes } from 'node:crypto';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { app } from '../index.js';
import { auth, limpiarTodo, db } from './ayudantes.js';
import { config } from '../config.js';

describe('Módulo E — Casos de la comunidad', () => {
  before(() => limpiarTodo());
  after(() => limpiarTodo());

  const foto = randomBytes(2048);
  let casoId;
  let codigo;

  test('Sin consentimiento informado no se registra nada', async () => {
    const r = await request(app)
      .post('/api/casos')
      .field('relato', 'Vi una coloración extraña en la quebrada junto a mi comunidad.')
      .field('consentimiento', 'false');
    assert.equal(r.status, 400);
    assert.match(r.body.error, /consentimiento/i);
  });

  test('Registro con consentimiento, evidencia con hash y código de retiro', async () => {
    const r = await request(app)
      .post('/api/casos')
      .field('relato', 'Vi una coloración amarillenta en la quebrada Chogñacota, cerca de la comunidad, el 12 de octubre al mediodía.')
      .field('consentimiento', 'true')
      .field('identidadReservada', 'true')
      .field('contacto', 'comunera@example.org')
      .attach('evidencias', foto, { filename: 'foto-quebrada.jpg', contentType: 'image/jpeg' });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    assert.equal(r.body.estado, 'recibido');
    assert.match(r.body.codigoRetiro, /^[a-f0-9]{12}$/);
    casoId = r.body.id;
    codigo = r.body.codigoRetiro;

    const caso = db.estado.casos.find((c) => c.id === casoId);
    assert.equal(caso.evidencias.length, 1);
    assert.match(caso.evidencias[0].hash, /^[a-f0-9]{64}$/);
    assert.equal(caso.consistencia.paso, 'consistencia-automatica');
    assert.match(caso.consistencia.resultado, /contraste oficial/);
  });

  test('Una misma evidencia no crea un segundo caso (duplicado)', async () => {
    const r = await request(app)
      .post('/api/casos')
      .field('relato', 'El mismo archivo subido otra vez, para probar el control de duplicados del sistema.')
      .field('consentimiento', 'true')
      .field('contacto', 'otra@example.org')
      .attach('evidencias', foto, { filename: 'copia.jpg', contentType: 'image/jpeg' });
    assert.equal(r.status, 409);
    assert.equal(r.body.error, 'evidencia duplicada');
    assert.equal(db.estado.casos.length, 1);
  });

  test('Un caso no verificado no es visible públicamente', async () => {
    const publico = await request(app).get('/api/casos');
    assert.equal(publico.status, 200);
    assert.equal(publico.body.publicados.length, 0);
    const directo = await request(app).get(`/api/casos/${casoId}`);
    assert.equal(directo.status, 403);
  });

  test('Verificar exige dos revisores y uno con perfil ambiental o legal', async () => {
    await request(app).post(`/api/casos/${casoId}/revision`).set(auth()).send({ accion: 'en-verificacion' });

    const unRevisor = await request(app)
      .post(`/api/casos/${casoId}/revision`)
      .set(auth())
      .send({ accion: 'verificar' });
    assert.equal(unRevisor.status, 400);

    await request(app)
      .post(`/api/casos/${casoId}/revision`)
      .set(auth())
      .send({ accion: 'revisar', revisor: { nombre: 'Rosa Huamán', perfil: 'comunitario' }, dictamen: 'favorable' });

    const sinPerfil = await request(app).post(`/api/casos/${casoId}/revision`).set(auth()).send({ accion: 'verificar' });
    assert.equal(sinPerfil.status, 400);
    assert.match(sinPerfil.body.motivo, /perfil ambiental o legal/);

    await request(app)
      .post(`/api/casos/${casoId}/revision`)
      .set(auth())
      .send({ accion: 'revisar', revisor: { nombre: 'Luis Paredes', perfil: 'ambiental' }, dictamen: 'favorable' });

    const verificado = await request(app).post(`/api/casos/${casoId}/revision`).set(auth()).send({ accion: 'verificar' });
    assert.equal(verificado.status, 200);
    assert.equal(verificado.body.estado, 'verificado');
    assert.match(verificado.body.leyenda, /Esto no afirma que hubo contaminación/);
  });

  test('La publicación lleva la leyenda de alcance y no expone el contacto', async () => {
    const r = await request(app).get('/api/casos');
    assert.equal(r.body.publicados.length, 1);
    const c = r.body.publicados[0];
    assert.match(c.leyenda, /no afirma que hubo contaminación/);
    assert.equal(c.contacto, undefined);
    assert.ok(c.identidadReservada);
  });

  test('Regla dura: un caso con menores identificables no se publica', async () => {
    const otro = await request(app)
      .post('/api/casos')
      .field('relato', 'Fotografía donde aparecen niños de la comunidad junto a la quebrada, tomada esta semana.')
      .field('consentimiento', 'true')
      .field('contacto', 'madre@example.org')
      .attach('evidencias', randomBytes(1024), { filename: 'ninos.jpg', contentType: 'image/jpeg' });
    assert.equal(otro.status, 201);

    await request(app).post(`/api/casos/${otro.body.id}/revision`).set(auth()).send({ accion: 'en-verificacion' });
    await request(app)
      .post(`/api/casos/${otro.body.id}/revision`)
      .set(auth())
      .send({ accion: 'revisar', revisor: { nombre: 'Rosa Huamán', perfil: 'legal' }, dictamen: 'favorable', contieneMenores: true });
    await request(app)
      .post(`/api/casos/${otro.body.id}/revision`)
      .set(auth())
      .send({ accion: 'revisar', revisor: { nombre: 'Luis Paredes', perfil: 'ambiental' }, dictamen: 'favorable' });

    const bloqueado = await request(app).post(`/api/casos/${otro.body.id}/revision`).set(auth()).send({ accion: 'verificar' });
    assert.equal(bloqueado.status, 400);
    assert.match(bloqueado.body.motivo, /menores identificables/i);
  });

  test('El retiro borra ficha, evidencia y transcripciones del sistema', async () => {
    const caso = db.estado.casos.find((c) => c.id === casoId);
    const archivo = path.join(config.rutaDatos, 'evidencias', caso.evidencias[0].archivo);
    assert.ok(existsSync(archivo), 'la evidencia existe antes del retiro');

    const r = await request(app).post(`/api/casos/${casoId}/retirar`).send({ contacto: 'comunera@example.org', codigoRetiro: codigo });
    assert.equal(r.status, 200);
    assert.equal(r.body.borradoEfectivo, true);

    assert.equal(db.estado.casos.find((c) => c.id === casoId), undefined);
    assert.equal(existsSync(archivo), false, 'el archivo de evidencia fue eliminado');
    const restantes = readdirSync(path.join(config.rutaDatos, 'evidencias')).filter((f) => f.startsWith(caso.evidencias[0].hash));
    assert.equal(restantes.length, 0);
  });

  test('El retiro exige contacto y código correctos', async () => {
    const nuevo = await request(app)
      .post('/api/casos')
      .field('relato', 'Otro reporte de prueba para verificar el control de titularidad del retiro.')
      .field('consentimiento', 'true')
      .field('contacto', 'titular@example.org')
      .attach('evidencias', randomBytes(512), { filename: 'x.png', contentType: 'image/png' });
    const r = await request(app)
      .post(`/api/casos/${nuevo.body.id}/retirar`)
      .send({ contacto: 'intruso@example.org', codigoRetiro: '000000000000' });
    assert.equal(r.status, 403);
  });
});
