import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Carga mínima del archivo .env de la raíz (sin dependencias).
 *
 * REGLA DE ACTIVACIÓN: solo se carga al arrancar el servidor real
 * (`node server/index.js`). Las pruebas importan el app en proceso con
 * supertest y deben conservar el modo demo determinista; por eso bajo
 * `node --test` (o cualquier otra importación) el .env NO se toca.
 *
 * Semántica: formato KEY=VALOR por línea, comentarios con #; una variable
 * ya definida en el entorno nunca se sobrescribe. El .env está ignorado
 * por Git (.gitignore) y nunca debe versionarse.
 */

const DIR_SERVIDOR = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(DIR_SERVIDOR, '..');
const ENTRADA_SERVIDOR = path.join(DIR_SERVIDOR, 'index.js');

export function esArranqueDelServidor(argv1 = process.argv[1]) {
  if (!argv1) return false;
  try {
    const actual = path.resolve(argv1);
    // En Windows la comparación ignora mayúsculas (C:\ vs c:\).
    return process.platform === 'win32'
      ? actual.toLowerCase() === ENTRADA_SERVIDOR.toLowerCase()
      : actual === ENTRADA_SERVIDOR;
  } catch {
    return false;
  }
}

function desenvolver(valor) {
  const v = valor.trim();
  if (v.length >= 2 && v.startsWith('"') && v.endsWith('"')) {
    return v.slice(1, -1).replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
  if (v.length >= 2 && v.startsWith("'") && v.endsWith("'")) {
    return v.slice(1, -1);
  }
  return v;
}

/** Parsea contenido .env a un objeto { CLAVE: valor }. */
export function parsearEnv(contenido) {
  const vars = {};
  for (const linea of String(contenido).split('\n')) {
    const t = linea.replace(/\r$/, '').trim();
    if (!t || t.startsWith('#')) continue;
    const cuerpo = t.startsWith('export ') ? t.slice(7).trim() : t;
    const eq = cuerpo.indexOf('=');
    if (eq <= 0) continue;
    const clave = cuerpo.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(clave)) continue;
    vars[clave] = desenvolver(cuerpo.slice(eq + 1));
  }
  return vars;
}

/**
 * Carga el .env de la raíz al entorno del proceso (sin sobrescribir).
 * Devuelve un resumen para registro; nunca lanza si el archivo falta.
 */
export function cargarEnvDeRaiz({ ruta = path.join(RAIZ, '.env'), soloAlArrancar = true } = {}) {
  if (soloAlArrancar && !esArranqueDelServidor()) {
    return { cargado: false, motivo: 'el .env solo se carga al arrancar el servidor (node server/index.js)' };
  }
  if (!existsSync(ruta)) {
    return { cargado: false, motivo: `sin archivo .env en ${ruta}` };
  }
  const parsed = parsearEnv(readFileSync(ruta, 'utf8'));
  const variables = [];
  for (const [clave, valor] of Object.entries(parsed)) {
    if (process.env[clave] === undefined) {
      process.env[clave] = valor;
      variables.push(clave);
    }
  }
  return { cargado: true, ruta, variables };
}
