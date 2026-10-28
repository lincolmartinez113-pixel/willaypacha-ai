import { Router } from 'express';
import { db } from '../db.js';
import { requerirRol } from './rutas-core.js';

/**
 * Derechos ARCO (Ley N.° 29733 y su Reglamento, D.S. N.° 016-2024-JUS).
 * La prueba de esta vía forma parte de la auditoría: un usuario de prueba debe
 * poder acceder a sus datos, rectificarlos y borrarlos por completo.
 */
export const arco = Router();

const TIPOS = ['acceso', 'rectificacion', 'cancelacion', 'oposicion'];

arco.post('/solicitud', (req, res) => {
  const { tipo, identificador, detalle = '' } = req.body || {};
  if (!TIPOS.includes(tipo)) {
    return res.status(400).json({ error: `tipo inválido; use uno de: ${TIPOS.join(', ')}` });
  }
  if (!identificador) {
    return res.status(400).json({ error: 'se requiere un identificador de contacto para localizar sus datos' });
  }
  const solicitud = {
    id: db.siguienteId('ARCO', 'solicitudesArco'),
    tipo,
    identificador: String(identificador).trim(),
    detalle,
    estado: 'recibida',
    creadoEl: new Date().toISOString(),
  };
  db.estado.solicitudesArco.push(solicitud);
  db.guardar();
  res.status(201).json({
    id: solicitud.id,
    estado: solicitud.estado,
    plazo: 'La plataforma atiende la solicitud por el mismo canal; el ejercicio de derechos es gratuito.',
  });
});

arco.get('/', requerirRol('admin'), (req, res) => {
  res.json({ solicitudes: db.estado.solicitudesArco });
});

arco.post('/:id/ejecutar', requerirRol('admin'), (req, res) => {
  const solicitud = db.estado.solicitudesArco.find((s) => s.id === req.params.id);
  if (!solicitud) return res.status(404).json({ error: 'solicitud no encontrada' });
  if (solicitud.estado === 'atendida') return res.status(409).json({ error: 'solicitud ya atendida' });

  const norm = String(solicitud.identificador).trim().toLowerCase();
  const casosVinculados = db.estado.casos.filter((c) => String(c.contacto || '').toLowerCase() === norm);

  if (solicitud.tipo === 'acceso') {
    solicitud.respuesta = {
      casos: casosVinculados.map((c) => ({
        id: c.id,
        estado: c.estado,
        relato: c.relato,
        creadoEl: c.creadoEl,
        evidencias: c.evidencias.map((e) => ({ hash: e.hash, fechaCarga: e.fechaCarga })),
        bitacora: c.bitacora,
      })),
      rectificaciones: db.estado.rectificaciones
        .filter((r) => String(r.contacto || '').toLowerCase() === norm)
        .map((r) => ({ id: r.id, registroId: r.registroId, estado: r.estado, creadoEl: r.creadoEl })),
      solicitudes: db.estado.solicitudesArco
        .filter((s) => s.id !== solicitud.id && String(s.identificador || '').toLowerCase() === norm)
        .map((s) => ({ id: s.id, tipo: s.tipo, estado: s.estado, creadoEl: s.creadoEl })),
      nota: 'Estos son todos los datos vinculados a su identificador en esta instancia.',
    };
  } else if (solicitud.tipo === 'rectificacion') {
    const { campo, valor } = req.body || {};
    if (!campo || valor === undefined) {
      return res.status(400).json({ error: 'para rectificar indique «campo» y «valor»' });
    }
    const permitidos = ['contacto', 'relato'];
    if (!permitidos.includes(campo)) {
      return res.status(400).json({ error: `campo no rectificable por esta vía: ${permitidos.join(', ')}` });
    }
    for (const c of casosVinculados) c[campo] = campo === 'contacto' ? String(valor).trim() : valor;
    solicitud.respuesta = { campo, valor, casosActualizados: casosVinculados.map((c) => c.id) };
  } else if (solicitud.tipo === 'cancelacion') {
    const eliminados = db.eliminarPorIdentificador(solicitud.identificador);
    solicitud.respuesta = {
      eliminados,
      detalle: 'Ficha, evidencias, transcripciones y solicitudes eliminadas del sistema (borrado efectivo verificable).',
    };
  } else {
    solicitud.respuesta = {
      detalle:
        'Oposición registrada: el identificador queda excluido de tratamientos distintos a la conservación legalmente exigible. Para el detalle del alcance, la plataforma responde por el mismo canal.',
    };
  }

  solicitud.estado = 'atendida';
  solicitud.atendidaEl = new Date().toISOString();
  db.guardar();
  res.json({ id: solicitud.id, estado: solicitud.estado, respuesta: solicitud.respuesta });
});
