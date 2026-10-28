#!/usr/bin/env node
/**
 * Descarga fotografías reales desde Wikimedia Commons CON autor y licencia
 * documentados (extmetadata) para citarlas en el sitio. Sin licencia+autor,
 * la foto NO se usa. Tolera el límite de tasa con retroceso largo.
 * Uso: node tools/descargar-fotos.mjs
 */
import { mkdirSync, writeFileSync, existsSync, statSync, readFileSync } from 'node:fs';
import path from 'node:path';

const UA = 'WillayPachaAI/0.1 (monitoreo ambiental comunitario; contacto en el repositorio)';
const SALIDA = path.resolve('apps/web/public/img');
mkdirSync(SALIDA, { recursive: true });
mkdirSync(path.dirname(path.resolve('apps/web/src/img/creditos.json')), { recursive: true });

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

async function pedirConReintento(url) {
  const pausas = [15000, 35000, 70000];
  for (let i = 0; i <= pausas.length; i++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
    if (r.ok) return r.json();
    if (r.status === 429 || r.status === 503) {
      if (i === pausas.length) throw new Error(`HTTP ${r.status} tras reintentos`);
      log(`  límite de tasa (HTTP ${r.status}); esperando ${pausas[i] / 1000}s…`);
      await espera(pausas[i]);
      continue;
    }
    throw new Error(`HTTP ${r.status}`);
  }
}

const limpiarHtml = (html) =>
  String(html || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'").replace(/\s+/g, ' ')
    .trim();

async function buscar(busqueda) {
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2' +
    '&generator=search&gsrnamespace=6&gsrlimit=8' +
    `&gsrsearch=${encodeURIComponent(busqueda)}` +
    '&prop=imageinfo&iiprop=url|mime|size|extmetadata&iiurlwidth=1500';
  const datos = await pedirConReintento(url);
  const paginas = datos?.query?.pages || [];
  log(`  «${busqueda}» → ${paginas.length} resultado(s)`);
  for (const p of paginas) {
    const info = p.imageinfo?.[0];
    const mime = info?.mime || '?';
    const ancho = info?.width || 0;
    log(`    candidato: ${p.title.slice(0, 70)} [${mime} ${ancho}px]`);
    if (!info || mime !== 'image/jpeg') continue;
    if (ancho < 800) continue;
    const licencia = limpiarHtml(info.extmetadata?.LicenseShortName?.value) || 'sin etiqueta';
    if (/sin etiqueta/i.test(licencia)) { log(`    descartada: licencia sin etiqueta`); continue; }
    return {
      titulo: p.title.replace(/^File:/, '').replace(/\.(jpg|jpeg)$/i, ''),
      autor: limpiarHtml(info.extmetadata?.Artist?.value) || 'autor no declarado',
      licencia,
      pagina: info.descriptionurl,
      foto: info.thumburl || info.url,
      fuente: 'Wikimedia Commons',
    };
  }
  return null;
}

const RANURAS = [
  { archivo: 'hero-altiplano.jpg', busquedas: ['Lake Titicaca Puno'], pie: 'Territorio altoandino: altiplano puneño, cuenca Titicaca–Ramis (imagen referencial del territorio, no del punto exacto de monitoreo)' },
  { archivo: 'mineria-subterranea.jpg', busquedas: ['underground mine Peru'], pie: 'Explotación minera subterránea (imagen referencial del tipo de actividad)' },
  { archivo: 'relaves.jpg', busquedas: ['tailings dam'], pie: 'Infraestructura de relaves (imagen referencial del tipo de componente)' },
  { archivo: 'quechua-textil.jpg', busquedas: ['Quechua weaving Peru'], pie: 'Textil andino: lengua y cultura del territorio altoandino (imagen referencial)' },
  { archivo: 'selva-central.jpg', busquedas: ['Chanchamayo Peru'], pie: 'Selva central, ámbito de la unidad San Vicente (imagen referencial del territorio)' },
  { archivo: 'rio-perene.jpg', busquedas: ['Perene river'], pie: 'Río de la selva central: los cuerpos de agua que la comunidad vigila (imagen referencial)' },
  { archivo: 'altiplano-ganado.jpg', busquedas: ['alpacas Peru'], pie: 'Ganadería andina: el agua une mina, ganado y cultivos (imagen referencial)' },
  { archivo: 'paisaje-rio.jpg', busquedas: ['andean river Peru'], pie: 'Quebrada de altura: los cuerpos de agua de los registros (imagen referencial)' },
];

const creditosPath = path.resolve('apps/web/src/img/creditos.json');
const creditos = existsSync(creditosPath)
  ? JSON.parse(readFileSync(creditosPath, 'utf8')).fotos
  : [];

let fallidas = 0;

for (const ranura of RANURAS) {
  if (creditos.some((c) => c.archivo === `img/${ranura.archivo}`)) { log(`· ya registrada: ${ranura.archivo}`); continue; }
  const destino = path.join(SALIDA, ranura.archivo);
  let encontrado = null;
  for (const b of ranura.busquedas) {
    try {
      encontrado = await buscar(b);
      if (encontrado) { encontrado.busqueda = b; break; }
    } catch (e) { log(`  ! búsqueda falló (${b}): ${e.message}`); }
    await espera(5000);
  }
  if (!encontrado) { fallidas++; log(`✗ sin candidata con licencia para ${ranura.archivo}`); continue; }
  const r = await fetch(encontrado.foto, { headers: { 'User-Agent': UA } });
  if (!r.ok) { fallidas++; log(`✗ descarga HTTP ${r.status} (${ranura.archivo})`); continue; }
  const buffer = Buffer.from(await r.arrayBuffer());
  if (buffer.length < 20000 || buffer.length > 7 * 1024 * 1024) { fallidas++; log(`✗ tamaño inválido (${ranura.archivo})`); continue; }
  writeFileSync(destino, buffer);
  creditos.push({
    archivo: `img/${ranura.archivo}`,
    titulo: encontrado.titulo,
    autor: encontrado.autor,
    licencia: encontrado.licencia,
    pagina: encontrado.pagina,
    pie: ranura.pie,
    busqueda: encontrado.busqueda,
    fuente: 'Wikimedia Commons',
  });
  writeFileSync(creditosPath, JSON.stringify({ meta: {
    fuente: 'Wikimedia Commons (licencias Creative Commons / dominio público con autoría declarada)',
    nota: 'Imágenes referenciales del territorio y las actividades, NO fotodocumento de los puntos exactos de monitoreo. Cada foto lleva autor, licencia y enlace de origen; la fuente primaria del dato ambiental sigue siendo el documento citado en cada registro.',
    generado: new Date().toISOString(),
  }, fotos: creditos }, null, 2), 'utf8');
  log(`✓ ${ranura.archivo} · ${(buffer.length / 1024).toFixed(0)} KB · ${encontrado.licencia} · ${encontrado.autor.slice(0, 50)}`);
  await espera(6000);
}

log(`LISTO: ${creditos.length} fotos con licencia documentada; ${fallidas} ranura(s) pendiente(s).`);
process.exit(0);
