import PDFDocument from 'pdfkit';
import { leerSeed } from '../config.js';
import { estadoMeta } from '../api/meta-client.js';
import { versionPrompt } from '../api/prompts.js';
import { responderDemo } from '../api/explicador-demo.js';
import { verificarTexto } from '../api/verificador.js';

/**
 * Ficha de registro verificado (UN solo documento PDF descargable).
 *
 * - Resume UN registro de data/datos-semilla.json con el texto del
 *   explicador-demo, que pasa por el verificador P6 en código ANTES de
 *   entrar al PDF. Si P6 bloquea, NO se genera PDF (se devuelve el motivo
 *   real y la ruta responde 422 declarado).
 * - Si el registro no existe, no hay datos: 404 declarado, nada inventado.
 * - El bloque de revisión experta va VACÍO y pendiente: sin firma, sin
 *   nombre, sin colegiatura, sin fecha de revisión, sin aprobación.
 * - Es un documento sin estado (no entra a la bandeja del módulo D ni a la
 *   bitácora): se genera al vuelo desde los datos semilla verificados.
 */

const MARGEN = { top: 92, bottom: 84, left: 56, right: 56 };

function nombresTerceros() {
  const seed = leerSeed();
  const nombres = [];
  for (const u of seed.unidades) {
    nombres.push(u.nombre, u.empresa);
    for (const c of u.componentes) nombres.push(c.nombre);
  }
  return nombres.filter(Boolean);
}

function pendientesDe(registro) {
  const pendientes = [];
  if (!registro.hashDocumento) {
    pendientes.push('Hash SHA-256 del documento primario pendiente: el PDF primario aún no está adjunto en esta instancia (sin hash verificable).');
  }
  if (registro.citaPagina && /confirmar|pendiente/i.test(registro.citaPagina)) {
    pendientes.push(`Página exacta de la cita por confirmar (el registro dice: «${registro.citaPagina}»).`);
  }
  if (registro.fechaNota && /confirmar/i.test(registro.fechaNota)) {
    pendientes.push(`Fecha exacta del documento por confirmar (el registro dice: «${registro.fechaNota}»).`);
  }
  return pendientes;
}

/**
 * Prepara la ficha de un registro YA localizado: verifica el resumen con P6.
 * Exportada para pruebas: con texto fabricado debe devolver bloqueado.
 */
export function prepararFicha(registro, resumenPartes) {
  const verificacion = verificarTexto(resumenPartes, [registro], { nombresTerceros: nombresTerceros() });
  if (!verificacion.aprobado) {
    return { bloqueado: true, motivoBloqueo: verificacion.motivoBloqueo, verificacion };
  }
  const meta = estadoMeta();
  const resumen = Array.isArray(resumenPartes) ? resumenPartes.map((p) => p.texto).join(' ') : String(resumenPartes);
  return {
    bloqueado: false,
    registro,
    resumen,
    pendientes: pendientesDe(registro),
    verificacion,
    registroGeneracion: {
      modo: meta.modo,
      // El resumen SIEMPRE viene del explicador-demo (construirFicha usa
      // responderDemo), en modo demo y en modo en-vivo: atribuirlo al
      // modelo en vivo sería falso. El origen explícito lo declara.
      modelo: 'explicador-demo (verificado por P6)',
      origen: 'Resumen del explicador-demo, verificado por P6 en código antes de entrar al PDF; no se generó en vivo en esta ficha',
      prompt: `P2 ${versionPrompt('P2-explicador-es')} · P6 ${versionPrompt('P6-verificador')}`,
      versionP6: versionPrompt('P6-verificador'),
      fecha: new Date().toISOString(),
      fuentes: [{ id: registro.id, hash: registro.hashDocumento }],
    },
  };
}

/** Localiza el registro y prepara su ficha con el resumen demo verificado. */
export function construirFicha(registroId) {
  const seed = leerSeed();
  const registro = seed.registros.find((r) => r.id === registroId);
  if (!registro) return { noEncontrado: true, registroId };
  const demo = responderDemo({ consulta: '', registroId, lengua: 'es' });
  return prepararFicha(registro, demo.partes);
}

function textoRegistroGeneracion(rg) {
  const f = rg.fuentes.map((x) => `${x.id}${x.hash ? ` (sha256 ${x.hash.slice(0, 12)}…)` : ' (hash pendiente)'}`).join(', ');
  return `Registro de Generación IA · ${rg.origen} · modo: ${rg.modo} · modelo: ${rg.modelo} · fecha: ${rg.fecha} · P6: ${rg.versionP6} · prompt: ${rg.prompt} · fuentes: ${f} · revisión experta: PENDIENTE (sin firma)`;
}

