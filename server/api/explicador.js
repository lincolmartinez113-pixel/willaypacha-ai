import { estadoMeta, chatCompletion, MetaApiError, registroGeneracionEnVivo } from './meta-client.js';
import { cargarPrompts, versionPrompt } from './prompts.js';
import { responderDemo } from './explicador-demo.js';
import { verificarTexto } from './verificador.js';
import { leerSeed } from '../config.js';

const prompts = cargarPrompts();

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

  // ---- Ruta en vivo (Muse Spark) ----
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

      const textoBruto = await chatCompletion(
        [
          { role: 'system', content: prompts['P2-explicador-es'].contenido },
          { role: 'user', content: `Consulta de la comunidad: «${consulta}». Registros verificados disponibles: ${contexto}` },
        ],
        { temperatura: 0.2, maxTokens: 700, promptVersion: prompts['P2-explicador-es'].version },
      );

      let texto = textoBruto;
      if (lengua !== 'es') {
        const enLengua = await chatCompletion(
          [
            { role: 'system', content: prompts['P3-explicador-lengua'].contenido },
            { role: 'user', content: `Texto en español: «${textoBruto}». Lengua destino: ${lengua}.` },
          ],
          { temperatura: 0.2, maxTokens: 500, promptVersion: prompts['P3-explicador-lengua'].version },
        );
        try {
          const parseado = JSON.parse(enLengua);
          texto = parseado.texto_lengua || textoBruto;
        } catch {
          // Si P3 no devuelve JSON válido, la salida en lengua NO se publica:
          // solo el texto en español verificado.
          texto = textoBruto;
        }
      }

      // Verificación en vivo (P6) con fail-closed.
      let verificacionViva = null;
      try {
        const respuestaP6 = await chatCompletion(
          [
            { role: 'system', content: prompts['P6-verificador'].contenido },
            { role: 'user', content: `Texto: «${texto}». Fuentes: ${contexto}` },
          ],
          { temperatura: 0, maxTokens: 900, promptVersion: prompts['P6-verificador'].version },
        );
        verificacionViva = JSON.parse(respuestaP6);
      } catch {
        verificacionViva = null; // fail-closed: cae a la verificación en código
      }

      const resultado = verificacionFinal(texto, registrosRelevantes, {});
      const verificacion = verificacionViva?.aprobado === false
        ? { ...resultado, verificacionViva, bloqueado: true, texto: 'No consta. El verificador P6 bloqueó la salida.' }
        : resultado;

      return {
        ...verificacion,
        modo: 'en-vivo',
        registroGeneracion: {
          ...registroGeneracionEnVivo({
            promptNombre: 'P2+P3+P6',
            promptVersion: `${versionPrompt('P2-explicador-es')}+${versionPrompt('P6-verificador')}`,
            fuentes: registrosRelevantes.map((r) => ({ id: r.id, hash: r.hashDocumento })),
          }),
          verificacion: verificacion.verificacion,
        },
        citas: registrosRelevantes.map((r) => ({
          registroId: r.id, organismo: r.fuente.organismo, documento: r.fuente.documento,
          url: r.fuente.url, busqueda: r.fuente.busqueda, fecha: r.fecha,
          semaforo: r.semaforo, citaLiteral: r.citaLiteral, hashDocumento: r.hashDocumento,
        })),
      };
    } catch (error) {
      if (error instanceof MetaApiError && error.codigo === 'SIN_CREDITOS') {
        // Protocolo: ante 402, detenerse y reportar; nunca cambiar de proveedor.
        return {
          bloqueado: true,
          modo: 'en-vivo',
          error: 'SIN_CREDITOS',
          texto: 'El servicio de IA en vivo está detenido: créditos de la Meta Model API agotados (402). Según el protocolo, no se sustituye el proveedor.',
          verificacion: { aprobado: false, afirmaciones: [], motivoBloqueo: 'créditos agotados' },
        };
      }
      // Otros errores: caída declarada al modo demo (no silenciosa).
      const demo = responderDemo({ consulta, registroId, lengua });
      return cerrarDemo(demo, `caída en vivo a modo demo por error de API: ${error.message}`);
    }
  }

  // ---- Ruta demo ----
  const demo = responderDemo({ consulta, registroId, lengua });
  return cerrarDemo(demo, null);
}

function cerrarDemo(demo, motivoCaida) {
  const resultado = verificacionFinal(demo.partes, demo.fuentesParaVerificar);
  const textoFinal = resultado.bloqueado ? 'No consta. (P6 bloqueó la salida.)' : demo.texto;
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
      nota: 'Respuesta anclada a data/datos-semilla.json. Si META_API_KEY se configura, esta consulta se responde en vivo con Muse Spark bajo el mismo verificador.',
    },
  };
}
