import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, rmSync } from 'node:fs';
import path from 'node:path';
import { config } from './config.js';

const archivoDb = path.join(config.rutaDatos, 'db.json');

function estadoInicial() {
  return {
    documentos: [],
    casos: [],
    rectificaciones: [],
    solicitudesArco: [],
    bitacoraRegistros: [],
    eventos: [],
    secuencia: { documentos: 0, casos: 0, rectificaciones: 0, solicitudesArco: 0, arco: 0 },
  };
}

function cargar() {
  mkdirSync(config.rutaDatos, { recursive: true });
  if (existsSync(archivoDb)) {
    try {
      return { ...estadoInicial(), ...JSON.parse(readFileSync(archivoDb, 'utf8')) };
    } catch {
      // Estado dañado: no se sobrescribe en silencio; se reporta.
      throw new Error(`db.json dañado: revisar ${archivoDb} antes de continuar`);
    }
  }
  return estadoInicial();
}

let estado = cargar();

function guardar() {
  // Escritura atómica con reintento: en Windows el renombrado puede chocar con
  // EPERM si otro proceso tiene el archivo abierto un instante.
  const tmp = `${archivoDb}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(estado, null, 2), 'utf8');
  for (let intento = 0; intento < 6; intento++) {
    try {
      renameSync(tmp, archivoDb);
      return;
    } catch (error) {
      if (intento === 5) {
        // Último recurso: escritura directa (no atómica) para no perder el estado.
        writeFileSync(archivoDb, JSON.stringify(estado, null, 2), 'utf8');
        try {
          rmSync(tmp, { force: true });
        } catch {
          /* el temporal se limpia en la siguiente escritura */
        }
        return;
      }
      const espera = 30 * (intento + 1);
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, espera);
    }
  }
}

export const db = {
  get estado() {
    return estado;
  },

  siguienteId(prefijo, coleccion) {
    estado.secuencia[coleccion] += 1;
    return `${prefijo}-${String(estado.secuencia[coleccion]).padStart(4, '0')}`;
  },

  guardar() {
    guardar();
  },

  evento(detalle) {
    estado.eventos.push({ fecha: new Date().toISOString(), detalle });
    guardar();
  },

  /** Bitácora pública de cambios por registro (capa de rectificación y simetría). */
  registrarCambioRegistro(registroId, cambio, documento) {
    estado.bitacoraRegistros.push({ registroId, cambio, documento, fecha: new Date().toISOString() });
    guardar();
  },

  bitacoraRegistro(registroId) {
    return estado.bitacoraRegistros.filter((b) => b.registroId === registroId);
  },

  /** Borrado efectivo (derecho de cancelación / retiro de caso). */
  eliminarCaso(casoId) {
    const caso = estado.casos.find((c) => c.id === casoId);
    if (!caso) return null;
    for (const ev of caso.evidencias || []) {
      const ruta = path.join(config.rutaDatos, 'evidencias', path.basename(ev.archivo));
      if (existsSync(ruta)) rmSync(ruta, { force: true });
    }
    // El retiro desaparece del sistema, no solo de la vista pública:
    // se elimina la ficha completa y se deja solo un evento anónimo sin datos.
    estado.casos = estado.casos.filter((c) => c.id !== casoId);
    estado.eventos.push({ fecha: new Date().toISOString(), detalle: 'caso retirado — borrado efectivo de ficha, evidencias y transcripciones (sin datos personales en este registro)' });
    guardar();
    return { eliminado: casoId };
  },

  /** Prueba ARCO: eliminar todo dato vinculado a un identificador de contacto. */
  eliminarPorIdentificador(identificador) {
    const norm = String(identificador).trim().toLowerCase();
    const afectados = estado.casos.filter((c) => String(c.contacto || '').toLowerCase() === norm);
    for (const c of [...afectados]) db.eliminarCaso(c.id);
    estado.solicitudesArco = estado.solicitudesArco.filter(
      (s) => String(s.identificador || '').toLowerCase() !== norm,
    );
    estado.rectificaciones = estado.rectificaciones.filter(
      (r) => String(r.contacto || '').toLowerCase() !== norm,
    );
    guardar();
    return afectados.map((c) => c.id);
  },

  /** Solo para pruebas: estado limpio. */
  reiniciar() {
    estado = estadoInicial();
    guardar();
  },
};
