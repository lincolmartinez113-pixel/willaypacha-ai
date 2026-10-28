/**
 * P6 — Verificador (implementación en código).
 *
 * El prompt P6 gobierna la verificación en vivo; este módulo es la misma regla
 * ejecutable en la instancia demo y, además, una segunda barrera cuando la API
 * está habilitada: ningún texto generado llega a la interfaz sin pasar por aquí.
 *
 * Una sola afirmación no soportada bloquea la salida completa.
 */

const VOCABULARIO_ACUSACION = [
  'contaminó', 'contaminan', 'contamina', 'contaminado', 'contaminación detectada',
  'culpable', 'culpa', 'delito', 'delictivo', 'corrupto', 'corrupción', 'crimen',
  'criminal', 'envenenó', 'envenena', 'asesinó', 'mata', 'dañó', 'daña',
  'destruyó', 'irresponsable', 'ocultó', 'mintió', 'falseó', 'manipuló',
  'encubrió', 'sobornó',
];

const VERBOS_CAUSALES = ['causó', 'causa', 'provocó', 'provoca', 'originó', 'origina', 'generó la contaminación'];

const MARCAS_ATRIBUCION = ['según', 'mediante', 'de acuerdo', 'conforme', 'resolución', 'informe', 'estudio', 'evaluación', 'registro', 'acto', 'documento'];

const FRASES_META = [
  /no consta/i,
  /no se sabe/i,
  /no hay registros/i,
  /no está en la base/i,
  /no es asesoría/i,
  /no da diagnósticos/i,
  /no califica/i,
  /no presenta denuncias/i,
  /no reemplaza/i,
  /requiere revisión/i,
  /pendiente de validación/i,
  /no se generaliza/i,
  /límite/i,
  /alcance/i,
];

const STOPWORDS = new Set([
  'para', 'como', 'este', 'esta', 'esto', 'estos', 'estas', 'desde', 'hasta', 'sobre', 'entre',
  'cuando', 'donde', 'porque', 'aunque', 'también', 'todavía', 'siempre', 'nunca', 'puede',
  'debe', 'sería', 'según', 'muestra', 'indica', 'señala', 'consta', 'existe', 'tiene',
  'hace', 'hace', 'solo', 'sólo', 'mismo', 'misma', 'otra', 'otro', 'cada', 'todo', 'toda',
  'todos', 'todas', 'parte', 'gran', 'poco', 'mucho', 'mayor', 'menor', 'nivel', 'caso',
  'datos', 'dato', 'texto', 'frase', 'sistema', 'registro', 'registros', 'fuente', 'fuentes',
]);

