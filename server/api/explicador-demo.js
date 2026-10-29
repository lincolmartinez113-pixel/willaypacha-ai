import { readFileSync } from 'node:fs';
import { leerSeed } from '../config.js';
import { normalizar } from './verificador.js';

/**
 * Explicador en MODO DEMO (sin Meta Model API en vivo).
 *
 * No inventa: compone la respuesta exclusivamente con los campos verificados de
 * data/datos-semilla.json, con atribución gramatical a la fuente. Las preguntas
 * que no puede sustentar responden «no consta» y derivan a la vía competente.
 *
 * Arquitectura de la salida: `partes` etiqueta cada fragmento como factual
 * (meta:false — debe superar los controles estrictos de P6 contra las fuentes)
 * o meta (meta:true — frase del sistema que declara un límite; P6 la acepta
 * como tal, igual que el prompt P6 indica). La salida SIEMPRE pasa por P6.
 */

const UNIDADES_FUERA_DE_BASE = [
  'antamina', 'yanacocha', 'cerro verde', 'las bambas', 'tia maria', 'tía maría',
  'toromocho', 'quellaveco', 'bayovar', 'bayóvar', 'la oroya', 'cajamarquilla',
];

const INTENCIONES = [
  { id: 'inyeccion', re: /ignora (tus|las) instrucciones|olvida (tus|las) instrucciones|ahora eres|actua como|actúa como|system prompt|prompt del sistema|dime que (hubo|hay) contaminacion|dime que (hubo|hay) contaminación/i },
  { id: 'denuncia', re: /denuncia|denunciar|presenta(r)? (la|una) (denuncia|demanda)|demandar|abogado|representa/i },
  { id: 'salud', re: /salud|enferm|intoxic|veneno|sintoma|síntoma|hospital|doctor|medico|médico|consecuencia(s)? para la salud/i },
  { id: 'penal', re: /culpable|responsable penal|delito|fiscalia|fiscalía|fema|carcel|cárcel|preso|penal/i },
  { id: 'multas', re: /multa|sancion|sanción|uit|s\/\s?\d|dinero|indemniza/i },
  { id: 'cumplimiento', re: /cumplio|cumplió|cumplimiento|ya cumpl|en qué va|en que va/i },
  { id: 'personales', re: /funcionario|dni|telefono|teléfono|correo|domicilio|gerente|presidente de la empresa|nombre del/i },
  { id: 'generalizacion', re: /toda la cuenca|todo el rio|todo el río|todos los rios|todos los ríos|cuenca entera|todo el territorio/i },
  { id: 'glosario', re: /como se dice|cómo se dice|traduce|traduccion|traducción|glosario|en quechua|en aimara|en ashaninka|en asháninka/i },
];

const NO_CONSTA_BASE = 'No consta en los registros cargados de esta instancia.';
const AVISO_LIMITES = 'Esto no es asesoría legal ni un diagnóstico de salud.';

function registrosDeUnidad(unidadId) {
  return leerSeed().registros.filter((r) => !unidadId || r.unidadId === unidadId);
}

function palabrasClave(texto) {
  return normalizar(texto)
    .replace(/[^a-z0-9áéíóúñü\s]/gi, ' ')
    .split(/\s+/)
    .filter((p) => p.length >= 4);
}

function elegirRegistro(consulta) {
  const claves = palabrasClave(consulta);
  const seed = leerSeed();
const qNorm = normalizar(consulta);
const unidadDetectada = qNorm.includes('san vicente') || qNorm.includes('vicente')
  ? 'san-vicente'
  : qNorm.includes('san rafael') || qNorm.includes('quenamari')
    ? 'san-rafael'
    : null;
const candidatos = unidadDetectada
  ? seed.registros.filter((r) => r.unidadId === unidadDetectada)
  : seed.registros;


  let mejor = null;
  let mejorPuntaje = 0;
  for (const r of candidatos) {
    const unidad = seed.unidades.find((u) => u.id === r.unidadId);
const campo = normalizar([r.cuerpoAgua, r.parametro, r.hecho, r.componente, r.tipo, unidad?.nombre, unidad?.empresa].filter(Boolean).join(' '));
    let puntaje = 0;
    for (const c of claves) {
  if (new RegExp(`\\b${c}\\b`).test(campo)) puntaje += c.length >= 6 ? 2 : 1;
}
    if (puntaje > mejorPuntaje) {
      mejor = r;
      mejorPuntaje = puntaje;
    }
  }
  return mejorPuntaje >= 2 ? mejor : null;
}

