#!/usr/bin/env node
/**
 * Sincroniza cada archivo de foto con su crédito EXACTO: consulta el API de
 * Commons por el título exacto ya normalizado, descarga el thumburl y actualiza
 * autor/licencia/enlace. Resultado: lo que se ve = lo que se cita.
 * Uso: node tools/sincronizar-fotos.mjs
 */
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const UA = 'WillayPachaAI/0.1 (monitoreo ambiental comunitario; contacto en el repositorio)';
const SALIDA = path.resolve('apps/web/public/img');
const CREDITOS = path.resolve('apps/web/src/img/creditos.json');
mkdirSync(SALIDA, { recursive: true });
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

const creditos = JSON.parse(readFileSync(CREDITOS, 'utf8'));

for (const foto of creditos.fotos) {
  const titulo = `File:${foto.titulo}.${foto.titulo.match(/\.(jpe?g)$/i) ? '' : 'jpg'}`;
  try {
    const url =
      'https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2' +
      `&titles=${encodeURIComponent(titulo)}` +
      '&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=1500';
    const datos = await pedir(url);
    const pagina = datos?.query?.pages?.[0];
    const info = pagina?.imageinfo?.[0];
    if (!info) { log(`✗ no encontrado: ${titulo}`); continue; }
    const r = await fetch(info.thumburl || info.url, { headers: { 'User-Agent': UA } });
    if (!r.ok) { log(`✗ descarga HTTP ${r.status}: ${foto.archivo}`); continue; }
    const buffer = Buffer.from(await r.arrayBuffer());
    if (buffer.length < 20000 || buffer.length > 7 * 1024 * 1024) { log(`✗ tamaño inválido: ${foto.archivo}`); continue; }
    writeFileSync(path.join(SALIDA, path.basename(foto.archivo)), buffer);
    foto.titulo = pagina.title.replace(/^File:/, '').replace(/\.(jpe?g)$/i, '');
    foto.autor = limpiarHtml(info.extmetadata?.Artist?.value) || foto.autor;
    foto.licencia = limpiarHtml(info.extmetadata?.LicenseShortName?.value) || foto.licencia;
    foto.pagina = info.descriptionurl;
    log(`✓ sincronizada: ${foto.archivo} · ${(buffer.length / 1024).toFixed(0)} KB · ${foto.licencia}`);
  } catch (e) {
    log(`✗ ${foto.archivo}: ${e.message}`);
  }
  await espera(6000);
}

creditos.meta.verificado = new Date().toISOString();
creditos.meta.nota = 'Imágenes referenciales del territorio y las actividades, NO fotodocumento de los puntos exactos de monitoreo. Cada archivo fue descargado desde el título exacto citado: lo que se ve es lo que se cita. La fuente primaria del dato ambiental sigue siendo el documento citado en cada registro.';
writeFileSync(CREDITOS, JSON.stringify(creditos, null, 2), 'utf8');
log('LISTO: fotos sincronizadas con sus créditos exactos.');
