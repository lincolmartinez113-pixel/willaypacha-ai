import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirPrompts = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'prompts');

/** Carga los prompts P1–P6 con su versión (hash del contenido). */
export function cargarPrompts() {
  const prompts = {};
  for (const archivo of readdirSync(dirPrompts).filter((a) => a.endsWith('.md')).sort()) {
    const contenido = readFileSync(path.join(dirPrompts, archivo), 'utf8');
    const hash = createHash('sha256').update(contenido).digest('hex').slice(0, 8);
    prompts[archivo.replace('.md', '')] = { nombre: archivo, contenido, version: `v1-${hash}` };
  }
  return prompts;
}

export function versionPrompt(nombre) {
  const p = cargarPrompts()[nombre];
  return p ? p.version : 'desconocida';
}
