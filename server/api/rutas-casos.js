import { Router } from 'express';
import multer from 'multer';
import { createHash, randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { config, leerSeed } from '../config.js';
import { db } from '../db.js';
import { requerirRol } from './rutas-core.js';

export const casos = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: 12 },
  fileFilter: (req, file, cb) => {
    const permitidos = /^(image|video|audio)\//.test(file.mimetype) || file.mimetype === 'application/pdf';
    cb(permitidos ? null : new Error('tipo de archivo no permitido (imagen, video, audio o PDF)'), permitidos);
  },
});

export const LEYENDA_PUBLICACION =
  'La plataforma verificó la autenticidad e integridad de la evidencia. Esto no afirma que hubo contaminación: eso lo determina OEFA o un laboratorio acreditado.';

const PERFILES_VALIDOS = ['ambiental', 'legal', 'técnico', 'comunitario'];

function hashBuffer(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function extensionSegura(nombre = '') {
  const ext = path.extname(nombre).toLowerCase().replace(/[^.a-z0-9]/g, '');
  return ext && ext.length <= 6 ? ext : '.bin';
}

function contrasteOficial(relato) {
  const seed = leerSeed();
  const texto = String(relato || '').toLowerCase();
  const coincidencias = [];
  for (const u of seed.unidades) {
    const nombres = [u.nombre, u.empresa, u.cuenca, ...u.componentes.map((c) => c.nombre)].filter(Boolean);
    for (const n of nombres) {
      const partes = n.toLowerCase().split(/\s+/).filter((p) => p.length > 4);
      if (partes.some((p) => texto.includes(p))) {
        coincidencias.push(u.nombre);
        break;
      }
    }
  }
  return coincidencias.length
    ? { resultado: 'con contraste oficial disponible', unidades: [...new Set(coincidencias)], nota: 'Existe información oficial cargada en la zona; el caso se contrasta contra ella en la revisión.' }
    : { resultado: 'sin contraste oficial disponible', unidades: [], nota: 'La ausencia de contraste oficial no bloquea el caso: es en sí mismo un dato relevante sobre la fiscalización de ese territorio.' };
}

function vistaPublica(caso) {
  return {
    id: caso.id,
    estado: caso.estado,
    relato: caso.relato,
    lengua: caso.lengua,
    zona: caso.zona || 'zona o cuenca (no se publica ubicación exacta de viviendas)',
    identidadReservada: caso.identidadReservada,
    evidencias: (caso.evidencias || []).map((e) => ({
      hash: e.hash,
      tipo: e.tipoMime,
      fechaCarga: e.fechaCarga,
      metadatosOcultos: e.metadatosOcultos,
      metadatos: e.metadatosOcultos ? null : e.metadatos,
    })),
    consistencia: caso.consistencia,
    publicadoEl: caso.publicadoEl,
    leyenda: LEYENDA_PUBLICACION,
    descargo: caso.estado === 'descartado' ? { motivo: caso.motivoDescarte, apelacion: 'La comunidad puede apelar la decisión por su canal de contacto.' } : undefined,
  };
}

casos.get('/', (req, res) => {
  const rol = req.header('x-demo-rol');
  const clave = req.header('x-demo-clave');
  const esRevisor =
    (rol === 'verificador' && clave === config.claves.verificador) ||
    (rol === 'admin' && clave === config.claves.admin);

  const publicados = db.estado.casos.filter((c) => c.estado === 'verificado').map(vistaPublica);
  if (esRevisor) {
    return res.json({
      publicados,
      bandeja: db.estado.casos.map((c) => ({
        id: c.id,
        estado: c.estado,
        creadoEl: c.creadoEl,
        relato: c.relato,
        evidencias: c.evidencias?.length || 0,
        revisiones: c.revisiones || [],
        consistencia: c.consistencia,
        contacto: c.contacto,
        identidadReservada: c.identidadReservada,
      })),
      leyenda: LEYENDA_PUBLICACION,
    });
  }
  res.json({ publicados, leyenda: LEYENDA_PUBLICACION });
});

casos.post('/', upload.array('evidencias', 12), (req, res) => {
  try {
    const campos = req.body || {};
    if (String(campos.consentimiento) !== 'true') {
      return res.status(400).json({
        error: 'se requiere consentimiento informado',
        detalle:
          'Antes de registrar un caso se informa qué se guardará, para qué, por cuánto tiempo y qué derechos asisten (Ley N.° 29733 y su Reglamento, D.S. N.° 016-2024-JUS). Sin consentimiento no se registra nada.',
      });
    }
    if (!campos.relato || String(campos.relato).trim().length < 20) {
      return res.status(400).json({ error: 'el relato es obligatorio (mínimo 20 caracteres)' });
    }

    const archivos = req.files || [];
    const evidencias = [];
    for (const archivo of archivos) {
      const hash = hashBuffer(archivo.buffer);
      // Paso 2: duplicados — una misma evidencia no se multiplica como casos distintos.
      const existente = db.estado.casos.find((c) => (c.evidencias || []).some((e) => e.hash === hash));
      if (existente) {
        return res.status(409).json({
          error: 'evidencia duplicada',
          motivo: 'esta evidencia ya está registrada en otro caso; no se crea un segundo caso por el mismo archivo',
          casoExistente: existente.id,
        });
      }
      const dir = path.join(config.rutaDatos, 'evidencias');
      mkdirSync(dir, { recursive: true });
      const nombreArchivo = `${hash}${extensionSegura(archivo.originalname)}`;
      writeFileSync(path.join(dir, nombreArchivo), archivo.buffer);

      let metadatos = null;
      try {
        metadatos = campos.exif ? JSON.parse(campos.exif) : null;
      } catch {
        metadatos = null;
      }
      evidencias.push({
        hash,
        archivo: nombreArchivo,
        nombreOriginal: path.basename(archivo.originalname || 'archivo'),
        tipoMime: archivo.mimetype,
        tamano: archivo.size,
        fechaCarga: new Date().toISOString(),
        metadatos,
        metadatosOcultos: String(campos.metadatosOcultos) === 'true',
      });
    }

    const id = db.siguienteId('CASO', 'casos');
    const codigoRetiro = randomBytes(6).toString('hex');
    const revisiones = [];
    const caso = {
      id,
      codigoRetiro,
      estado: 'recibido',
      canal: 'web',
      relato: String(campos.relato).trim(),
      lengua: campos.lengua || 'es',
      zona: campos.zona || null,
      identidadReservada: String(campos.identidadReservada) === 'true',
      contacto: String(campos.contacto || '').trim(),
      evidencias,
      consistencia: {
        paso: 'consistencia-automatica',
        ...contrasteOficial(campos.relato),
        duplicados: 'sin duplicados al momento de la carga',
        nota: 'La IA actúa como asistente del filtro, nunca como juez. Ninguna automatización sustituye la revisión humana.',
      },
      revisiones,
      bitacora: [
        { fecha: new Date().toISOString(), evento: 'recibido', detalle: 'Caso recibido con consentimiento informado. Estado privado.' },
      ],
      creadoEl: new Date().toISOString(),
    };

    db.estado.casos.push(caso);
    db.guardar();

    res.status(201).json({
      id,
      codigoRetiro,
      estado: caso.estado,
      aviso: 'Guarde su código de retiro: permite seguir el caso y retirarlo con borrado efectivo en cualquier momento.',
      siguientePaso: 'El caso entra al filtro de verificación en cinco pasos. Ningún caso se publica directo.',
    });
  } catch (error) {
    res.status(400).json({ error: 'no se pudo registrar el caso', detalle: String(error.message) });
  }
});

casos.get('/:id', (req, res) => {
  const caso = db.estado.casos.find((c) => c.id === req.params.id);
  if (!caso) return res.status(404).json({ error: 'caso no encontrado' });

  const rol = req.header('x-demo-rol');
  const clave = req.header('x-demo-clave');
  const esRevisor =
    (rol === 'verificador' && clave === config.claves.verificador) ||
    (rol === 'admin' && clave === config.claves.admin);

  if (caso.estado === 'verificado' || esRevisor) {
    return res.json(esRevisor ? caso : vistaPublica(caso));
  }
  res.status(403).json({ error: 'caso no público', motivo: 'solo los casos verificados son visibles públicamente' });
});

casos.get('/:id/seguimiento', (req, res) => {
  const caso = db.estado.casos.find((c) => c.id === req.params.id);
  if (!caso) return res.status(404).json({ error: 'caso no encontrado' });
  if (req.query.codigo !== caso.codigoRetiro) {
    return res.status(403).json({ error: 'código de retiro inválido' });
  }
  res.json({
    id: caso.id,
    estado: caso.estado,
    creadoEl: caso.creadoEl,
    bitacora: caso.bitacora,
    evidencias: caso.evidencias.map((e) => ({ hash: e.hash, fechaCarga: e.fechaCarga })),
    puedeRetirarse: true,
    nota: 'El retiro elimina ficha, evidencia y transcripciones del sistema (borrado efectivo).',
  });
});

casos.post('/:id/revision', requerirRol('verificador', 'admin'), (req, res) => {
  const caso = db.estado.casos.find((c) => c.id === req.params.id);
  if (!caso) return res.status(404).json({ error: 'caso no encontrado' });
  const { accion, revisor, dictamen, motivo, contieneMenores } = req.body || {};

  if (accion === 'en-verificacion') {
    if (caso.estado !== 'recibido') return res.status(409).json({ error: `transición inválida desde ${caso.estado}` });
    caso.estado = 'en-verificacion';
    caso.bitacora.push({ fecha: new Date().toISOString(), evento: 'en-verificacion', detalle: 'Caso en verificación: revisión humana en curso.' });
    db.guardar();
    return res.json({ id: caso.id, estado: caso.estado });
  }

  if (accion === 'revisar') {
    if (caso.estado !== 'en-verificacion') {
      return res.status(409).json({ error: `transición inválida desde ${caso.estado}: se requiere «en-verificacion»` });
    }
    if (!revisor?.nombre || !PERFILES_VALIDOS.includes(revisor?.perfil)) {
      return res.status(400).json({ error: `revisor requiere nombre y perfil válido (${PERFILES_VALIDOS.join(', ')})` });
    }
    if (!['favorable', 'desfavorable'].includes(dictamen)) {
      return res.status(400).json({ error: 'dictamen inválido (favorable | desfavorable)' });
    }
    caso.revisiones.push({
      fecha: new Date().toISOString(),
      revisor: { nombre: revisor.nombre, perfil: revisor.perfil },
      dictamen,
      contieneMenores: Boolean(contieneMenores),
      motivo: motivo || null,
    });
    caso.bitacora.push({
      fecha: new Date().toISOString(),
      evento: 'revision',
      detalle: `${revisor.nombre} (${revisor.perfil}) dictaminó: ${dictamen}${contieneMenores ? ' — advertencia: posibles menores identificables' : ''}`,
    });
    db.guardar();
    return res.json({ id: caso.id, estado: caso.estado, revisiones: caso.revisiones.length });
  }

  if (accion === 'verificar') {
    if (caso.estado !== 'en-verificacion') {
      return res.status(409).json({ error: `transición inválida desde ${caso.estado}` });
    }
    if (caso.revisiones.some((r) => r.contieneMenores)) {
      return res.status(400).json({
        error: 'caso bloqueado',
        motivo: 'regla dura: ningún caso con menores identificables se publica',
      });
    }
    const favorables = caso.revisiones.filter((r) => r.dictamen === 'favorable');
    const nombres = new Set(favorables.map((r) => r.revisor.nombre.toLowerCase()));
    const tienePerfilRequerido = favorables.some((r) => ['ambiental', 'legal'].includes(r.revisor.perfil));
    if (nombres.size < 2 || !tienePerfilRequerido) {
      return res.status(400).json({
        error: 'faltan revisores',
        motivo: `se requieren al menos dos revisores con dictamen favorable y uno con perfil ambiental o legal (actuales: ${nombres.size})`,
      });
    }
    caso.estado = 'verificado';
    caso.publicadoEl = new Date().toISOString();
    caso.bitacora.push({
      fecha: caso.publicadoEl,
      evento: 'verificado',
      detalle: 'Evidencia verificada en autenticidad e integridad. Publicación con leyenda de alcance.',
    });
    db.guardar();
    return res.json({ id: caso.id, estado: caso.estado, leyenda: LEYENDA_PUBLICACION });
  }

  if (accion === 'descartar') {
    if (!motivo) return res.status(400).json({ error: 'el descarte requiere motivo' });
    caso.estado = 'descartado';
    caso.motivoDescarte = motivo;
    caso.bitacora.push({
      fecha: new Date().toISOString(),
      evento: 'descartado',
      detalle: `Descartado con motivo: ${motivo}. La comunidad conserva el derecho de apelación por su canal de contacto.`,
    });
    db.guardar();
    return res.json({ id: caso.id, estado: caso.estado, apelacion: 'La comunidad puede apelar por su canal de contacto.' });
  }

  res.status(400).json({ error: 'acción inválida (en-verificacion | revisar | verificar | descartar)' });
});

casos.post('/:id/retirar', (req, res) => {
  const caso = db.estado.casos.find((c) => c.id === req.params.id);
  if (!caso) return res.status(404).json({ error: 'caso no encontrado' });
  const { contacto, codigoRetiro } = req.body || {};
  const contactoOk = String(contacto || '').trim().toLowerCase() === String(caso.contacto || '').trim().toLowerCase();
  if (!contactoOk || codigoRetiro !== caso.codigoRetiro) {
    return res.status(403).json({ error: 'no se pudo verificar la titularidad del caso (contacto y código de retiro)' });
  }
  const resultado = db.eliminarCaso(caso.id);
  res.json({
    retirado: true,
    borradoEfectivo: true,
    detalle: 'Ficha, evidencias y transcripciones eliminadas del sistema. El caso desaparece, no solo de la vista pública.',
    resultado,
  });
});

casos.get('/:id/evidencias/:hash', requerirRol('verificador', 'admin'), (req, res) => {
  const caso = db.estado.casos.find((c) => c.id === req.params.id);
  if (!caso) return res.status(404).json({ error: 'caso no encontrado' });
  const ev = caso.evidencias.find((e) => e.hash === req.params.hash);
  if (!ev) return res.status(404).json({ error: 'evidencia no encontrada' });
  const ruta = path.join(config.rutaDatos, 'evidencias', path.basename(ev.archivo));
  if (!existsSync(ruta)) return res.status(410).json({ error: 'la evidencia ya no existe en el sistema' });
  res.setHeader('Content-Type', ev.tipoMime || 'application/octet-stream');
  res.send(readFileSync(ruta));
});
