import { Router } from 'express';
import { db } from '../db.js';
import { leerSeed } from '../config.js';
import { estadoMeta } from './meta-client.js';
import { versionPrompt } from './prompts.js';
import { generarPdf, guardarPdf, leerPdf } from '../pdf/generador.js';
import { requerirRol } from './rutas-core.js';

export const documentos = Router();

const TIPOS = ['acta', 'informe', 'denuncia'];

function registroGeneracionDocumento(unidadId) {
  const seed = leerSeed();
  const registros = seed.registros.filter((r) => r.unidadId === unidadId);
  const meta = estadoMeta();
  return {
    modo: meta.modo,
    modelo: meta.habilitada ? meta.modelo : 'generador-demo (sin Meta Model API en vivo)',
    prompt: `P5 ${versionPrompt('P5-generador-documentos')}`,
    fecha: new Date().toISOString(),
    fuentes: registros.map((r) => ({ id: r.id, hash: r.hashDocumento })),
    nota: 'Este registro se imprime en el pie de cada página del PDF.',
  };
}

documentos.get('/', (req, res) => {
  res.json({
    documentos: db.estado.documentos.map((d) => ({
      id: d.id,
      tipo: d.tipo,
      unidadId: d.unidadId,
      estado: d.estado,
      creadoEl: d.creadoEl,
      aprobadoEl: d.aprobadoEl || null,
      experto: d.experto ? { nombre: d.experto.nombre, tipo: d.experto.tipo, colegiatura: d.experto.colegiatura } : null,
      puedeDescargarFinal: d.estado === 'aprobado',
      bitacora: d.bitacora,
    })),
    regla: 'El PDF final está bloqueado hasta la aprobación de un experto colegiado. La plataforma no firma ni presenta documentos.',
  });
});

documentos.post('/', async (req, res) => {
  try {
    const { tipo, unidadId, datos = {} } = req.body || {};
    if (!TIPOS.includes(tipo)) {
      return res.status(400).json({ error: `tipo inválido; use uno de: ${TIPOS.join(', ')}` });
    }
    const seed = leerSeed();
    if (!seed.unidades.find((u) => u.id === unidadId)) {
      return res.status(400).json({ error: 'unidadId inválido o ausente' });
    }

    const id = db.siguienteId('DOC', 'documentos');
    const doc = {
      id,
      tipo,
      unidadId,
      datos,
      estado: 'borrador-ia',
      creadoEl: new Date().toISOString(),
      registroGeneracion: registroGeneracionDocumento(unidadId),
      bitacora: [
        {
          fecha: new Date().toISOString(),
          evento: 'borrador-ia',
          detalle: 'Documento generado como borrador con asistencia de IA (P5). Requiere revisión de especialista.',
        },
      ],
    };
    const buffer = await generarPdf(doc, { aprobado: false });
    const guardado = guardarPdf(id, 'borrador', buffer);
    doc.pdfBorrador = { hash: guardado.hash, ruta: guardado.ruta };
    db.estado.documentos.push(doc);
    db.guardar();

    res.status(201).json({
      id,
      estado: doc.estado,
      pdfUrl: `/api/documentos/${id}/pdf`,
      aviso: 'Borrador con franja en cada página. Sin firma y sin fecha de presentación.',
    });
  } catch (error) {
    res.status(500).json({ error: 'no se pudo generar el documento', detalle: String(error.message) });
  }
});

documentos.get('/:id', (req, res) => {
  const doc = db.estado.documentos.find((d) => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: 'documento no encontrado' });
  res.json({
    id: doc.id,
    tipo: doc.tipo,
    unidadId: doc.unidadId,
    estado: doc.estado,
    creadoEl: doc.creadoEl,
    experto: doc.experto || null,
    aprobadoEl: doc.aprobadoEl || null,
    bitacora: doc.bitacora,
    puedeDescargarFinal: doc.estado === 'aprobado',
    registroGeneracion: doc.registroGeneracion,
  });
});

