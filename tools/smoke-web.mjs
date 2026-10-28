// Verificación HTTP de la app construida (vite preview) + API del backend.
const base = 'http://localhost:4173';

const r = await fetch(base + '/');
const html = await r.text();
console.log('index:', r.status, '· tiene raiz:', html.includes('id="raiz"'), '· manifest:', html.includes('manifest.webmanifest'));

const js = html.match(/assets\/index-[\w-]+\.js/)[0];
const css = html.match(/assets\/index-[\w-]+\.css/)[0];
const rjs = await fetch(base + '/' + js);
const rcss = await fetch(base + '/' + css);
const texto = await rjs.text();
console.log('js:', rjs.status, `${texto.length}B`, '· css:', rcss.status);

for (const clave of [
  'Radar de Transparencia',
  'Asistente de voz',
  'Laboratorio de Evidencia',
  'Generador legal',
  'Casos de la comunidad',
  'Política de Privacidad',
  'Lámina de Apoyo Visual',
  'borrador — pendiente de validación',
  'yaku',
  'Una medida preventiva no es una sanción',
]) {
  console.log('bundle contiene', JSON.stringify(clave), ':', texto.includes(clave));
}

const icono = await fetch(base + '/iconos/icono-192.png');
console.log('icono:', icono.status, icono.headers.get('content-type'));
const man = await fetch(base + '/manifest.webmanifest');
console.log('manifest:', man.status);
const sw = await fetch(base + '/sw.js');
console.log('sw.js:', sw.status);

// API en vivo (servidor 8787)
const salud = await fetch('http://127.0.0.1:8787/api/salud');
const sj = await salud.json();
console.log('api salud:', salud.status, '· modo:', sj.modo, '· segmentacion:', sj.segmentacion.motorActivo);
process.exit(0);
