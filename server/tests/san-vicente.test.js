import test from 'node:test';
import assert from 'node:assert/strict';
import { responderDemo } from '../api/explicador-demo.js';
import { verificarTexto } from '../api/verificador.js';

const casos = [
  ['en que esta el caso de la unidad san vicente', 'SV-001-medidas-preventivas-2024'],
  ['medidas preventivas San Vicente', 'SV-001-medidas-preventivas-2024'],
  ['reconsideración San Vicente', 'SV-002-reconsideracion-2025'],
  ['tribunal San Vicente', 'SV-003-tribunal-2025'],
];

for (const [consulta, esperado] of casos) {
  test(`San Vicente: ${consulta}`, () => {
    const demo = responderDemo({ consulta });
    const resultado = verificarTexto(demo.partes, demo.fuentesParaVerificar);
    assert.equal(resultado.aprobado, true, JSON.stringify(resultado.afirmaciones));
    assert.equal(demo.citas[0]?.registroId, esperado);
  });
}