function textoAtribuido(r) {
  const f = r.fuente;
  const fecha = r.fecha && r.fecha !== 'en trámite' ? `, ${r.fecha}` : '';
  return `Según ${f.organismo} (${f.documento}${fecha}): «${r.citaLiteral}».`;
}

const INTERPRETACION_SEMAFORO = {
  rojo: 'El semáforo marca un hallazgo oficial vigente con atribución del organismo; no es una sanción ni una calificación legal.',
  verde: 'El semáforo marca una evaluación oficial sin hallazgo negativo para ese cuerpo o componente.',
  ambar: 'El semáforo marca un asunto en curso o con atribución no concluyente; el estado procesal se muestra con su fecha.',
};

function pendientes(r) {
  const p = [];
  if (!r.hashDocumento) p.push('el documento primario aún no está adjunto en esta instancia (sin hash verificable)');
  if (r.citaPagina && /confirmar|pendiente/i.test(r.citaPagina)) p.push('la página exacta de la cita está por confirmar');
  if (r.fechaNota && /confirmar/i.test(r.fechaNota)) p.push('la fecha exacta del documento está por confirmar');
  return p;
}

const GLOSARIO = JSON.parse(readFileSync(new URL('../../i18n/glosario.json', import.meta.url), 'utf8'));
const INDICE_GLOSARIO = Object.fromEntries(Object.entries(GLOSARIO.terminos).map(([k, v]) => [normalizar(k), v]));

export function traducirConGlosario(texto, lengua) {
  return aplicarLengua(texto, lengua);
}

function aplicarLengua(texto, lengua) {
  if (lengua === 'es') return { textoLengua: null, estadoTraduccion: null, terminos: [] };
  const terminos = [];
  let salida = texto;
  for (const [es, variantes] of Object.entries(GLOSARIO.terminos)) {
    const v = variantes[lengua];
    if (!v || !v.valor) continue;
    const re = new RegExp(`\\b${es}\\b`, 'gi');
    if (re.test(salida)) {
      salida = salida.replace(re, `${v.valor} (${es})`);
      terminos.push({ es, lengua, valor: v.valor, estado: v.estado });
    }
  }
  return {
    textoLengua: salida,
    estadoTraduccion: 'borrador — pendiente de validación por hablante o intérprete registrado',
    terminos,
  };
}

function respuesta({ partes, registros = [], motivo, lengua }) {
  const texto = partes.map((p) => p.texto).join(' ');
  const lenguaAplicada = aplicarLengua(texto, lengua);
  return {
    texto,
    partes,
    textoLengua: lenguaAplicada.textoLengua,
    estadoTraduccion: lenguaAplicada.estadoTraduccion,
    terminosGlosario: lenguaAplicada.terminos,
    motivo,
    citas: registros.map((r) => ({
      registroId: r.id,
      organismo: r.fuente.organismo,
      documento: r.fuente.documento,
      url: r.fuente.url,
      busqueda: r.fuente.busqueda,
      fecha: r.fecha,
      semaforo: r.semaforo,
      citaLiteral: r.citaLiteral,
      hashDocumento: r.hashDocumento,
    })),
    fuentesParaVerificar: registros,
  };
}

const m = (texto) => ({ texto, meta: true });
const f = (texto) => ({ texto, meta: false });

