#!/usr/bin/env node
/** Verificación del tema «Noche andina» (versión 2):
 *  - capturas de Radar, Rimay y Denunciar en tema noche
 *  - contraste AA de los pares de tokens del tema
 *  - persistencia del selector (localStorage) y atributo data-tema
 *  - teselas del mapa del tema (dark_all)
 *  - ausencia de desborde en 1280 y 390
 *  Evidencia: docs/evidencia/tema-noche/
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const raiz = path.resolve(new URL('.', import.meta.url).pathname.replace(/^\/(?=[A-Za-z]:)/, ''), '..');
const salida = path.join(raiz, 'docs', 'evidencia', 'tema-noche');
mkdirSync(salida, { recursive: true });

const esperar = async (url, intentos = 60) => {
  for (let i = 0; i < intentos; i++) {
    try { const r = await fetch(url); if (r.ok) return; } catch { /* aún no */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('no respondió: ' + url);
};

// Contraste WCAG sobre los tokens del tema noche
const hex = (h) => h.replace('#', '').match(/../g).map((x) => parseInt(x, 16));
const lum = ([r, g, b]) => {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => {
  const A = lum(hex(a)); const B = lum(hex(b));
  const [hi, lo] = A > B ? [A, B] : [B, A];
  return ((hi + 0.05) / (lo + 0.05)).toFixed(2);
};
const pares = [
  ['texto/panel', '#eef2f8', '#121823'],
  ['texto-2/panel', '#b9c5d6', '#121823'],
  ['texto-3/panel', '#93a3b8', '#121823'],
  ['texto-4/panel', '#7e8ea4', '#121823'],
  ['acento/panel', '#e8a34a', '#121823'],
  ['rojo/velo', '#f06a5a', '#1b1516'],
  ['ambar/velo', '#e8a33c', '#1a1712'],
  ['verde/velo', '#5cc98a', '#111a15'],
];
const lineas = [];
const log = (t) => { console.log(t); lineas.push(t); };
for (const [n, a, b] of pares) {
  const r = ratio(a, b);
  log(`contraste ${n}: ${r} ${Number(r) >= 4.5 ? '✓ AA' : '✗'}`);
}

const servidor = spawn(process.execPath, ['server/index.js'], { cwd: raiz, stdio: 'ignore' });
const dev = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--config', 'apps/web/vite.config.ts', '--port', '5173', '--strictPort'], { cwd: raiz, stdio: 'ignore' });

try {
  await esperar('http://localhost:8787/api/salud');
  await esperar('http://localhost:5173/');
  const navegador = await chromium.launch();
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(() => localStorage.setItem('wp-tema', 'noche'));
  const p = await ctx.newPage();
  const errores = [];
  p.on('pageerror', (e) => errores.push(String(e)));

  await p.goto('http://localhost:5173/#/', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1400);
  const tema = await p.evaluate(() => document.documentElement.dataset.tema);
  const tiles = await p.evaluate(() => {
    const img = document.querySelector('.leaflet-tile');
    return img ? img.getAttribute('src') : 'sin-tesela';
  });
  log(`data-tema tras recarga: ${tema}`);
  const filtro = await p.evaluate(() => {
    const img = document.querySelector('.leaflet-tile');
    return img ? getComputedStyle(img).filter : 'sin-tesela';
  });
  log(`tesela del mapa: ${tiles.includes('tile.openstreetmap.org') ? 'openstreetmap ✓' : tiles.slice(0, 90)} · filtro noche: ${filtro === 'none' ? '✗ sin filtro' : 'aplicado ✓'}`);
  await p.screenshot({ path: path.join(salida, 'radar-noche.png'), animations: 'disabled' });
  log('captura radar-noche.png');

  await p.goto('http://localhost:5173/#/rimay', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(900);
  await p.screenshot({ path: path.join(salida, 'rimay-noche.png'), animations: 'disabled' });
  log('captura rimay-noche.png');

  await p.goto('http://localhost:5173/#/denunciar', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(900);
  await p.screenshot({ path: path.join(salida, 'denunciar-noche.png'), animations: 'disabled' });
  log('captura denunciar-noche.png');

  // Alternancia en vivo (botón de la cabecera) y persistencia
  await p.goto('http://localhost:5173/#/', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(700);
  await p.getByRole('button', { name: /Cambiar al tema Papel/ }).click();
  await p.waitForTimeout(250);
  const trasClick = await p.evaluate(() => ({
    tema: document.documentElement.dataset.tema,
    guardado: localStorage.getItem('wp-tema'),
  }));
  log(`tras pulsar «Papel»: data-tema=${trasClick.tema} · localStorage=${trasClick.guardado}`);

  const ancho = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: window.innerWidth }));
  log(`desborde escritorio: ${ancho.sw > ancho.vw ? '✗' : '✓'} (${ancho.sw}/${ancho.vw})`);

  const movil = await ctx.newPage();
  await movil.setViewportSize({ width: 390, height: 844 });
  await movil.goto('http://localhost:5173/#/', { waitUntil: 'domcontentloaded' });
  await movil.waitForTimeout(800);
  const m2 = await movil.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: window.innerWidth }));
  log(`desborde móvil: ${m2.sw > m2.vw ? '✗' : '✓'} (${m2.sw}/${m2.vw})`);
  log(`excepciones JS: ${errores.length}`);
  await navegador.close();
} catch (e) {
  log('FALLO: ' + e.message);
} finally {
  servidor.kill();
  dev.kill();
}

writeFileSync(path.join(salida, 'verificacion.txt'), lineas.join('\n') + '\n', 'utf8');
