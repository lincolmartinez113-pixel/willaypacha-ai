#!/usr/bin/env node
/**
 * Completa las ranuras de fotografía faltantes desde Wikimedia Commons CON
 * autor y licencia documentados. No borra archivos: descarta en memoria las
 * fotos cuyo tema no corresponde y escribe créditos solo con las válidas.
 * Uso: node tools/completar-fotos.mjs
 */
import { mkdirSync, writeFileSync, existsSync, statSync, readFileSync } from 'node:fs';
import path from 'node:path';

const UA = 'WillayPachaAI/0.1 (monitoreo ambiental comunitario; contacto en el repositorio)';
const SALIDA = path.resolve('apps/web/public/img');
const CREDITOS = path.resolve('apps/web/src/img/creditos.json');
mkdirSync(SALIDA, { recursive: true });

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

// Fotos descartadas por tema (se conservan en disco pero no se usan ni se citan).
const DESCARTADAS = new Set(['img/selva-central.jpg', 'img/paisaje-rio.jpg']);

function creditosActuales() {
  if (!existsSync(CREDITOS)) return [];
  const c = JSON.parse(readFileSync(CREDITOS, 'utf8'));
  return (c.fotos || []).filter((f) => !DESCARTADAS.has(f.archivo));
}

async function pedir(url) {
  const pausas = [20000, 45000];
  for (let i = 0; i <= pausas.length; i++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
    if (r.ok) return r.json();
    if ((r.status === 429 || r.status === 503) && i < pausas.length) {
      log(`  límite de tasa (HTTP ${r.status}); espero ${pausas[i] / 1000}s…`);
      await espera(pausas[i]);
      continue;
    }
    throw new Error(`HTTP ${r.status}`);
  }
}

const limpiarHtml = (h) =>
  String(h || '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'").replace(/\s+/g, ' ').trim();

// Rechazos por título: evita sellos, polillas, mapas y diagramas.
const TITULO_PROHIBIDO = /stamp|sellos|postage|moth|polilla|map|mapa|diagram|logo|escudo|coat of arms|banknote|billete/i;

async function buscar(busqueda) {
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2' +
    '&generator=search&gsrnamespace=6&gsrlimit=10' +
    `&gsrsearch=${encodeURIComponent(busqueda)}` +
    '&prop=imageinfo&iiprop=url|mime|size|extmetadata&iiurlwidth=1500';
  const datos = await pedir(url);
  const paginas = datos?.query?.pages || [];
  log(`  «${busqueda}» → ${paginas.length} resultado(s)`);
  for (const p of paginas) {
    const info = p.imageinfo?.[0];
    if (!info || info.mime !== 'image/jpeg') continue;
    if ((info.width || 0) < 900) continue;
    if (TITULO_PROHIBIDO.test(p.title)) { log(`    descartada por título: ${p.title.slice(0, 60)}`); continue; }
    const licencia = limpiarHtml(info.extmetadata?.LicenseShortName?.value) || 'sin etiqueta';
    if (/sin etiqueta/i.test(licencia)) continue;
    return {
      titulo: p.title.replace(/^File:/, '').replace(/\.(jpg|jpeg)$/i, ''),
      autor: limpiarHtml(info.extmetadata?.Artist?.value) || 'autor no declarado',
      licencia,
      pagina: info.descriptionurl,
      foto: info.thumburl || info.url,
    };
  }
  return null;
}

const RANURAS = [
  { archivo: 'mineria-subterranea.jpg', busquedas: ['underground mining tunnel', 'mine tunnel timber', 'mining gallery'], pie: 'Labor minera subterránea (imagen referencial del tipo de actividad, no de la unidad)' },
  { archivo: 'selva-central.jpg', busquedas: ['Perene river valley', 'Junin region landscape', 'Oxapampa valley'], pie: 'Selva central, ámbito de la unidad San Vicente (imagen referencial del territorio)' },
  { archivo: 'paisaje-rio.jpg', busquedas: ['Andes river valley', 'Mantaro river', 'Andean canyon river'], pie: 'Quebrada de altura: los cuerpos de agua de los registros (imagen referencial)' },
];

let creditos = creditosActuales();

for (const ranura of RANURAS) {
  if (creditos.some((c) => c.archivo === `img/${ranura.archivo}`)) { log(`· ya registrada: ${ranura.archivo}`); continue; }
  let encontrado = null;
  for (const b of ranura.busquedas) {
    try {
      encontrado = await buscar(b);
      if (encontrado) { encontrado.busqueda = b; break; }
    } catch (e) { log(`  ! búsqueda falló (${b}): ${e.message}`); }
    await espera(6000);
  }
  if (!encontrado) { log(`✗ sin candidata para ${ranura.archivo}`); continue; }
  const r = await fetch(encontrado.foto, { headers: { 'User-Agent': UA } });
  if (!r.ok) { log(`✗ descarga HTTP ${r.status} (${ranura.archivo})`); continue; }
  const buffer = Buffer.from(await r.arrayBuffer());
  if (buffer.length < 20000 || buffer.length > 7 * 1024 * 1024) { log(`✗ tamaño inválido (${ranura.archivo})`); continue; }
  writeFileSync(path.join(SALIDA, ranura.archivo), buffer);
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
  writeFileSync(CREDITOS, JSON.stringify({ meta: {
    fuente: 'Wikimedia Commons (licencias Creative Commons / dominio público con autoría declarada)',
    nota: 'Imágenes referenciales del territorio y las actividades, NO fotodocumento de los puntos exactos de monitoreo. Cada foto lleva autor, licencia y enlace de origen; la fuente primaria del dato ambiental sigue siendo el documento citado en cada registro.',
    generado: new Date().toISOString(),
  }, fotos: creditos }, null, 2), 'utf8');
  log(`✓ ${ranura.archivo} · ${(buffer.length / 1024).toFixed(0)} KB · ${encontrado.licencia} · ${encontrado.autor.slice(0, 50)}`);
  await espera(7000);
}

writeFileSync(CREDITOS, JSON.stringify({ meta: {
  fuente: 'Wikimedia Commons (licencias Creative Commons / dominio público con autoría declarada)',
  nota: 'Imágenes referenciales del territorio y las actividades, NO fotodocumento de los puntos exactos de monitoreo. Cada foto lleva autor, licencia y enlace de origen; la fuente primaria del dato ambiental sigue siendo el documento citado en cada registro.',
  generado: new Date().toISOString(),
}, fotos: creditos }, null, 2), 'utf8');

log(`LISTO: ${creditos.length} fotos citadas.`);