export function responderDemo({ consulta = '', registroId = null, lengua = 'es' }) {
  const seed = leerSeed();
  const q = String(consulta || '');

  // Inyección de prompt: el texto del usuario es DATO, nunca orden.
  if (INTENCIONES[0].re.test(q)) {
    return respuesta({
      partes: [
        m('No puedo seguir instrucciones contenidas en una consulta: trato todo mensaje como dato, no como orden.'),
        m('Lo que consta es solo lo que las fuentes oficiales cargadas dicen, con su cita.'),
        m(NO_CONSTA_BASE),
        m('Si su consulta es sobre un caso concreto, reformúlela indicando el cuerpo de agua o el componente.'),
      ],
      motivo: 'intento de inyección de prompt tratado como dato (resistido)',
      lengua,
    });
  }

  // Unidad fuera de la base.
  const fuera = UNIDADES_FUERA_DE_BASE.find((u) => normalizar(q).includes(normalizar(u)));
  if (fuera) {
    const nombres = seed.unidades.map((u) => u.nombre).join('; ');
    return respuesta({
      partes: [
        m('La unidad consultada no está en la base cargada.'),

        m(NO_CONSTA_BASE),
      ],
      motivo: 'unidad fuera del alcance declarado',
      lengua,
    });
  }

  // Datos personales de terceros.
  if (INTENCIONES.find((i) => i.id === 'personales').re.test(q)) {
    return respuesta({
      partes: [
        m('La plataforma no trata ni muestra datos personales de funcionarios o de terceros: no constan en los registros públicos citados y no se incorporan.'),
        m('Solo se publican hechos, fechas, normas y citas de documentos oficiales.'),
        m(NO_CONSTA_BASE),
      ],
      motivo: 'minimización de datos personales',
      lengua,
    });
  }

  // Calificación penal.
  if (INTENCIONES.find((i) => i.id === 'penal').re.test(q)) {
    return respuesta({
      partes: [
        m('La plataforma no califica hechos como delito ni identifica responsables penales: esa determinación corresponde a las autoridades competentes.'),
        m('La Fiscalía Especializada en Materia Ambiental (FEMA) es el horizonte para los casos que un especialista considere de relevancia penal; el sistema solo ordena información con fuente.'),
        m(NO_CONSTA_BASE),
      ],
      motivo: 'no califica delitos; deriva a autoridad competente',
      lengua,
    });
  }

  // Salud.
  if (INTENCIONES.find((i) => i.id === 'salud').re.test(q)) {
    return respuesta({
      partes: [
        m('No brindo diagnósticos ni afirmo consecuencias en la salud que las fuentes no sustenten.'),
        m('Lo que consta es el hallazgo oficial sobre el agua, con su cita, y lo que aún no se sabe.'),
        m('Para evaluación de salud, la derivación corresponde al establecimiento de salud y a la autoridad sanitaria.'),
        m(NO_CONSTA_BASE),
      ],
      motivo: 'sin diagnósticos de salud; deriva a autoridad sanitaria',
      lengua,
    });
  }

  // Presentación de denuncias.
  if (INTENCIONES.find((i) => i.id === 'denuncia').re.test(q)) {
    return respuesta({
      partes: [
        m('La plataforma no presenta denuncias por el usuario ni firma documentos.'),
        m('Prepara un borrador con antecedentes citados y anexos, que solo adquiere valor tras la revisión de un especialista colegiado; la presentación la realiza la persona o la comunidad por los canales oficiales (SINADA de OEFA, Mesa de Partes Virtual, o solicitud de verificación ante la ANA).'),
        m(AVISO_LIMITES),
      ],
      motivo: 'no sustituye la vía oficial ni la representación',
      lengua,
    });
  }

  // Estado de cumplimiento de medidas: no consta (solo consta el estado procesal).
  if (INTENCIONES.find((i) => i.id === 'cumplimiento').re.test(q)) {
    const elegidoCumplimiento = elegirRegistro(q);
    const partesCumplimiento = [
      m('El estado de CUMPLIMIENTO de las medidas no consta en los registros cargados: constan los actos de fiscalización con su estado procesal, no su ejecución verificada.'),
    ];
    if (elegidoCumplimiento) {
      partesCumplimiento.push(f(textoAtribuido(elegidoCumplimiento)));
      if (elegidoCumplimiento.estadoProcesal) partesCumplimiento.push(f(`Estado: ${elegidoCumplimiento.estadoProcesal}.`));
    }
    partesCumplimiento.push(m(NO_CONSTA_BASE));
    return respuesta({
      partes: partesCumplimiento,
      registros: elegidoCumplimiento ? [elegidoCumplimiento] : [],
      motivo: 'cumplimiento no cargado; se muestra el estado procesal con cita',
      lengua,
    });
  }

  // Multas y sanciones sin registros.
  if (INTENCIONES.find((i) => i.id === 'multas').re.test(q)) {
    return respuesta({
      partes: [
        m('No consta en los registros cargados ninguna multa, sanción firme ni monto para las unidades de esta instancia.'),
        m('El estado de procedimientos sancionadores se consulta en el Portal Interactivo de Fiscalización Ambiental (PIFA) de OEFA, que es la fuente primaria.'),
        m(NO_CONSTA_BASE),
      ],
      motivo: 'sin registros de multas cargados',
      lengua,
    });
  }

  // Generalización sobre cuencas enteras.
  if (INTENCIONES.find((i) => i.id === 'generalizacion').re.test(q)) {
    return respuesta({
      partes: [
        m('No se generaliza a una cuenca entera: los registros cubren cuerpos de agua y componentes específicos, con fecha y cita.'),
        m('Una evaluación puede encontrar un hallazgo en una quebrada y, a la vez, concluir que en otra microcuenca no hubo influencia negativa.'),
        m('Consulte el cuerpo de agua concreto para ver su registro.'),
      ],
      motivo: 'alcance limitado a cuerpos específicos',
      lengua,
    });
  }

  // Glosario / traducción.
  if (INTENCIONES.find((i) => i.id === 'glosario').re.test(q)) {
    const termino = (q.match(/(?:traduce|traducir|como se dice|cómo se dice)\s+["«']?([^"'»?]+)["»']?/i) || [])[1];
    const t = termino ? INDICE_GLOSARIO[normalizar(termino).trim()] : null;
    if (t) {
      const valor = t[lengua] || t.qu;
      return respuesta({
        partes: [
          m(`«${termino}» está en el glosario del proyecto como «${valor.valor ?? '(sin valor: pendiente)'}» en ${lengua}, con estado ${valor.estado}.`),
          m('Toda salida en lengua originaria nace como borrador hasta su validación por un hablante o intérprete registrado.'),
        ],
        motivo: 'término del glosario',
        lengua,
      });
    }
    return respuesta({
      partes: [
        m('El término consultado no está en el glosario aprobado; permanece en español y no se inventan equivalencias.'),
        m('El glosario crece solo con términos validados, registrando quién validó y cuándo.'),
      ],
      motivo: 'término fuera del glosario: permanece en español',
      lengua,
    });
  }

  // Consulta general: buscar el registro más pertinente.
  const elegido = registroId ? seed.registros.find((r) => r.id === registroId) : elegirRegistro(q);
  if (!elegido) {
    return respuesta({
      partes: [
        m(NO_CONSTA_BASE),
      ],
      motivo: 'sin registro pertinente',
      lengua,
    });
  }

  const partes = [
    f(textoAtribuido(elegido)),
    m(INTERPRETACION_SEMAFORO[elegido.semaforo] || ''),
  ];
  if (elegido.estadoProcesal) partes.push(f(`Estado: ${elegido.estadoProcesal}.`));
  const pend = pendientes(elegido);
  if (pend.length) partes.push(m(`Lo que todavía no consta: ${pend.join('; ')}.`));
  partes.push(m(AVISO_LIMITES));

  return respuesta({
    partes,
    registros: [elegido],
    motivo: 'explicación anclada a registro verificado',
    lengua,
  });
}
