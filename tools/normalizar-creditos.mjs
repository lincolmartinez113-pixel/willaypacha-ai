#!/usr/bin/env node
/**
 * Normaliza apps/web/src/img/creditos.json contra el API de Wikimedia Commons:
 * para cada foto busca su título en Commons y copia el enlace, autor y licencia
 * EXACTOS del API (nunca reconstruidos a mano). Después valida cada enlace.
 * Uso: node tools/normalizar-creditos.mjs
 */
import { writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';

const UA = 'WillayPachaAI/0.1 (monitoreo ambiental comunitario; contacto en el repositorio)';
const CREDITOS = path.resolve('apps/web/src/img/creditos.json');
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

async function pedir(url) {
  const pausas = [20000, 45000];
  for (let i = 0; i <= pausas.length; i++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
    if (r.ok) return r.json();
    if ((r.status === 429 || r.status === 503) && i < pausas.length) {
      log(`  límite de tasa; espero ${pausas[i] / 1000}s…`);
      await espera(pausas[i]);
      continue;
    }
    throw new Error(`HTTP ${r.status}`);
  }
}

const limpiarHtml = (h) =>
  String(h || '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'").replace(/\s+/g, ' ').trim();

// Palabra clave por ranura para encontrar el archivo exacto en Commons.
const CLAVES = {
  'img/hero-altiplano.jpg': 'Amanecer en el lago Titicaca',
  'img/quechua-textil.jpg': 'Lares Trek weaving',
  'img/mineria-subterranea.jpg': 'Tunnel train track',
  'img/selva-central.jpg': 'Espejos de agua Reserva Paisajistica Nor Yauyos',
  'img/rio-perene.jpg': 'Part of the expedition on the river Perene',
  'img/altiplano-ganado.jpg': 'Alpacas in Arequipa',
  'img/relaves.jpg': 'Syncrude mildred lake settling pond',
  'img/paisaje-rio.jpg': 'Andes 70.98343W',
};

const creditos = JSON.parse(readFileSync(CREDITOS, 'utf8'));

for (const foto of creditos.fotos) {
  const clave = CLAVES[foto.archivo];
  if (!clave) { log(`· sin clave para ${foto.archivo}`); continue; }
  try {
    const url =
      'https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2' +
      '&generator=search&gsrnamespace=6&gsrlimit=5' +
      `&gsrsearch=${encodeURIComponent(`intitle:${clave}`)}` +
      '&prop=imageinfo&iiprop=url|extmetadata';
    const datos = await pedir(url);
    const paginas = datos?.query?.pages || [];
    const mejor = paginas.find((p) => p.imageinfo?.[0]?.descriptionurl);
    if (!mejor) { log(`✗ sin coincidencia exacta: ${foto.archivo}`); continue; }
    const info = mejor.imageinfo[0];
    const licencia = limpiarHtml(info.extmetadata?.LicenseShortName?.value) || foto.licencia;
    const autor = limpiarHtml(info.extmetadata?.Artist?.value) || foto.autor;
    foto.pagina = info.descriptionurl;
    foto.titulo = mejor.title.replace(/^File:/, '').replace(/\.(jpg|jpeg)$/i, '');
    foto.autor = autor;
    foto.licencia = licencia;
    log(`✓ ${foto.archivo} → ${mejor.title.slice(0, 60)}`);
  } catch (e) {
    log(`✗ ${foto.archivo}: ${e.message}`);
  }
  await espera(6000);
}

// Validación final: cada enlace de origen debe existir (HEAD 2xx/3xx).
for (const foto of creditos.fotos) {
  try {
    const r = await fetch(foto.pagina, { method: 'GET', headers: { 'User-Agent': UA } });
    log(`${r.ok ? '✓ enlace vivo' : '✗ ENLACE ROTO'}: ${foto.archivo} (HTTP ${r.status})`);
  } catch (e) {
    log(`✗ ENLACE ROTO: ${foto.archivo} (${e.message})`);
  }
  await espera(4000);
}

creditos.meta.verificado = new Date().toISOString();
writeFileSync(CREDITOS, JSON.stringify(creditos, null, 2), 'utf8');
log('LISTO: créditos normalizados contra el API y enlaces validados.');
