import PDFDocument from 'pdfkit';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { config, leerSeed } from '../config.js';

/**
 * Generador de documentos (Módulo D).
 *
 * Reglas que este módulo hace cumplir:
 * - Franja de BORRADOR en CADA página mientras no exista aprobación experta.
 * - Sin firma, sin fecha de presentación, sin afirmaciones de delito.
 * - Pie con el Registro de Generación IA (modelo, prompt, fuentes, hash, fecha).
 * - El PDF «final» solo se genera tras la aprobación de un experto identificado
 *   con su colegiatura (CIP o CAL); el sistema no firma por nadie.
 */

const TITULOS = {
  acta: 'Acta de Asamblea Comunal (bilingüe)',
  informe: 'Informe Técnico Preliminar — Contraste ECA / LMP',
  denuncia: 'Denuncia Ambiental (SINADA – OEFA) / Solicitud de verificación (ANA)',
};

const MARGEN = { top: 92, bottom: 84, left: 56, right: 56 };

function registroTexto(registroGeneracion, aprobado, experto) {
  const fuentes = (registroGeneracion?.fuentes || []).map((f) => `${f.id}${f.hash ? ` (sha256 ${f.hash.slice(0, 12)}…)` : ' (hash pendiente)'}`).join(', ') || 'sin fuentes citadas';
  const estado = aprobado
    ? `APROBADO por ${experto?.nombre} — ${experto?.tipo} N.° ${experto?.colegiatura} — ${new Date(experto?.fecha || Date.now()).toISOString()}`
    : 'BORRADOR — revisión experta pendiente';
  return `Registro de Generación IA · modelo: ${registroGeneracion?.modelo || 'demo'} · prompt: ${registroGeneracion?.prompt || 'P5'} · fuentes: ${fuentes} · generado: ${registroGeneracion?.fecha || new Date().toISOString()} · ${estado}`;
}