function bandas(doc, ficha) {
  const ancho = doc.page.width;
  const alto = doc.page.height;
  doc.rect(0, 0, ancho, 34).fill('#B91C1C');
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8).text(
    'BORRADOR GENERADO CON ASISTENCIA DE IA — REQUIERE REVISIÓN DE UN ESPECIALISTA — NO PRESENTAR',
    56, 8, { width: ancho - 112, align: 'center', height: 24, ellipsis: true },
  );
  doc.rect(0, alto - 66, ancho, 66).fill('#111827');
  doc.fillColor('#D1D5DB').font('Helvetica').fontSize(6.5).text(
    textoRegistroGeneracion(ficha.registroGeneracion),
    56, alto - 60, { width: ancho - 112, align: 'left', height: 32, ellipsis: true },
  );
  doc.fillColor('#9CA3AF').fontSize(6).text(
    'WillayPacha AI · información pública citada · este documento no reemplaza a OEFA, a la ANA, a un laboratorio acreditado ni a un profesional colegiado.',
    56, alto - 26, { width: ancho - 112, height: 14, ellipsis: true },
  );
  doc.fillColor('#111827').font('Helvetica').fontSize(9);
  doc.x = 56;
  doc.y = 52;
}

function seccion(doc, numero, titulo) {
  if (doc.y > doc.page.height - 160) doc.addPage();
  doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#92400E').text(`${numero}. ${titulo}`);
  doc.moveDown(0.3);
  doc.font('Helvetica').fontSize(9.5).fillColor('#111827');
}

function parrafo(doc, texto) {
  doc.font('Helvetica').fontSize(9.5).fillColor('#111827').text(texto, { align: 'justify', lineGap: 2 });
  doc.moveDown(0.4);
}

export function generarPdfFicha(ficha) {
  if (!ficha || ficha.bloqueado || ficha.noEncontrado) {
    throw new Error('Ficha no generable: sin resumen aprobado por P6 no hay PDF.');
  }
  const r = ficha.registro;
  const seed = leerSeed();
  const unidad = seed.unidades.find((u) => u.id === r.unidadId);
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: MARGEN,
      compress: false,
      info: {
        Title: `Ficha de registro verificado — ${r.id} (borrador)`,
        Author: 'WillayPacha AI — borrador generado con asistencia de IA',
        Subject: 'Ficha de un registro verificado, sujeta a revisión de especialista',
      },
    });
    const trozos = [];
    doc.on('data', (c) => trozos.push(c));
    doc.on('end', () => resolve(Buffer.concat(trozos)));
    doc.on('error', reject);

    bandas(doc, ficha);
    doc.on('pageAdded', () => bandas(doc, ficha));

    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(15).text('Ficha de registro verificado');
    doc.moveDown(0.2);
    doc.font('Helvetica').fontSize(9).fillColor('#374151');
    doc.text(`Registro ${r.id} · Unidad: ${unidad ? `${unidad.nombre} (${unidad.empresa})` : r.unidadId}`);
    doc.text(`Generada: ${new Date(ficha.registroGeneracion.fecha).toLocaleString('es-PE')}`);
    doc.moveDown(0.6);
    doc.moveTo(56, doc.y).lineTo(doc.page.width - 56, doc.y).strokeColor('#D1D5DB').stroke();
    doc.moveDown(0.8);
    doc.fillColor('#111827');

    seccion(doc, 'I', 'Resumen verificado');
    parrafo(doc, ficha.resumen);

    seccion(doc, 'II', 'Cita completa de la fuente');
    doc.font('Helvetica-Oblique').fontSize(9).fillColor('#374151').text(`«${r.citaLiteral}»`, { align: 'justify' });
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(9).fillColor('#111827');
    parrafo(doc, `Organismo: ${r.fuente.organismo} · Documento: ${r.fuente.documento} · Fecha: ${r.fecha} · Búsqueda: ${r.fuente.busqueda}`);
    parrafo(doc, `Semáforo: ${String(r.semaforo).toUpperCase()} — ${r.semaforoRegla || 'sin regla declarada'} · Confianza: ${r.confianza || 'no declarada'} · Estado: ${r.estadoProcesal || 'no especificado'}`);

    seccion(doc, 'III', 'Pendientes declarados');
    if (ficha.pendientes.length === 0) {
      parrafo(doc, 'Sin pendientes: hash, página exacta y fecha exacta constan en el registro.');
    } else {
      for (const p of ficha.pendientes) {
        parrafo(doc, `· ${p}`);
      }
    }

    seccion(doc, 'IV', 'Revisión experta (vacía y pendiente)');
    parrafo(doc, 'Estado: REVISIÓN EXPERTA PENDIENTE. Este bloque está vacío a propósito: la plataforma no firma, no inventa nombres ni colegiaturas y no aprueba por nadie.');
    doc.font('Helvetica').fontSize(9.5).fillColor('#374151');
    doc.text('Nombre del experto: ________________________________________ (pendiente)');
    doc.text('Colegiatura (CIP/CAL N.°): ________________________________________ (pendiente)');
    doc.text('Fecha de revisión: ________________________________________ (pendiente)');
    doc.text('Decisión: [ ] Aprobado  [ ] Observado  (pendiente — sin marcar)');
    doc.moveDown(0.4);
    doc.fillColor('#111827');

    doc.end();
  });
}
