import { db } from '../db.js';
import { rmSync } from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';

export { db };

export function auth(rol = 'verificador') {
  const clave = rol === 'admin' ? config.claves.admin : config.claves.verificador;
  return { 'x-demo-rol': rol, 'x-demo-clave': clave };
}

export function limpiarTodo() {
  db.reiniciar();
  rmSync(path.join(config.rutaDatos, 'evidencias'), { recursive: true, force: true });
  rmSync(path.join(config.rutaDatos, 'documentos'), { recursive: true, force: true });
}