function bandas(doc, { aprobado, experto, registroGeneracion }) {
  const ancho = doc.page.width;
  const alto = doc.page.height;

  if (aprobado) {
    doc.rect(0, 0, ancho, 34).fill('#065F46');
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8).text(
      `DOCUMENTO REVISADO Y APROBADO POR EXPERTO COLEGIADO — ${experto?.nombre || ''} (${experto?.tipo || ''} N.° ${experto?.colegiatura || ''}) — LA PRESENTACIÓN LA REALIZA LA PERSONA POR LOS CANALES OFICIALES`,
      56, 8, { width: ancho - 112, align: 'center', height: 24, ellipsis: true },
    );
  } else {
    doc.rect(0, 0, ancho, 34).fill('#B91C1C');
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8).text(
      'BORRADOR GENERADO CON ASISTENCIA DE IA — REQUIERE REVISIÓN DE UN ESPECIALISTA — NO PRESENTAR',
      56, 8, { width: ancho - 112, align: 'center', height: 24, ellipsis: true },
    );
  }

  doc.rect(0, alto - 66, ancho, 66).fill('#111827');
  doc.fillColor('#D1D5DB').font('Helvetica').fontSize(6.5).text(
    registroTexto(registroGeneracion, aprobado, experto),
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

function tituloBloque(doc, documento) {
  const seed = leerSeed();
  const unidad = seed.unidades.find((u) => u.id === documento.unidadId);
  doc.fillColor('#111827').font('Helvetica-Bold').fontSize(15).text(TITULOS[documento.tipo] || documento.tipo);
  doc.moveDown(0.2);
  doc.font('Helvetica').fontSize(9).fillColor('#374151');
  doc.text(`Documento ${documento.id} · Unidad de referencia: ${unidad ? `${unidad.nombre} (${unidad.empresa})` : 'no especificada'}`);
  doc.text(`Generado: ${new Date(documento.creadoEl).toLocaleString('es-PE')} · Solicitante: ${documento.datos?.solicitante || '[COMPLETAR: nombre o comunidad solicitante]'}`);
  doc.moveDown(0.6);
  doc.moveTo(56, doc.y).lineTo(doc.page.width - 56, doc.y).strokeColor('#D1D5DB').stroke();
  doc.moveDown(0.8);
  doc.fillColor('#111827');
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

function cita(doc, registro) {
  const inicioY = doc.y;
  doc.font('Helvetica-Oblique').fontSize(8.5).fillColor('#374151').text(`«${registro.citaLiteral}»`, 68, doc.y, { width: doc.page.width - 136 });
  doc.font('Helvetica').fontSize(8).fillColor('#6B7280').text(
    `Fuente: ${registro.fuente.organismo} — ${registro.fuente.documento} · Fecha: ${registro.fecha} · Semáforo: ${registro.semaforo.toUpperCase()} (${registro.semaforoRegla})`,
    68, doc.y, { width: doc.page.width - 136 },
  );
  doc.moveTo(68, doc.y + 2).lineTo(68, inicioY).lineWidth(2).strokeColor('#F59E0B').stroke();
  doc.lineWidth(1);
  doc.moveDown(0.7);
  doc.fillColor('#111827');
}

function tablaLmp(doc, lmp) {
  const x = 56;
  const ancho = doc.page.width - 112;
  const cols = [ancho * 0.4, ancho * 0.15, ancho * 0.22, ancho * 0.23];
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#111827');
  let y = doc.y;
  doc.rect(x, y, ancho, 16).fill('#E5E7EB');
  doc.fillColor('#111827').text('Parámetro', x + 4, y + 4, { width: cols[0] });
  doc.text('Unidad', x + cols[0] + 4, y + 4, { width: cols[1] });
  doc.text('Límite en cualquier momento', x + cols[0] + cols[1] + 4, y + 4, { width: cols[2] });
  doc.text('Promedio anual', x + cols[0] + cols[1] + cols[2] + 4, y + 4, { width: cols[3] });
  y += 16;
  doc.font('Helvetica').fontSize(8);
  for (const p of lmp) {
    doc.rect(x, y, ancho, 14).fill('#FFFFFF').strokeColor('#E5E7EB').stroke();
    doc.fillColor('#111827').text(p.parametro, x + 4, y + 3, { width: cols[0] });
    doc.text(p.unidad, x + cols[0] + 4, y + 3, { width: cols[1] });
    doc.text(p.limiteCualquierMomento, x + cols[0] + cols[1] + 4, y + 3, { width: cols[2] });
    doc.text(p.promedioAnual, x + cols[0] + cols[1] + cols[2] + 4, y + 3, { width: cols[3] });
    y += 14;
    if (y > doc.page.height - 120) {
      doc.addPage();
      y = doc.y;
    }
  }
  doc.y = y + 6;
  doc.font('Helvetica').fontSize(7.5).fillColor('#6B7280').text(
    'Valores del Anexo del D.S. N.° 010-2010-MINAM según su publicación en El Peruano. Los valores de «límite en cualquier momento» aplican a muestras colectadas siguiendo el protocolo oficial de monitoreo. La plataforma compara documentos, no muestras propias.',
    { width: ancho },
  );
  doc.fillColor('#111827');
}

function bloqueFirmas(doc) {
  doc.moveDown(1);
  const y = doc.y;
  const ancho = (doc.page.width - 112) / 2 - 12;
  doc.moveTo(56, y + 30).lineTo(56 + ancho, y + 30).strokeColor('#374151').stroke();
  doc.font('Helvetica').fontSize(8).fillColor('#374151').text('[COMPLETAR: nombre y DNI del representante comunal]', 56, y + 34, { width: ancho });
  doc.moveTo(68 + ancho, y + 30).lineTo(68 + ancho * 2, y + 30).strokeColor('#374151').stroke();
  doc.text('[COMPLETAR: nombre y DNI del segundo firmante]', 68 + ancho, y + 34, { width: ancho });
  doc.moveDown(2);
}

function contenidoActa(doc, documento) {
  const seed = leerSeed();
  const registros = seed.registros.filter((r) => r.unidadId === documento.unidadId);

  seccion(doc, 'I', 'Datos de la comunidad');
  parrafo(doc, '[COMPLETAR: nombre de la comunidad campesina o nativa] · [COMPLETAR: distrito, provincia, departamento] · [COMPLETAR: fecha y hora de la asamblea] · [COMPLETAR: número de acta]');

  seccion(doc, 'II', 'Objeto');
  parrafo(doc, 'Dejar constancia formal del acuerdo de la asamblea comunal respecto de los hechos que se citan en esta acta, para su presentación por los canales oficiales que la comunidad decida.');

  seccion(doc, 'III', 'Hechos registrados con fuente');
  parrafo(doc, 'Los siguientes hechos se transcriben de documentos oficiales, con su cita literal. No son afirmaciones de la comunidad ni de esta plataforma: son citas de la fuente que se indica.');
  for (const r of registros) cita(doc, r);

  seccion(doc, 'IV', 'Acuerdo');
  parrafo(doc, '[COMPLETAR: texto del acuerdo aprobado en asamblea, tal como consta en el libro de actas]. La comunidad decide libremente su contenido; esta plataforma no lo redacta por ella.');

  seccion(doc, 'V', 'Versión en lengua originaria');
  parrafo(doc, 'La comunidad podrá incorporar la versión en quechua, aimara o asháninka. Los términos técnicos provienen del glosario del proyecto y permanecen en estado BORRADOR hasta su validación por un hablante o un intérprete registrado. Lo que no está en el glosario permanece en español entre paréntesis: no se inventan equivalencias.');
  doc.font('Helvetica').fontSize(8.5).fillColor('#374151').text(
    'Semilla del glosario (borrador, pendiente de validación): agua — yaku (quechua) · uma (aimara) · nija (asháninka) | río — mayu (quechua) · jawira (aimara) | tierra/territorio — allpa/pacha (quechua) · uraqi/pacha (aimara) · kipatsi (asháninka).',
  );
  doc.moveDown(0.6);
  doc.fillColor('#111827');

  seccion(doc, 'VI', 'Firmas de la asamblea');
  bloqueFirmas(doc);
}

function contenidoInforme(doc, documento) {
  const seed = leerSeed();
  const registros = seed.registros.filter((r) => r.unidadId === documento.unidadId);
  const lmp = seed.normativas.lmpEfluentesMineros;

  seccion(doc, 'I', 'Objeto y alcance');
  parrafo(doc, `Contrastar la información oficial disponible sobre la unidad de referencia con la normativa ambiental vigente, distinguiendo estándares de calidad ambiental (ECA, en el cuerpo receptor) de límites máximos permisibles (LMP, en lo que una actividad descarga). Este informe es un borrador técnico preliminar: no sustituye a OEFA, a la ANA ni a un laboratorio acreditado.`);

  seccion(doc, 'II', 'Antecedentes citados');
  for (const r of registros) cita(doc, r);

  seccion(doc, 'III', 'Marco normativo — LMP de efluentes minero-metalúrgicos');
  parrafo(doc, `${lmp.nombre} — ${lmp.norma}. ${lmp.notaUso}`);
  tablaLmp(doc, lmp.parametros);

  seccion(doc, 'IV', 'Contraste por cuerpo o componente');
  parrafo(doc, 'El semáforo evalúa el contenido de la información oficial disponible; no es una nota ni un ranking de empresas. La norma citada es la que la fuente aplicó en su momento (por ejemplo, ECA de 2008, categoría 3), sin conversión silenciosa a la norma actual.');
  for (const r of registros) {
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#111827').text(`· ${r.cuerpoAgua || r.componente || r.id} — ${r.parametro || ''}`);
    doc.font('Helvetica').fontSize(8.5).fillColor('#374151').text(
      `Estándar: ${r.estandar || 'no especificado por la fuente'} · Semáforo: ${r.semaforo.toUpperCase()} · Confianza: ${r.confianza} · Estado: ${r.estadoProcesal || 'no especificado'}`,
      { width: doc.page.width - 112 },
    );
    doc.moveDown(0.4);
  }

  seccion(doc, 'V', 'Limitaciones declaradas');
  parrafo(doc, 'Una fotografía no mide metales: la segmentación visual solo delimita áreas visualmente anómalas y no acredita contaminación. Los datos provienen de documentos oficiales citados; el documento primario prevalece. En esta instancia, la página exacta de algunas citas y el hash del documento están pendientes de confirmación y así se declaran.');

  seccion(doc, 'VI', 'Anexos');
  parrafo(doc, '[COMPLETAR: láminas de apoyo visual con su leyenda de límites] · [COMPLETAR: registros citados impresos] · [COMPLETAR: acta de asamblea, si corresponde]');
}

function contenidoDenuncia(doc, documento) {
  const seed = leerSeed();
  const registros = seed.registros.filter((r) => r.unidadId === documento.unidadId);
  const esAna = documento.datos?.entidad === 'ana';

  seccion(doc, 'I', 'Datos del solicitante');
  parrafo(doc, '[COMPLETAR: nombre completo o comunidad] · [COMPLETAR: DNI o RUC] · [COMPLETAR: domicilio] · [COMPLETAR: correo y teléfono de contacto] · [COMPLETAR: calidad en la que se presenta]');

  seccion(doc, 'II', 'Hechos (como observación, con cita)');
  parrafo(doc, 'Los hechos se presentan como observación de la información oficial disponible, con cita literal de cada documento. Esta plataforma no afirma la comisión de delito alguno ni califica responsabilidades.');
  for (const r of registros) cita(doc, r);

  seccion(doc, 'III', 'Normas invocadas');
  parrafo(doc, 'Ley N.° 28611, Ley General del Ambiente (derecho a un ambiente equilibrado; ECA y LMP). Decreto Supremo N.° 004-2017-MINAM (ECA para Agua). Decreto Supremo N.° 010-2010-MINAM (LMP para efluentes minero-metalúrgicos). Ley N.° 27446, Ley del Sistema Nacional de Evaluación de Impacto Ambiental, en lo aplicable. Ley N.° 29785, Ley de consulta previa, como contexto de derechos.');

  seccion(doc, 'IV', 'Pedido');
  parrafo(doc, esAna
    ? 'Solicito la verificación de la calidad del agua en los cuerpos señalados, conforme a las competencias de la Autoridad Nacional del Agua, y que se comunique el resultado a la comunidad solicitante por el canal que se indique.'
    : 'Solicito la atención de la presente denuncia ambiental y la verificación de los hechos observados en el ámbito de las competencias de OEFA (SINADA), así como que se comunique el resultado a la comunidad solicitante por el canal que se indique.');

  seccion(doc, 'V', 'Anexos');
  parrafo(doc, '[COMPLETAR: láminas de apoyo visual] · [COMPLETAR: copia de los documentos citados] · [COMPLETAR: acta de asamblea comunal, si corresponde] · [COMPLETAR: evidencia fotográfica con su hash]');

  seccion(doc, 'VI', 'Advertencia');
  parrafo(doc, 'Este documento es un borrador generado con asistencia de IA. Solo adquiere valor para su presentación tras la revisión y aprobación de un especialista colegiado (ingeniero ambiental o civil, o abogado). La plataforma no firma, no fecha presentaciones y no envía documentos a ninguna entidad: la presentación la realiza la persona por los canales oficiales (SINADA, Mesa de Partes Virtual de OEFA, o ANA).');
}

export function generarPdf(documento, { aprobado = false, experto = null } = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: MARGEN,
      info: {
        Title: `${TITULOS[documento.tipo]} — ${documento.id} (${aprobado ? 'aprobado' : 'borrador'})`,
        Author: 'WillayPacha AI — borrador generado con asistencia de IA',
        Subject: 'Documento borrador sujeto a revisión de especialista',
      },
    });

    const trozos = [];
    doc.on('data', (c) => trozos.push(c));
    doc.on('end', () => resolve(Buffer.concat(trozos)));
    doc.on('error', reject);

    const contexto = { aprobado, experto, registroGeneracion: documento.registroGeneracion };
    bandas(doc, contexto);
    doc.on('pageAdded', () => bandas(doc, contexto));

    tituloBloque(doc, documento);

    if (documento.tipo === 'acta') contenidoActa(doc, documento);
    else if (documento.tipo === 'informe') contenidoInforme(doc, documento);
    else if (documento.tipo === 'denuncia') contenidoDenuncia(doc, documento);
    else {
      doc.font('Helvetica').fontSize(10).text('Tipo de documento no reconocido.');
    }

    doc.end();
  });
}

export function guardarPdf(id, tipoVersion, buffer) {
  const dir = path.join(config.rutaDatos, 'documentos');
  mkdirSync(dir, { recursive: true });
  const ruta = path.join(dir, `${id}-${tipoVersion}.pdf`);
  writeFileSync(ruta, buffer);
  return { ruta, hash: createHash('sha256').update(buffer).digest('hex') };
}

export function leerPdf(id, tipoVersion) {
  const ruta = path.join(config.rutaDatos, 'documentos', `${id}-${tipoVersion}.pdf`);
  try {
    return readFileSync(ruta);
  } catch {
    return null;
  }
}
