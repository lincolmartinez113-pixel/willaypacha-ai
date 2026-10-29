import { estadoMeta, chatCompletionConUso, MetaApiError, registroGeneracionEnVivo } from './meta-client.js';
import { cargarPrompts, versionPrompt } from './prompts.js';
import { responderDemo, traducirConGlosario } from './explicador-demo.js';
import { verificarTexto } from './verificador.js';
import { config, leerSeed } from '../config.js';
import { estimarCosto, motivoBloqueoIntegracion } from './vivo-prueba.js';

const prompts = cargarPrompts();

// Tope de tokens de salida en vivo, PROPIO de /api/explicar (no reutiliza
// el de /api/vivo-prueba: su prompt es distinto y razona más).
// Medición en vivo 2026-10-29 (muse-spark-1.3, consulta libre con el
// contexto completo de 8 registros, P2): prompt 1633 tokens,
// completion 2432 = 2304 de razonamiento interno + ~128 visibles,
// finish_reason=stop en 8,7 s. Con el tope anterior de 2000 el presupuesto
// se agotaba en razonamiento (finish_reason=length, content nulo) y el
// endpoint caía al fallback declarado (incidente 29/10 12:52).
// 6000 ≈ 2,5× la completion observada: cubre el razonamiento medido, la
// respuesta completa de 90 palabras y margen para la variabilidad entre
// corridas. /api/vivo-prueba queda en 2000: su prompt (1 registro,
// pregunta fijada) razona menos (198–889 medidos) y funciona con ese tope.
// Si algún día se alcanza, la causa se declara y nada parcial se muestra.
export const MAX_TOKENS_EXPLICAR = 6000;
const TIMEOUT_VIVO_MS = 20000;

function nombresTerceros() {
  const seed = leerSeed();
  const nombres = [];
  for (const u of seed.unidades) {
    nombres.push(u.nombre, u.empresa);
    for (const c of u.componentes) nombres.push(c.nombre);
  }
  return nombres.filter(Boolean);
}

function verificacionFinal(texto, registros, extra = {}) {
  const resultado = verificarTexto(texto, registros, { nombresTerceros: nombresTerceros() });
  if (!resultado.aprobado) {
    // Bloqueo: la salida completa se sustituye por la negativa correcta.
    return {
      bloqueado: true,
      texto: 'No consta. El texto generado no superó la verificación P6 y no se muestra.',
      verificacion: resultado,
    };
  }
  return { bloqueado: false, verificacion: resultado };
}

