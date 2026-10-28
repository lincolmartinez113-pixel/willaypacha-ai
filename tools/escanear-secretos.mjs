#!/usr/bin/env node
/** Escaneo de secretos sobre el árbol del repositorio (excluye node_modules).
 *  Uso: node tools/escanear-secretos.mjs  → exit 1 si encuentra algo. */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const raiz = process.cwd();
const EXCLUIR = new Set(['node_modules', '.git', 'dist']);
const PATRONES = [
  [/api[_-]?key\s*[=:]\s*['"][A-Za-z0-9_\-]{12,}['"]/i, 'clave de API embebida'],
  [/sk-[A-Za-z0-9]{20,}/, 'token tipo sk-'],
  [/Bearer\s+[A-Za-z0-9_\-\.]{20,}/, 'token Bearer embebido'],
  [/EAAC\w{30,}/, 'token de Facebook embebido'],
  [/ghp_[A-Za-z0-9]{30,}/, 'token de GitHub embebido'],
];

let hallados = 0;
function recorrer(dir) {
  for (const nombre of readdirSync(dir)) {
    const ruta = path.join(dir, nombre);
    if (EXCLUIR.has(nombre)) continue;
    const st = statSync(ruta);
    if (st.isDirectory()) {
      recorrer(ruta);
      continue;
    }
    if (!/\.(js|mjs|ts|tsx|json|md|yml|yaml|html|css|example)$/.test(nombre)) continue;
    const contenido = readFileSync(ruta, 'utf8');
    for (const [patron, tipo] of PATRONES) {
      const m = contenido.match(patron);
      if (m) {
        hallados++;
        console.error(`  ✗ ${path.relative(raiz, ruta)}: ${tipo} → ${m[0].slice(0, 24)}…`);
      }
    }
  }
}

recorrer(raiz);
if (hallados > 0) {
  console.error(`✗ Escaneo de secretos: ${hallados} hallazgo(s).`);
  process.exit(1);
}
console.log('✓ Escaneo de secretos: sin hallazgos en todo el árbol (node_modules y dist excluidos).');
