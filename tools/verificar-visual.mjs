#!/usr/bin/env node
/**
 * Verificación visual REAL de la interfaz con Chromium (Playwright).
 * Cubre exactamente el fallo reportado por el usuario («sale en blanco»):
 *  1) la app servida por el servidor de desarrollo (con API) renderiza y responde;
 *  2) el archivo ÚNICO (standalone) renderiza bajo file:// con doble clic.
 * Evidencia: capturas en docs/evidencia/ y reporte de texto.
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidencia = path.join(raiz, 'docs', 'evidencia');
mkdirSync(evidencia, { recursive: true });

const lineas = [];
function nota(t) {
  console.log(t);
  lineas.push(t);
}

async function esperarHttp(url, intentos = 60) {
  for (let i = 0; i < intentos; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {
      /* aún no arriba */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`no respondió: ${url}`);
}

// --- Levantar backend (8787) y servidor de desarrollo con proxy (5173) ---
const servidor = spawn(process.execPath, ['server/index.js'], { cwd: raiz, stdio: 'ignore' });
const dev = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--config', 'apps/web/vite.config.ts', '--port', '5173', '--strictPort'], {
  cwd: raiz,
  stdio: 'ignore',
});

let exito = true;
const erroresDePagina = [];

try {
  await esperarHttp('http://localhost:8787/api/salud');
  await esperarHttp('http://localhost:5173/');
  nota('✓ Backend (8787) y frontend de desarrollo (5173) arriba');

  const navegador = await chromium.launch();
  const pagina = await navegador.newPage({ viewport: { width: 1280, height: 900 } });
  pagina.on('pageerror', (e) => erroresDePagina.push(String(e)));
  const capturar = (ruta) => pagina.screenshot({ path: ruta, animations: 'disabled' });

  const ir = async (hash) => {
    await pagina.goto(`http://localhost:5173/#${hash}`, { waitUntil: 'domcontentloaded' });
  };

  // 1) Radar
  await ir('/');
  await pagina.getByText('Lo que dice la fuente oficial').first().waitFor({ timeout: 15000 });
  await pagina.waitForTimeout(1200); // mapa/tiles
  await capturar(path.join(evidencia, '01-radar.png'));
  nota('✓ Módulo A (Radar) renderiza — captura docs/evidencia/01-radar.png');

  // 2) Rimay con respuesta real del API a través del proxy
  await ir('/rimay');
  await pagina.getByText('Soy una inteligencia artificial').first().waitFor({ timeout: 15000 });
  await pagina.getByRole('button', { name: /Chogñacota/ }).first().click();
  await pagina.getByText('Según OEFA').first().waitFor({ timeout: 15000 });
  await capturar(path.join(evidencia, '02-rimay.png'));
  nota('✓ Módulo B (Rimay) renderiza y responde con cita de OEFA vía /api/explicar — 02-rimay.png');

  // 3) Evidencia
  await ir('/evidencia');
  await pagina.getByText('El celular como instrumento').first().waitFor({ timeout: 15000 });
  nota('✓ Módulo C (Evidencia) renderiza');

  // 4) Documentos: crear un borrador real desde la interfaz
  await ir('/documentos');
  await pagina.getByText('Generar un documento borrador').first().waitFor({ timeout: 15000 });
  await pagina.getByRole('button', { name: /Generar borrador PDF/ }).click();
  await pagina.getByText(/DOC-\d+ generado/).first().waitFor({ timeout: 15000 });
  await capturar(path.join(evidencia, '03-documentos.png'));
  nota('✓ Módulo D (Documentos): borrador creado desde la interfaz con Registro de Generación — 03-documentos.png');

  // 5) Casos
  await ir('/casos');
  await pagina.getByText('Ningún caso se publica directo').first().waitFor({ timeout: 15000 });
  nota('✓ Módulo E (Casos) renderiza');

  // 6) Legal
  await ir('/legal/privacidad');
  await pagina.getByText('Política de Privacidad').first().waitFor({ timeout: 15000 });
  await pagina.getByText('Autoridad Nacional de Protección de Datos Personales').first().waitFor({ timeout: 15000 });
  nota('✓ Páginas legales renderizan con contenido real');

  // 6) Guía de denuncia
  await ir('/denunciar');
  await pagina.getByText('Si el territorio está pidiendo ayuda, esta es la ruta').first().waitFor({ timeout: 15000 });
  await pagina.getByText('Documentación que habitualmente se pide').first().waitFor({ timeout: 15000 });
  await pagina.screenshot({ path: path.join(evidencia, '06-denunciar.png'), animations: 'disabled' });
  nota('✓ Guía de denuncia renderiza con la ruta completa — 06-denunciar.png');
  await pagina.getByText('El color, olor o espuma del agua cambió y se repite en el tiempo.').click();
  await pagina.getByText('Han muerto peces o plantas acuáticas de forma inusual.').click();
  await pagina.getByText('Hoja de ruta sugerida').first().waitFor({ timeout: 15000 });
  await pagina.getByText('Autoridades sugeridas, en este orden').first().waitFor({ timeout: 15000 });
  await pagina.screenshot({ path: path.join(evidencia, '06b-hoja-de-ruta.png'), animations: 'disabled' });
  nota('✓ Evaluador genera hoja de ruta imprimible — 06b-hoja-de-ruta.png');
  await pagina.getByText('Directorio de autoridades').first().scrollIntoViewIfNeeded();
  await pagina.waitForTimeout(400);
  await pagina.screenshot({ path: path.join(evidencia, '07-directorio.png'), animations: 'disabled' });
  nota('✓ Directorio de autoridades con redes verificadas — 07-directorio.png');

  // 7) Créditos de imágenes
  await ir('/creditos');
  await pagina.getByText('Cada fotografía, con su autor y su licencia').first().waitFor({ timeout: 15000 });
  await pagina.getByText('Wikimedia Commons').first().waitFor({ timeout: 15000 });
  await pagina.screenshot({ path: path.join(evidencia, '05-creditos.png'), animations: 'disabled' });
  nota('✓ Página de créditos de imágenes renderiza — 05-creditos.png');

  // 7) Archivo único bajo file:// (doble clic del usuario)
  await pagina.goto('file:///' + path.join(raiz, 'apps', 'web', 'standalone', 'index.html').replace(/\\/g, '/'), { waitUntil: 'domcontentloaded' });
  await pagina.getByText('Lo que dice la fuente oficial').first().waitFor({ timeout: 15000 });
  await pagina.screenshot({ path: path.join(evidencia, '04-standalone-doble-clic.png'), animations: 'disabled' });
  nota('✓ Archivo ÚNICO abierto con file:// (doble clic) renderiza — 04-standalone-doble-clic.png');

  await navegador.close();

  if (erroresDePagina.length > 0) {
    exito = false;
    nota(`✗ Excepciones JS sin capturar en la página: ${erroresDePagina.join(' | ')}`);
  } else {
    nota('✓ Sin excepciones JS sin capturar en ninguna página visitada');
  }
} catch (error) {
  exito = false;
  nota(`✗ FALLO: ${error.message}`);
} finally {
  servidor.kill();
  dev.kill();
}

writeFileSync(path.join(evidencia, 'verificacion-visual.txt'), lineas.join('\n') + '\n', 'utf8');
process.exit(exito ? 0 : 1);
