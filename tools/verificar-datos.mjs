#!/usr/bin/env node
/**
 * Verificador automático de datos (CI: verificar-datos.yml).
 * Hace FALLAR la construcción si a algún registro visible le falta
 * fuente, fecha, cita, semáforo, confianza o fecha de consulta;
 * y si los valores LMP no coinciden dígito a dígito con la tabla oficial.
 * Uso: node tools/verificar-datos.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const datos = JSON.parse(readFileSync(path.join(raiz, 'data', 'datos-semilla.json'), 'utf8'));

let errores = [];
let verificados = 0;

const CAMPOS_OBLIGATORIOS = ['id', 'unidadId', 'tipo', 'hecho', 'fecha', 'citaLiteral', 'semaforo', 'semaforoRegla', 'atribucion', 'confianza', 'fechaConsulta'];
const SEMAFOROS = ['rojo', 'ambar', 'verde'];
const CONFIANZAS = ['alta', 'media', 'baja'];

for (const r of datos.registros) {
  verificados++;
  for (const c of CAMPOS_OBLIGATORIOS) {
    const v = r[c];
    if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) {
      errores.push(`Registro ${r.id || '(sin id)'}: falta campo obligatorio «${c}»`);
    }
  }
  if (!r.fuente?.organismo) errores.push(`Registro ${r.id}: falta fuente.organismo`);
  if (!r.fuente?.documento) errores.push(`Registro ${r.id}: falta fuente.documento`);
  if (!r.fuente?.url || !/^https?:\/\//.test(r.fuente.url || '')) errores.push(`Registro ${r.id}: falta fuente.url válida`);
  if (r.citaLiteral && r.citaLiteral.trim().length < 20) errores.push(`Registro ${r.id}: cita demasiado corta para ser literal`);
  if (r.semaforo && !SEMAFOROS.includes(r.semaforo)) errores.push(`Registro ${r.id}: semáforo inválido «${r.semaforo}»`);
  if (r.confianza && !CONFIANZAS.includes(r.confianza)) errores.push(`Registro ${r.id}: confianza inválida «${r.confianza}»`);
  if (r.hashDocumento !== undefined && r.hashDocumento !== null && !/^[a-f0-9]{64}$/.test(r.hashDocumento)) {
    errores.push(`Registro ${r.id}: hashDocumento presente pero no es SHA-256 válido`);
  }
}

// Territorio C (altiplano aimara) debe estar SIN datos y CON leyenda
const unidades = datos.unidades.map((u) => u.id);
const altiplano = datos.territorios.find((t) => t.id === 'altiplano');
if (!altiplano || altiplano.estado !== 'en-preparacion' || !altiplano.leyenda) {
  errores.push('Territorio C (altiplano): debe existir con estado «en-preparacion» y leyenda visible');
}
const unidadesAltiplano = datos.unidades.filter((u) => u.territorioId === 'altiplano');
if (unidadesAltiplano.length !== 0) errores.push('Territorio C: no debe tener unidades cargadas sin verificación');
const registrosAltiplano = datos.registros.filter((r) => !unidades.includes(r.unidadId));
if (registrosAltiplano.length > 0) errores.push(`Registros con unidadId desconocida: ${registrosAltiplano.map((r) => r.id).join(', ')}`);

// Coordenadas aproximadas: deben estar declaradas como tales
for (const u of datos.unidades) {
  if (!u.coordenadas?.aproximadas) errores.push(`Unidad ${u.id}: coordenadas sin marcar como aproximadas`);
}

// LMP dígito a dígito contra la tabla oficial (D.S. N.° 010-2010-MINAM, El Peruano)
const LMP_OFICIAL = [
  ['pH', 'unidad', '6–9', '6–9'],
  ['Sólidos Totales en Suspensión', 'mg/L', '50', '25'],
  ['Aceites y Grasas', 'mg/L', '20', '16'],
  ['Cianuro Total', 'mg/L', '1', '0.8'],
  ['Arsénico Total', 'mg/L', '0.1', '0.08'],
  ['Cadmio Total', 'mg/L', '0.05', '0.04'],
  ['Cromo Hexavalente', 'mg/L', '0.1', '0.08'],
  ['Cobre Total', 'mg/L', '0.5', '0.4'],
  ['Hierro (disuelto)', 'mg/L', '2', '1.6'],
  ['Plomo Total', 'mg/L', '0.2', '0.16'],
  ['Mercurio Total', 'mg/L', '0.002', '0.0016'],
  ['Zinc Total', 'mg/L', '1.5', '1.2'],
];
const lmp = datos.normativas.lmpEfluentesMineros.parametros;
if (lmp.length !== LMP_OFICIAL.length) {
  errores.push(`LMP: cantidad de parámetros (${lmp.length}) no coincide con la tabla oficial (${LMP_OFICIAL.length})`);
}
for (let i = 0; i < Math.min(lmp.length, LMP_OFICIAL.length); i++) {
  const [p, u, l, a] = LMP_OFICIAL[i];
  const f = lmp[i];
  if (f.parametro !== p || f.unidad !== u || f.limiteCualquierMomento !== l || f.promedioAnual !== a) {
    errores.push(`LMP fila ${i + 1}: «${f.parametro}» no coincide dígito a dígito con la tabla oficial (${p}: ${l}/${a})`);
  }
}

// Glosario: todo término declarado debe llevar estado de validación y quién lo respalda
const glosarioRuta = path.join(raiz, 'i18n', 'glosario.json');
try {
  const glosario = JSON.parse(readFileSync(glosarioRuta, 'utf8'));
  for (const [es, langs] of Object.entries(glosario.terminos || {})) {
    for (const [lang, t] of Object.entries(langs)) {
      if (!t.estado || !t.respaldadoPor) {
        errores.push(`Glosario ${es}/${lang}: falta estado de validación o respaldo`);
      }
      // Un término puede declararse vacío SOLO si está en borrador y el respaldo
      // declara la pendencia (vacío declarado ≠ campo faltante).
      if (t.valor === null || t.valor === undefined) {
        if (t.estado !== 'borrador' || !/pendiente/i.test(String(t.respaldadoPor || ''))) {
          errores.push(`Glosario ${es}/${lang}: valor vacío sin declarar correctamente su pendencia`);
        }
      }
      if (!['validado', 'borrador'].includes(t.estado)) {
        errores.push(`Glosario ${es}/${lang}: estado inválido «${t.estado}»`);
      }
    }
  }
} catch {
  errores.push('i18n/glosario.json no existe o no es JSON válido');
}

if (errores.length > 0) {
  console.error(`✗ VERIFICACIÓN DE DATOS FALLIDA — ${errores.length} problema(s):`);
  for (const e of errores) console.error('  - ' + e);
  process.exit(1);
} else {
  console.log(`✓ Verificación de datos PASÓ: ${verificados} registros con fuente, fecha y cita; LMP coincide dígito a dígito con la tabla oficial; territorio C sin datos inventados; glosario con estado de validación.`);
}