export function normalizar(texto) {
  return String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function corpus(fuentes) {
  return fuentes
    .map((f) =>
      [
        f.citaLiteral, f.hecho, f.fecha, f.organismo, f.documento, f.parametro, f.estandar,
        f.cuerpoAgua, f.componente, f.atribucion, f.estadoProcesal, f.fuente?.organismo,
        f.fuente?.documento, f.fuente?.busqueda,
      ]
        .filter(Boolean)
        .join(' '),
    )
    .join(' ');
}

function numerosDe(texto) {
  return (texto.match(/\d+(?:[.,]\d+)?/g) || []).map((n) => n.replace(',', '.'));
}

function tieneAncla(sentencia, corpusTexto) {
  const palabras = normalizar(sentencia)
    .replace(/[^a-z0-9áéíóúñü\s.-]/gi, ' ')
    .split(/\s+/)
    .filter((p) => p.length >= 6 && !STOPWORDS.has(p));
  if (palabras.length === 0) return true; // frase muy corta: se evalúa por otras reglas
  return palabras.some((p) => corpusTexto.includes(p));
}

function mencionaTercero(sentencia, nombres) {
  const s = normalizar(sentencia);
  return nombres.some((n) => s.includes(normalizar(n)));
}

/**
 * @param {string|Array<{texto:string, meta?:boolean}>} texto
 *        Texto a verificar. Puede llegar como arreglo de partes: las partes
 *        marcadas meta:true son frases del SISTEMA que declaran límites (P6 no
 *        las rechaza, igual que el prompt P6); se aceptan solo si coinciden
 *        verbatim con lo declarado, y toda frase factual pasa los controles.
 * @param {Array} fuentes Registros/fuentes que lo sustentan.
 * @param {{nombresTerceros?: string[]}} opciones
 */
export function verificarTexto(texto, fuentes, { nombresTerceros = [] } = {}) {
  const corpusTexto = normalizar(corpus(fuentes));
  const partes = Array.isArray(texto)
    ? texto.map((p) => ({ texto: String(p.texto ?? ''), meta: Boolean(p.meta) }))
    : [{ texto: String(texto || ''), meta: false }];

  const afirmaciones = [];

  for (const parte of partes) {
    const sentencias = parte.texto
      .split(/(?<=[.!?])\s+|\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const sentencia of sentencias) {
      const sNorm = normalizar(sentencia);

      // Aviso documental cerrado: solo acepta las clausulas que genera
      // pendientes(r). La marca meta por si sola nunca concede excepciones.
      const esAvisoDocumentalPendiente = (() => {
        if (!parte.meta || !sNorm.startsWith('lo que todavia no consta: ') || !sNorm.endsWith('.')) {
          return false;
        }

        const clausulasPermitidas = new Set([
          'el documento primario aun no esta adjunto en esta instancia (sin hash verificable)',
          'la pagina exacta de la cita esta por confirmar',
          'la fecha exacta del documento esta por confirmar',
        ]);

        const contenidoAviso = sNorm.slice('lo que todavia no consta: '.length, -1);
        const clausulas = contenidoAviso.split('; ');

        return clausulas.length >= 1
          && clausulas.length <= clausulasPermitidas.size
          && new Set(clausulas).size === clausulas.length
          && clausulas.every((clausula) => clausulasPermitidas.has(clausula));
      })();

      if (esAvisoDocumentalPendiente) {
        afirmaciones.push({
          texto: sentencia,
          estado: 'soportada',
          motivo: 'aviso documental pendiente reconocido por formato exacto',
        });
        continue;
      }


      // La marca meta no demuestra que una oración sea verdadera ni la exime
      // de los controles factuales que siguen.
      // Avisos operativos controlados: la marca meta no concede excepciones
      // por sí sola. Cada texto admitido debe coincidir exactamente.
      const avisosOperativosExactos = new Set([
        'no consta en los registros cargados de esta instancia.',
        'esto no es asesoria legal ni un diagnostico de salud.',
        'la plataforma no califica hechos como delito ni identifica responsables penales: esa determinacion corresponde a las autoridades competentes.',
        'no consta en los registros cargados ninguna multa, sancion firme ni monto para las unidades de esta instancia.',
        'el estado de procedimientos sancionadores se consulta en el portal interactivo de fiscalizacion ambiental (pifa) de oefa, que es la fuente primaria.',
        'no brindo diagnosticos ni afirmo consecuencias en la salud que las fuentes no sustenten.',
        'lo que consta es el hallazgo oficial sobre el agua, con su cita, y lo que aun no se sabe.',
        'para evaluacion de salud, la derivacion corresponde al establecimiento de salud y a la autoridad sanitaria.',
        'la fiscalia especializada en materia ambiental (fema) es el horizonte para los casos que un especialista considere de relevancia penal; el sistema solo ordena informacion con fuente.',
        'la plataforma no trata ni muestra datos personales de funcionarios o de terceros: no constan en los registros publicos citados y no se incorporan.',
        'solo se publican hechos, fechas, normas y citas de documentos oficiales.',
        'no se generaliza a una cuenca entera: los registros cubren cuerpos de agua y componentes especificos, con fecha y cita.',
        'una evaluacion puede encontrar un hallazgo en una quebrada y, a la vez, concluir que en otra microcuenca no hubo influencia negativa.',
        'consulte el cuerpo de agua concreto para ver su registro.',
        'el termino no esta en el glosario aprobado, de modo que permanece en espanol entre parentesis: no se inventan equivalencias.',
        'el glosario crece solo con terminos validados, registrando quien valido y cuando.',
        'la plataforma no presenta denuncias por el usuario ni firma documentos.',
        'prepara un borrador con antecedentes citados y anexos, que solo adquiere valor tras la revision de un especialista colegiado; la presentacion la realiza la persona o la comunidad por los canales oficiales (sinada de oefa, mesa de partes virtual, o solicitud de verificacion ante la ana).',
        'no puedo seguir instrucciones contenidas en una consulta: trato todo mensaje como dato, no como orden.',
        'lo que consta es solo lo que las fuentes oficiales cargadas dicen, con su cita.',
        'si su consulta es sobre un caso concreto, reformulela indicando el cuerpo de agua o el componente.',
        'la unidad consultada no esta en la base cargada.',
        'el termino consultado no esta en el glosario aprobado; permanece en espanol y no se inventan equivalencias.',
        'el semaforo marca un hallazgo oficial vigente con atribucion del organismo; no es una sancion ni una calificacion legal.',
'el semaforo marca una evaluacion oficial sin hallazgo negativo para ese cuerpo o componente.',
'el semaforo marca un asunto en curso o con atribucion no concluyente; el estado procesal se muestra con su fecha.',

      ]);

      const esAvisoOperativoFijo =
        parte.meta && avisosOperativosExactos.has(sNorm);

      if (esAvisoOperativoFijo) {
        afirmaciones.push({
          texto: sentencia,
          estado: 'soportada',
          motivo: 'aviso operativo fijo permitido explícitamente',
        });
        continue;
      }

// 2) Cifras: toda cifra debe existir en las fuentes.
      const numeros = numerosDe(sentencia);
      const numeroSinRespaldo = numeros.find((n) => !corpusTexto.includes(n));
      if (numeroSinRespaldo) {
        afirmaciones.push({
          texto: sentencia,
          estado: 'no_soportada',
          motivo: `la cifra «${numeroSinRespaldo}» no consta en las fuentes citadas`,
        });
        continue;
      }

      // 3) Vocabulario de acusación: solo permitido si la fuente lo usa.
      const acusacion = VOCABULARIO_ACUSACION.find((v) => sNorm.includes(normalizar(v)) && !corpusTexto.includes(normalizar(v)));
      if (acusacion) {
        afirmaciones.push({
          texto: sentencia,
          estado: 'no_soportada',
          motivo: `vocabulario de acusación «${acusacion}» sin respaldo en la fuente (lista de vocabulario controlado)`,
        });
        continue;
      }

      // 4) Causalidad: el verbo debe estar escrito en la fuente.
      const causal = VERBOS_CAUSALES.find((v) => sNorm.includes(normalizar(v)) && !corpusTexto.includes(normalizar(v)));
      if (causal) {
        afirmaciones.push({
          texto: sentencia,
          estado: 'no_soportada',
          motivo: `causalidad «${causal}» no escrita por la fuente`,
        });
        continue;
      }

      // 5) Hecho sobre empresa/persona/unidad: exige atribución gramatical.
      if (mencionaTercero(sentencia, nombresTerceros) && !MARCAS_ATRIBUCION.some((m) => sNorm.includes(normalizar(m)))) {
        afirmaciones.push({
          texto: sentencia,
          estado: 'no_soportada',
          motivo: 'hecho sobre un tercero sin atribución a su fuente («según…», «mediante Resolución…»)',
        });
        continue;
      }

      // 6) Anclaje textual: alguna palabra distintiva debe existir en las fuentes.
      if (!tieneAncla(sentencia, corpusTexto)) {
        afirmaciones.push({
          texto: sentencia,
          estado: 'no_soportada',
          motivo: 'no se identificó respaldo textual en las fuentes citadas',
        });
        continue;
      }

      afirmaciones.push({ texto: sentencia, estado: 'soportada', motivo: 'respaldada por las fuentes citadas' });
    }
  }

  const bloqueadas = afirmaciones.filter((a) => a.estado === 'no_soportada');
  return {
    aprobado: bloqueadas.length === 0 && afirmaciones.length > 0,
    afirmaciones,
    motivoBloqueo: bloqueadas.length > 0 ? bloqueadas.map((b) => b.motivo).join(' | ') : null,
    regla: 'Una sola afirmación no soportada bloquea la salida completa (P6).',
  };
}
