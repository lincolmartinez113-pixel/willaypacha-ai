#!/usr/bin/env node
/** FASE 2 · Verificación de punta a punta de la lámina exportable:
 *  carga la foto-fixture con EXIF, delimita el área, exporta el PNG y guarda
 *  la evidencia en docs/evidencia/fase-2/lamina-exportada.png
 *  Uso: node tools/verificar-lamina.mjs */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const raiz = path.resolve(new URL('.', import.meta.url).pathname.replace(/^\/(?=[A-Za-z]:)/, ''), '..');
const salida = path.join(raiz, 'docs', 'evidencia', 'fase-2');
mkdirSync(salida, { recursive: true });
const fixture = path.join(raiz, 'tools', 'fijacion-exif.jpg');
if (!existsSync(fixture)) {
  console.error('✗ falta la fixture: ejecutar antes python tools/crear-fijacion-exif.py');
  process.exit(1);
}

const esperar = async (url, intentos = 60) => {
  for (let i = 0; i < intentos; i++) {
    try { const r = await fetch(url); if (r.ok) return; } catch { /* aún no */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('no respondió: ' + url);
};

const servidor = spawn(process.execPath, ['server/index.js'], { cwd: raiz, stdio: 'ignore' });
const dev = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--config', 'apps/web/vite.config.ts', '--port', '5173', '--strictPort'], { cwd: raiz, stdio: 'ignore' });

let fallo = null;
try {
  await esperar('http://localhost:8787/api/salud');
  await esperar('http://localhost:5173/');
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage({ viewport: { width: 1280, height: 900 } });
  await pagina.goto('http://localhost:5173/#/evidencia', { waitUntil: 'domcontentloaded' });
  await pagina.getByText('El celular como instrumento').first().waitFor({ timeout: 20000 });
  await pagina.setInputFiles('input[type="file"]', fixture);
  await pagina.getByText(/sha256 · [a-f0-9]{20}/).first().waitFor({ timeout: 15000 });
  await pagina.getByRole('button', { name: /Delimitar área visual anómala/ }).click();
  await pagina.getByText(/Área visual anómala:|Superposición/).first().waitFor({ timeout: 15000 });

  const [descarga] = await Promise.all([
    pagina.waitForEvent('download', { timeout: 15000 }),
    pagina.getByRole('button', { name: /Exportar Lámina de Apoyo Visual/ }).click(),
  ]);
  const destino = path.join(salida, 'lamina-exportada.png');
  await descarga.saveAs(destino);
  const kb = (statSync(destino).size / 1024).toFixed(0);
  console.log(`✓ lámina exportada: ${destino} (${kb} KB)`);
  writeFileSync(path.join(salida, 'lamina-verificacion.txt'),
    `Lámina exportable verificada el ${new Date().toISOString()}\n` +
    `Fixture: tools/fijacion-exif.jpg (EXIF GPS S 14°45′ W 70°34′48″)\n` +
    `Archivo resultante: ${destino} (${kb} KB)\n` +
    `Paleta: tokens cálidos (--panel/--acento/--texto*) vía src/tema.ts\n`, 'utf8');
  await navegador.close();
} catch (e) {
  fallo = e.message;
  console.error('✗ FALLO: ' + fallo);
  writeFileSync(path.join(salida, 'lamina-verificacion.txt'), `FALLO: ${fallo}\n`, 'utf8');
} finally {
  servidor.kill();
  dev.kill();
}
process.exit(fallo ? 1 : 0);
