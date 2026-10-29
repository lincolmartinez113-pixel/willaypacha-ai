import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../index.js';
import { leerSeed } from '../config.js';
import { construirFicha, generarPdfFicha, prepararFicha } from '../pdf/ficha-registro.js';

/**
 * Ficha de registro verificado: UN solo PDF descargable por registro.
 * Resumen solo con texto aprobado por P6; citas completas; pendientes
 * declarados; bloque de revisión experta vacío; Registro de Generación
 * impreso. Sin datos o con P6 bloqueado, no hay PDF inventado.
 */

/**
 * pdfkit escribe el texto como fragmentos hexadecimales (TJ con kerning),
 * incluso sin compresión. Para afirmar el contenido se decodifican y unen
 * los fragmentos en orden; los números intermedios son interletrado.
 */
function textoPdf(buffer) {
  const crudo = buffer.toString('latin1');
  return [...crudo.matchAll(/<([0-9A-Fa-f]+)>/g)]
    .map((m) => Buffer.from(m[1], 'hex').toString('latin1'))
    .join('');
}

describe('Ficha de registro verificado (PDF)', () => {
  test('SR-001: resumen aprobado, pendientes declarados, registro completo', () => {
    const ficha = construirFicha('SR-001-chognacota-agua');
    assert.equal(ficha.bloqueado, false);
    assert.match(ficha.resumen, /Según OEFA/);
    assert.match(ficha.resumen, /efluente minero P-4/);
    assert.equal(ficha.verificacion.aprobado, true);
    assert.ok(ficha.pendientes.some((p) => /Hash SHA-256.*pendiente/i.test(p)), 'hash pendiente declarado');
    assert.ok(ficha.pendientes.some((p) => /gina exacta.*confirmar/i.test(p)), 'página exacta por confirmar');
    assert.ok(ficha.pendientes.some((p) => /Fecha exacta.*confirmar/i.test(p)), 'fecha exacta por confirmar');
    assert.equal(ficha.registroGeneracion.modo, 'demo');
    assert.ok(ficha.registroGeneracion.modelo);
    assert.match(ficha.registroGeneracion.modelo, /explicador-demo/);
    assert.match(ficha.registroGeneracion.origen, /explicador-demo/);
    assert.match(ficha.registroGeneracion.origen, /verificado por P6/);
    assert.match(ficha.registroGeneracion.origen, /no se generó en vivo en esta ficha/);
    assert.ok(ficha.registroGeneracion.fecha);
    assert.match(ficha.registroGeneracion.versionP6, /^v1-[0-9a-f]{8}$/);
    assert.equal(ficha.registroGeneracion.fuentes[0].id, 'SR-001-chognacota-agua');
    assert.ok(!('experto' in ficha) && !('firma' in ficha), 'sin rastro de firma o experto inventado');
  });

  test('Con texto fabricado P6 bloquea y generarPdfFicha se niega', () => {
    const seed = leerSeed();
    const registro = seed.registros.find((r) => r.id === 'SR-001-chognacota-agua');
    const ficha = prepararFicha(registro, [{ texto: 'Minsur contaminó la quebrada Chogñacota con fluoruros.', meta: false }]);
    assert.equal(ficha.bloqueado, true);
    assert.match(ficha.motivoBloqueo, /acusación/);
    assert.throws(() => generarPdfFicha(ficha), /sin resumen aprobado/);
  });

  test('Registro inexistente: sin datos, nada inventado', () => {
    const ficha = construirFicha('XX-000-no-existe');
    assert.equal(ficha.noEncontrado, true);
  });

  test('GET ficha SR-001: PDF descargable con título, cita, semáforo y revisión pendiente', async () => {
    const r = await request(app).get('/api/documentos/registro/SR-001-chognacota-agua/pdf');
    assert.equal(r.status, 200);
    assert.match(r.headers['content-type'], /application\/pdf/);
    assert.match(r.headers['content-disposition'], /attachment; filename="ficha-SR-001-chognacota-agua\.pdf"/);
    assert.equal(r.body.subarray(0, 4).toString(), '%PDF');
    assert.ok(r.body.length > 5000);
    // El justificado une algunas palabras (el espacio es interletrado, no
    // byte 0x20): por eso los espacios son opcionales en las aserciones.
    const texto = textoPdf(r.body);
    assert.match(texto, /Ficha\s*de\s*registro\s*verificado/);
    assert.match(texto, /Fluoruros,?\s*sulfatos\s*y\s*calcio/);
    assert.match(texto, /OEFA/);
    assert.match(texto, /2014/);
    assert.match(texto, /ROJO/);
    assert.match(texto, /Hash\s*SHA-256[\s\S]*pendiente/);
    assert.match(texto, /REVISIÓN\s*EXPERTA\s*PENDIENTE/);
    assert.match(texto, /Colegiatura \(CIP\/CAL/);
    assert.match(texto, /sin firma/);
    assert.match(texto, /Registro\s*de\s*Generación\s*IA/);
    assert.match(texto, /P6: v1-[0-9a-f]{8}/);
    assert.match(texto, /explicador-demo/);
    assert.match(texto, /verificado\s*por\s*P6/);
    assert.match(texto, /no\s*se\s*generó\s*en\s*vivo\s*en\s*esta\s*ficha/);
    assert.doesNotMatch(texto, /Aprobado por|Aprobada por/);
  });

  test('GET ficha San Vicente: segundo registro también descarga', async () => {
    const r = await request(app).get('/api/documentos/registro/SV-001-medidas-preventivas-2024/pdf');
    assert.equal(r.status, 200);
    assert.equal(r.body.subarray(0, 4).toString(), '%PDF');
  });

  test('GET ficha inexistente: 404 declarado', async () => {
    const r = await request(app).get('/api/documentos/registro/XX-000-no-existe/pdf');
    assert.equal(r.status, 404);
    assert.match(r.body.error, /no encontrado/);
  });
});
