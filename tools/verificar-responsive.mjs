#!/usr/bin/env node
/** FASE 2 · Matriz responsive: 5 anchos × 7 vistas. Mide desbordes horizontales
 *  y excepciones JS. Evidencia: docs/evidencia/fase-2/responsive.txt
 *  Uso: node tools/verificar-responsive.mjs */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const raiz = path.resolve(path.dirname(fileURLToPathFix()), '..');
function fileURLToPathFix() { return new URL(import.meta.url).pathname.replace(/^\/(?=[A-Za-z]:)/, ''); }

const salida = path.join(raiz, 'docs', 'evidencia', 'fase-2');
mkdirSync(salida, { recursive: true });

const VISTAS = [['/', 'radar'], ['/rimay', 'rimay'], ['/evidencia', 'evidencia'], ['/documentos', 'documentos'], ['/casos', 'casos'], ['/denunciar', 'denunciar'], ['/legal/privacidad', 'legal']];
const ANCHOS = [320, 390, 768, 1024, 1440];

const esperar = async (url, intentos = 60) => {
  for (let i = 0; i < intentos; i++) {
    try { const r = await fetch(url); if (r.ok) return; } catch { /* aún no */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('no respondió: ' + url);
};

const servidor = spawn(process.execPath, ['server/index.js'], { cwd: raiz, stdio: 'ignore' });
const dev = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--config', 'apps/web/vite.config.ts', '--port', '5173', '--strictPort'], { cwd: raiz, stdio: 'ignore' });

const lineas = [];
let fallos = 0;
const log = (t) => { console.log(t); lineas.push(t); };

try {
  await esperar('http://localhost:8787/api/salud');
  await esperar('http://localhost:5173/');
  const navegador = await chromium.launch();
  for (const ancho of ANCHOS) {
    const contexto = await navegador.newContext({ viewport: { width: ancho, height: 900 } });
    const pagina = await contexto.newPage();
    const errores = [];
    pagina.on('pageerror', (e) => errores.push(String(e)));
    for (const [ruta, nombre] of VISTAS) {
      await pagina.goto(`http://localhost:5173/#${ruta}`, { waitUntil: 'domcontentloaded' });
      await pagina.waitForTimeout(700);
      const m = await pagina.evaluate(() => {
        const d = document.documentElement;
        const fuera = [];
        for (const el of document.querySelectorAll('body *')) {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.right > window.innerWidth + 1 && !el.closest('.tabla-envoltura') && !el.closest('.leaflet-container') && !el.closest('.mapa')) {
            fuera.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)}@${Math.round(r.right)}`);
          }
        }
        return { overflow: d.scrollWidth > window.innerWidth + 1, scrollW: d.scrollWidth, fuera: fuera.slice(0, 3) };
      });
      if (m.overflow || errores.length) fallos++;
      log(`${ancho}px ${nombre}: ${m.overflow ? `✗ DESBORDE scrollW=${m.scrollW} [${m.fuera.join(', ')}]` : '✓'}${errores.length ? ` · ✗ excepciones: ${errores.join(' | ')}` : ''}`);
    }
    await contexto.close();
  }
  await navegador.close();
} catch (e) {
  fallos++;
  log('FALLO: ' + e.message);
} finally {
  servidor.kill();
  dev.kill();
}

writeFileSync(path.join(salida, 'responsive.txt'), lineas.join('\n') + '\n', 'utf8');
log(fallos === 0 ? 'LISTO: sin desbordes ni excepciones en toda la matriz.' : `LISTO CON INCIDENCIAS: ${fallos}`);
process.exit(fallos === 0 ? 0 : 1);