export async function explicar({ consulta = '', registroId = null, lengua = 'es' }) {
  const meta = estadoMeta();

  // ---- Ruta en vivo (Muse Spark vía Meta Model API) ----
  // Misma integración ya probada en /api/vivo-prueba: extracción de texto
  // en cadena/bloques/null, finish_reason, costo y tokens de razonamiento
  // reportados; el tope es propio (MAX_TOKENS_EXPLICAR). P6 en código decide
  // antes de mostrar;
  // lo no aprobado nunca se muestra: se responde con el explicador-demo.
  if (meta.habilitada) {
    try {
      const seed = leerSeed();
      const registrosRelevantes = registroId
        ? seed.registros.filter((r) => r.id === registroId)
        : seed.registros;
      const contexto = JSON.stringify(
        registrosRelevantes.map((r) => ({
          id: r.id, hecho: r.hecho, fecha: r.fecha, cita: r.citaLiteral,
          organismo: r.fuente.organismo, documento: r.fuente.documento,
          semaforo: r.semaforo, estadoProcesal: r.estadoProcesal,
        })),
      );

      const mensajes = [
        { role: 'system', content: prompts['P2-explicador-es'].contenido },
        { role: 'user', content: `Consulta de la comunidad: «${consulta}». Registros verificados disponibles: ${contexto}` },
      ];
      const { texto, uso, finishReason, negativa } = await chatCompletionConUso(
        mensajes,
        { temperatura: 0.2, maxTokens: MAX_TOKENS_EXPLICAR, promptVersion: prompts['P2-explicador-es'].version, timeoutMs: TIMEOUT_VIVO_MS },
      );
      const costoEstimado = estimarCosto({ uso, textoEntrada: JSON.stringify(mensajes), textoSalida: texto });
      const citas = registrosRelevantes.map((r) => ({
        registroId: r.id, organismo: r.fuente.organismo, documento: r.fuente.documento,
        url: r.fuente.url, busqueda: r.fuente.busqueda, fecha: r.fecha,
        semaforo: r.semaforo, citaLiteral: r.citaLiteral, hashDocumento: r.hashDocumento,
      }));
      const fuentesRegistro = registrosRelevantes.map((r) => ({ id: r.id, hash: r.hashDocumento }));

      // Causa de integración (vacía/truncada) antes que P6: P6 decide solo
      // sobre texto completo. En ambos casos, lo no aprobado no se muestra y
      // se responde con el explicador-demo declarado.
      const bloqueoIntegracion = motivoBloqueoIntegracion({ texto, finishReason, negativa, uso, maxTokens: MAX_TOKENS_EXPLICAR });
      if (bloqueoIntegracion) {
        const demo = responderDemo({ consulta, registroId, lengua });
        return {
          ...cerrarDemo(demo, `llamada en vivo no mostrable (${bloqueoIntegracion.causa}): ${bloqueoIntegracion.motivo}`),
          finishReason: finishReason ?? null,
          costoEstimado,
        };
      }

      // P6 en código ANTES de mostrar (sin debilitar: misma barrera que demo
      // y que /api/vivo-prueba). Si bloquea, demo declarado, nunca el texto.
      const resultado = verificacionFinal(texto, registrosRelevantes, {});
      if (resultado.bloqueado) {
        const demo = responderDemo({ consulta, registroId, lengua });
        return {
          ...cerrarDemo(demo, `texto en vivo bloqueado por P6 y no mostrado: ${resultado.verificacion.motivoBloqueo}`),
          finishReason: finishReason ?? null,
          costoEstimado,
        };
      }

      // Texto en vivo aprobado. La salida en lengua usa el glosario aprobado
      // de forma determinista (misma regla P3 que demo): evita una segunda
      // llamada libre en lenguas originarias sin verificación P6.
      const trad = traducirConGlosario(texto, lengua);
      return {
        bloqueado: false,
        modo: 'en-vivo',
        modelo: config.meta.modelo,
        apiBase: config.meta.apiBase,
        texto,
        textoLengua: trad.textoLengua,
        estadoTraduccion: trad.estadoTraduccion,
        terminosGlosario: trad.terminos,
        motivo: 'explicación en vivo verificada por P6',
        finishReason: finishReason ?? null,
        costoEstimado,
        verificacion: resultado.verificacion,
        citas,
        registroGeneracion: {
          ...registroGeneracionEnVivo({
            promptNombre: 'P2-explicador-es',
            promptVersion: prompts['P2-explicador-es'].version,
            fuentes: fuentesRegistro,
          }),
          verificacion: resultado.verificacion,
        },
      };
    } catch (error) {
      if (error instanceof MetaApiError && error.codigo === 'SIN_CREDITOS') {
        // Protocolo: ante 402, detenerse y reportar; nunca cambiar de
        // proveedor. Se responde con el explicador-demo declarado.
        const demo = responderDemo({ consulta, registroId, lengua });
        return {
          ...cerrarDemo(demo, 'créditos de la Meta Model API agotados (402): respuesta demo declarada; según el protocolo, no se sustituye el proveedor'),
          error: 'SIN_CREDITOS',
        };
      }
      if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
        const demo = responderDemo({ consulta, registroId, lengua });
        return {
          ...cerrarDemo(demo, `llamada en vivo agotó el tiempo (${TIMEOUT_VIVO_MS / 1000} s): respuesta demo declarada, sin reintento automático`),
        };
      }
      // Otros errores: caída declarada al modo demo (no silenciosa).
      const demo = responderDemo({ consulta, registroId, lengua });
      return cerrarDemo(demo, `caída en vivo a modo demo por error de API: ${error.message}`);
    }
  }

  // ---- Ruta demo (sin META_API_KEY: nada en vivo, nada simulado) ----
  const demo = responderDemo({ consulta, registroId, lengua });
  return cerrarDemo(demo, null);
}

function cerrarDemo(demo, motivoCaida) {
  const resultado = verificacionFinal(demo.partes, demo.fuentesParaVerificar);
  const textoFinal = resultado.bloqueado ? 'No consta. (P6 bloqueó la salida.)' : demo.texto;
  const notaBase = 'Respuesta anclada a data/datos-semilla.json. Si META_API_KEY se configura, esta consulta se responde en vivo con Muse Spark bajo el mismo verificador.';
  return {
    bloqueado: resultado.bloqueado,
    modo: 'demo',
    motivoCaida,
    texto: textoFinal,
    textoLengua: demo.textoLengua,
    estadoTraduccion: demo.estadoTraduccion,
    terminosGlosario: demo.terminosGlosario,
    motivo: demo.motivo,
    citas: demo.citas,
    registroGeneracion: {
      modo: 'demo',
      modelo: 'explicador-demo (sin Meta Model API en vivo)',
      prompt: `P2 ${versionPrompt('P2-explicador-es')} · P6 ${versionPrompt('P6-verificador')}`,
      fecha: new Date().toISOString(),
      fuentes: demo.citas.map((c) => ({ id: c.registroId, hash: c.hashDocumento })),
      verificacion: resultado.verificacion,
      nota: motivoCaida ? `${notaBase} Fallback declarado: ${motivoCaida}` : notaBase,
    },
  };
}
