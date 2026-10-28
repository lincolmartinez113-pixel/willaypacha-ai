import { Router } from 'express';
import { createHash } from 'node:crypto';
import { config, leerSeed, VERSION_SISTEMA, AVISO_INSTANCIA } from '../config.js';
import { estadoMeta } from './meta-client.js';
import { explicar } from './explicador.js';
import { disponibilidadIdiomas, sintetizarVoz, transcribir } from '../idiomas/index.js';
import { db } from '../db.js';

export const nucleo = Router();

function rolDe(req) {
  const rol = req.header('x-demo-rol');
  const clave = req.header('x-demo-clave');
  if (!rol) return null;
  const esperada = rol === 'verificador' ? config.claves.verificador : rol === 'admin' ? config.claves.admin : null;
  return esperada && clave === esperada ? rol : null;
}

export function requerirRol(...roles) {
  return (req, res, next) => {
    const rol = rolDe(req);
    if (!rol || !roles.includes(rol)) {
      return res.status(403).json({
        error: 'acceso denegado',
        motivo: `acción reservada a los roles: ${roles.join(', ')}. En esta instancia de demostración se usa el esquema declarado en la Política de Seguridad; en producción, autenticación real con cuentas individuales.`,
      });
    }
    req.rol = rol;
    next();
  };
}

// ---------- Salud y datos ----------
nucleo.get('/salud', (req, res) => {
  const meta = estadoMeta();
  res.json({
    ok: true,
    version: VERSION_SISTEMA,
    modo: meta.modo,
    meta,
    idiomas: disponibilidadIdiomas(),
    segmentacion: {
      motorEnVivo: meta.habilitada ? config.meta.modeloSegmentacion : null,
      motorActivo: meta.habilitada ? 'sam-3.1' : 'local-heuristica-cliente',
      declaracion:
        'Sin clave de Meta Model API, la segmentación se calcula en el cliente con una heurística de color declarada. NO es SAM 3.1 y NO mide química: una fotografía no mide metales.',
    },
    clavesPorDefecto: config.claves.clavesPorDefecto,
    aviso: AVISO_INSTANCIA,
    fecha: new Date().toISOString(),
  });
});

nucleo.get('/seed', (req, res) => {
  res.json(leerSeed());
});

nucleo.get('/registros', (req, res) => {
  const seed = leerSeed();
  const unidadId = req.query.unidadId;
  const registros = unidadId ? seed.registros.filter((r) => r.unidadId === unidadId) : seed.registros;
  res.json({ registros, semaforoReglas: seed.semforoReglas });
});

nucleo.get('/bitacora/:registroId', (req, res) => {
  res.json({ registroId: req.params.registroId, cambios: db.bitacoraRegistro(req.params.registroId) });
});

// ---------- Explicación (P2/P3 → P6) ----------
nucleo.post('/explicar', async (req, res) => {
  try {
    const { consulta = '', registroId = null, lengua = 'es' } = req.body || {};
    if (!consulta && !registroId) {
      return res.status(400).json({ error: 'se requiere «consulta» o «registroId»' });
    }
    const resultado = await explicar({ consulta, registroId, lengua });
    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: 'error interno del explicador', detalle: String(error.message) });
  }
});

// ---------- Idiomas y voz ----------
nucleo.get('/idiomas/disponibilidad', (req, res) => {
  res.json(disponibilidadIdiomas());
});

nucleo.post('/voz/tts', (req, res) => {
  const { texto = '', lengua = 'es' } = req.body || {};
  if (!texto.trim()) return res.status(400).json({ error: 'falta «texto»' });
  const resultado = sintetizarVoz({ texto, lengua });
  res.status(resultado.estado).json(resultado.cuerpo);
});

nucleo.post('/voz/transcribir', (req, res) => {
  const r = transcribir();
  res.status(r.estado).json({ disponible: r.disponible, motivo: r.motivo });
});

// ---------- Segmentación ----------
nucleo.post('/segment', (req, res) => {
  const meta = estadoMeta();
  if (meta.habilitada) {
    // Punto de integración SAM 3.1 (Meta Model API). Si falla, la respuesta
    // declara la caída; la interfaz usa la heurística local declarada.
    return res.status(501).json({
      motor: 'sam-3.1',
      disponible: false,
      motivo: 'punto de integración SAM 3.1 definido; llamada en vivo a confirmar con la documentación oficial de la Meta Model API',
    });
  }
  res.json({
    motor: 'local-heuristica-cliente',
    disponible: true,
    instruccion:
      'La segmentación se calcula en el cliente (canvas) con una heurística de color declarada: detección de píxeles de tono anómalo respecto al fondo del agua/suelo. NO es SAM 3.1, NO mide química y su leyenda obligatoria lo dice en la interfaz y en la lámina.',
    etiquetaObligatoria: 'área visual anómala — una fotografía no mide química; la confirmación corresponde a un laboratorio acreditado',
  });
});

// ---------- Canal de rectificación para terceros (capa 4 del blindaje) ----------
nucleo.post('/rectificaciones', (req, res) => {
  const { registroId, alegacion, contacto, documentoSoporteUrl } = req.body || {};
  if (!registroId || !alegacion || !contacto) {
    return res.status(400).json({ error: 'se requiere registroId, alegación y contacto' });
  }
  const seed = leerSeed();
  if (!seed.registros.find((r) => r.id === registroId)) {
    return res.status(404).json({ error: 'registro no encontrado' });
  }
  const rectificacion = {
    id: db.siguienteId('RECT', 'rectificaciones'),
    registroId,
    alegacion,
    contacto,
    documentoSoporteUrl: documentoSoporteUrl || null,
    estado: 'recibida',
    creadoEl: new Date().toISOString(),
  };
  db.estado.rectificaciones.push(rectificacion);
  db.registrarCambioRegistro(registroId, 'rectificación solicitada por un tercero — en revisión', null);
  res.status(201).json({ id: rectificacion.id, estado: rectificacion.estado, compromiso: 'revisión y respuesta; si se acepta, el registro se actualiza con la misma visibilidad con la que se publicó el dato original' });
});

nucleo.get('/rectificaciones', (req, res) => {
  const { registroId } = req.query;
  const lista = (registroId ? db.estado.rectificaciones.filter((r) => r.registroId === registroId) : db.estado.rectificaciones)
    .map((r) => ({ id: r.id, registroId: r.registroId, estado: r.estado, fecha: r.creadoEl, documentoSoporteUrl: r.documentoSoporteUrl }));
  res.json({ rectificaciones: lista, nota: 'los datos de contacto de quienes rectifican no se publican' });
});

nucleo.post('/rectificaciones/:id/resolver', requerirRol('admin'), (req, res) => {
  const rect = db.estado.rectificaciones.find((r) => r.id === req.params.id);
  if (!rect) return res.status(404).json({ error: 'rectificación no encontrada' });
  const { resolucion, detalle, documento } = req.body || {};
  if (!['aceptada', 'rechazada'].includes(resolucion)) {
    return res.status(400).json({ error: 'resolución inválida (aceptada | rechazada)' });
  }
  rect.estado = resolucion;
  rect.resolucionDetalle = detalle || null;
  rect.resueltaEl = new Date().toISOString();
  if (resolucion === 'aceptada') {
    db.registrarCambioRegistro(rect.registroId, detalle || 'registro corregido tras rectificación aceptada', documento || null);
  } else {
    db.registrarCambioRegistro(rect.registroId, `rectificación evaluada y no aceptada: ${detalle || 'sin detalle'}`, documento || null);
  }
  res.json({ id: rect.id, estado: rect.estado });
});