documentos.get('/:id/pdf', async (req, res) => {
  const doc = db.estado.documentos.find((d) => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: 'documento no encontrado' });

  const quiereFinal = req.query.version === 'final';
  if (quiereFinal && doc.estado !== 'aprobado') {
    return res.status(403).json({
      error: 'el PDF final está bloqueado hasta la aprobación de un experto colegiado',
      estadoActual: doc.estado,
      regla: 'La máquina prepara, el profesional responde, la comunidad decide.',
    });
  }

  let buffer;
  if (doc.estado === 'aprobado') {
    buffer = leerPdf(doc.id, 'final');
    if (!buffer) {
      buffer = await generarPdf(doc, { aprobado: true, experto: doc.experto });
      guardarPdf(doc.id, 'final', buffer);
    }
  } else {
    buffer = leerPdf(doc.id, 'borrador');
    if (!buffer) {
      buffer = await generarPdf(doc, { aprobado: false });
      guardarPdf(doc.id, 'borrador', buffer);
    }
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${doc.id}-${doc.estado === 'aprobado' ? 'final' : 'borrador'}.pdf"`);
  res.send(buffer);
});

documentos.post('/:id/revision', requerirRol('verificador', 'admin'), async (req, res) => {
  const doc = db.estado.documentos.find((d) => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: 'documento no encontrado' });

  const { accion, experto, observaciones } = req.body || {};

  if (accion === 'revisar') {
    if (doc.estado !== 'borrador-ia') {
      return res.status(409).json({ error: `transición inválida desde ${doc.estado}` });
    }
    doc.estado = 'en-revision';
    doc.bitacora.push({ fecha: new Date().toISOString(), evento: 'en-revision', detalle: 'Documento tomado para revisión experta.' });
    db.guardar();
    return res.json({ id: doc.id, estado: doc.estado });
  }

  if (accion === 'aprobar') {
    if (doc.estado !== 'en-revision') {
      return res.status(409).json({ error: `transición inválida desde ${doc.estado}: se requiere «en-revision»` });
    }
    if (!experto?.nombre || !experto?.colegiatura || !['CIP', 'CAL'].includes(experto?.tipo)) {
      return res.status(400).json({
        error: 'para aprobar se requiere nombre del experto, número de colegiatura y tipo (CIP o CAL)',
        regla: 'El sistema no firma por nadie: la aprobación queda registrada con el profesional identificado.',
      });
    }
    doc.estado = 'aprobado';
    doc.experto = {
      nombre: experto.nombre,
      colegiatura: String(experto.colegiatura),
      tipo: experto.tipo,
      fecha: new Date().toISOString(),
    };
    doc.aprobadoEl = doc.experto.fecha;
    doc.bitacora.push({
      fecha: doc.aprobadoEl,
      evento: 'aprobado',
      detalle: `Aprobado por ${experto.nombre} — ${experto.tipo} N.° ${experto.colegiatura}. Se habilita el PDF final; la presentación la realiza la persona por los canales oficiales.`,
    });
    // Regenerar el PDF final con el bloque del experto.
    const final = await generarPdf(doc, { aprobado: true, experto: doc.experto });
    const guardado = guardarPdf(doc.id, 'final', final);
    doc.pdfFinal = { hash: guardado.hash, ruta: guardado.ruta };
    db.guardar();
    return res.json({ id: doc.id, estado: doc.estado, pdfFinalUrl: `/api/documentos/${doc.id}/pdf?version=final`, hash: guardado.hash });
  }

  if (accion === 'observar') {
    if (doc.estado !== 'en-revision') {
      return res.status(409).json({ error: `transición inválida desde ${doc.estado}` });
    }
    if (!observaciones || !String(observaciones).trim()) {
      return res.status(400).json({ error: 'para observar se requiere el texto de las observaciones' });
    }
    doc.estado = 'borrador-ia';
    doc.bitacora.push({
      fecha: new Date().toISOString(),
      evento: 'observado',
      detalle: `Devuelto a borrador con observaciones: ${observaciones}`,
    });
    db.guardar();
    return res.json({ id: doc.id, estado: doc.estado, observaciones });
  }

  res.status(400).json({ error: 'acción inválida (revisar | aprobar | observar)' });
});
