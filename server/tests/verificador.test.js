import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { verificarTexto } from '../api/verificador.js';
import { leerSeed } from '../config.js';

const seed = leerSeed();
const chognacota = seed.registros.find((r) => r.id === 'SR-001-chognacota-agua');
const fuentes = [chognacota];
const nombresTerceros = seed.unidades.flatMap((u) => [u.nombre, u.empresa]);

describe('P6 — Verificador (código)', () => {
  test('Acepta el texto atribuido con cita literal de la fuente', () => {
    const texto =
      'Según OEFA (Evaluación ambiental de causalidad del área de influencia de la UM Nueva Acumulación Quenamari – San Rafael, 2014): «Fluoruros, sulfatos y calcio superaron los Estándares de Calidad Ambiental para Agua de 2008 (categoría 3); el estudio determina que su origen proviene directamente del efluente minero P-4».';
    const r = verificarTexto(texto, fuentes, { nombresTerceros });
    assert.equal(r.aprobado, true, JSON.stringify(r.afirmaciones.filter((a) => a.estado !== 'soportada')));
  });

  test('Bloquea una cifra fabricada', () => {
    const texto = 'Según OEFA, la quebrada registró 37,4 mg/L de fluoruros en la medición.';
    const r = verificarTexto(texto, fuentes, { nombresTerceros });
    assert.equal(r.aprobado, false);
    assert.match(r.motivoBloqueo, /cifra/);
  });

  test('Bloquea vocabulario de acusación que la fuente no usa', () => {
    const texto = 'Según el registro, Minsur contaminó la quebrada Chogñacota con fluoruros y sulfatos.';
    const r = verificarTexto(texto, fuentes, { nombresTerceros });
    assert.equal(r.aprobado, false);
    assert.match(r.motivoBloqueo, /vocabulario de acusación/);
  });

  test('Bloquea causalidad no escrita por la fuente', () => {
    const texto = 'El efluente provocó la muerte de los peces de la quebrada.';
    const r = verificarTexto(texto, fuentes, { nombresTerceros });
    assert.equal(r.aprobado, false);
  });

  test('Bloquea un hecho sobre una empresa sin atribución', () => {
    const texto = 'Minsur S.A. superó los estándares de fluoruros en la quebrada.';
    const r = verificarTexto(texto, fuentes, { nombresTerceros });
    assert.equal(r.aprobado, false);
    assert.match(r.motivoBloqueo, /atribución/);
  });

  test('Bloquea una afirmación sin anclaje en las fuentes', () => {
    const texto = 'La empresa contrató a doscientos trabajadores nuevos este mes.';
    const r = verificarTexto(texto, fuentes, { nombresTerceros });
    assert.equal(r.aprobado, false);
  });

  test('Una sola afirmación no soportada bloquea la salida completa', () => {
    const texto =
      'Según OEFA (Evaluación ambiental de causalidad, 2014): «Fluoruros, sulfatos y calcio superaron los Estándares de Calidad Ambiental para Agua de 2008 (categoría 3)». Además, la quebrada perdió el 90 por ciento de sus peces.';
    const r = verificarTexto(texto, fuentes, { nombresTerceros });
    assert.equal(r.aprobado, false);
  });

  test('La marca meta no aprueba automáticamente una frase sin respaldo', () => {
    const partes = [
      { texto: 'No consta en los registros cargados de esta instancia.', meta: true },
      { texto: 'Minsur S.A. es culpable del hallazgo.', meta: false },
    ];
    const r = verificarTexto(partes, fuentes, { nombresTerceros });
    assert.equal(r.aprobado, false);
    assert.ok(
      r.afirmaciones.some(
        (a) =>
          a.texto === 'No consta en los registros cargados de esta instancia.' &&
          a.estado === 'soportada',
      ),
      JSON.stringify(r.afirmaciones, null, 2),
    );
    assert.ok(
      r.afirmaciones.some(
        (a) =>
          a.texto.includes('Minsur S.A.') &&
          a.estado === 'no_soportada',
      ),
      JSON.stringify(r.afirmaciones, null, 2),
    );
    assert.ok(
      r.afirmaciones.some((a) => a.estado === 'no_soportada'),
      JSON.stringify(r.afirmaciones, null, 2),
    );
  });

  test('No acepta una afirmación factual solo porque comienza con «No consta»', () => {
    const texto =
      'No consta que la quebrada perdio el 90 por ciento de sus peces.';
    const r = verificarTexto(texto, fuentes, { nombresTerceros });

    assert.equal(r.aprobado, false);
    assert.ok(
      r.afirmaciones.some(
        (a) =>
          a.estado === 'no_soportada' &&
          /cifra|respaldo textual/i.test(a.motivo),
      ),
      JSON.stringify(r.afirmaciones, null, 2),
    );
    assert.ok(
      !r.afirmaciones.some(
        (a) =>
          a.estado === 'soportada' &&
          /no consta que la quebrada perdio/i.test(a.texto),
      ),
      'La parte factual no debe clasificarse como frase meta soportada',
    );
  });

  test('Bloquea una afirmación factual aunque el generador la marque como meta', () => {
    const partes = [
      {
        texto: 'No consta que la quebrada perdio el 90 por ciento de sus peces.',
        meta: true,
      },
    ];

    const r = verificarTexto(partes, fuentes, { nombresTerceros });

    assert.equal(r.aprobado, false);
    assert.ok(
      r.afirmaciones.some((a) => a.estado === 'no_soportada'),
      JSON.stringify(r.afirmaciones, null, 2),
    );
  });
});
