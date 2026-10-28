import test from 'node:test';
import assert from 'node:assert/strict';
import { responderDemo } from '../api/explicador-demo.js';
import { verificarTexto } from '../api/verificador.js';

test('La consulta genérica solo informa que no consta en los registros', () => {
  const demo = responderDemo({
    consulta: 'Hola, ¿qué información tienes disponible?'
  });

  const resultado = verificarTexto(
    demo.partes,
    demo.fuentesParaVerificar
  );

  assert.equal(
    demo.texto,
    'No consta en los registros cargados de esta instancia.'
  );

  assert.equal(
    demo.texto.includes('Puedo explicar los registros de la Quebrada Chogñacota'),
    false
  );

  assert.equal(
    demo.texto.includes('Si su consulta es sobre un lugar o una unidad que no aparece'),
    false
  );

  assert.equal(resultado.aprobado, true);
});

test('Las consultas sobre Chognacota conservan una respuesta aprobada por P6', () => {
  const consultas = [
    '¿Qué dice el informe oficial sobre la quebrada Chognacota?',
    '¿Qué información tienes disponible sobre Chognacota?'
  ];

  for (const consulta of consultas) {
    const demo = responderDemo({ consulta });
    const resultado = verificarTexto(
      demo.partes,
      demo.fuentesParaVerificar
    );

    assert.equal(
      resultado.aprobado,
      true,
      `P6 rechazó la consulta: ${consulta}`
    );

    assert.ok(
      demo.texto.length > 0,
      `La respuesta quedó vacía para: ${consulta}`
    );
  }
});