/** Documentos legales del proyecto. Redactados desde los datos reales del
 *  proyecto —normas, instituciones, lugares y flujos concretos—, no desde
 *  plantillas. Un solo texto genérico hace fallar la auditoría de la etapa. */

export interface SeccionLegal {
  titulo: string;
  parrafos?: string[];
  lista?: string[];
}

export interface DocLegal {
  slug: string;
  titulo: string;
  resumenSimple: string[];
  secciones: SeccionLegal[];
}

export const DOCS_LEGAL: DocLegal[] = [
  {
    slug: 'privacidad',
    titulo: 'Política de Privacidad',
    resumenSimple: [
      'Guardamos solo lo necesario para verificar y mostrar su caso; su identidad puede quedar reservada.',
      'Sus derechos de acceso, rectificación, cancelación y oposición son gratuitos y se atienden por el mismo canal.',
      'Ciertas tareas usan inteligencia artificial con apoyo humano; puede pedir revisión humana de cualquier decisión.',
    ],
    secciones: [
      {
        titulo: 'Responsable del tratamiento',
        parrafos: [
          'Responsable: proyecto WillayPacha AI (instancia de demostración del hackathon Meta Global AI Developer Hackathon). Representante en el Perú: el equipo constructor del proyecto, con domicilio de contacto publicado en el repositorio oficial. Esta instancia no opera aún como servicio comercial y no realiza tratamiento masivo de datos.',
        ],
      },
      {
        titulo: 'Datos que se tratan y con qué finalidad',
        lista: [
          'Relato del caso y zona aproximada: verificar el caso y, si se aprueba, publicarlo con su leyenda de alcance.',
          'Contacto (correo): comunicar el estado del caso y atender los derechos ARCO. Nunca se publica.',
          'Identidad (opcional): si elige identidad reservada, solo el equipo verificador puede verla; no aparece en ninguna vista pública.',
          'Evidencia (fotos, videos, audios, PDF): verificar autenticidad e integridad (huella SHA-256), preparar anexos y publicar el caso si se aprueba.',
          'Metadatos de las evidencias (fecha, coordenadas, cámara): contrastar el relato durante la revisión; por defecto se ocultan de las vistas públicas.',
        ],
      },
      {
        titulo: 'Encargados y transferencia internacional',
        parrafos: [
          'Encargados de tratamiento declarados: la Meta Model API (procesamiento con IA de los textos de consultas y reportes), el proveedor de alojamiento de la aplicación y la plataforma WhatsApp Cloud API, cuando el canal esté habilitado, como vía de recepción y devolución de mensajes.',
          'El uso de APIs globales implica transferencia internacional de datos. Las garantías aplicadas son las de la Ley N.° 29733 y su Reglamento (D.S. N.° 016-2024-JUS): encargados identificados, mínima transmisión de datos (los textos enviados al modelo no incluyen contacto ni identidad), y registro de la transferencia en este aviso.',
        ],
      },
      {
        titulo: 'Plazos de conservación',
        parrafos: [
          'Los casos y sus evidencias se conservan mientras el caso esté en verificación o publicado, y se eliminan cuando la comunidad los retira (borrado efectivo) o al ejercer el derecho de cancelación. Las bitácoras públicas conservan eventos sin datos personales.',
        ],
      },
      {
        titulo: 'Derechos ARCO y decisiones automatizadas',
        parrafos: [
          'Puede ejercer en cualquier momento y de forma gratuita sus derechos de acceso, rectificación, cancelación y oposición, escribiendo al canal de contacto del proyecto. La plataforma incorpora una vía directa: sección «Seguimiento y retiro» para el retiro con borrado efectivo, y el endpoint ARCO para acceso y rectificación.',
          'Ciertas tareas cuentan con apoyo automatizado (consistencia automática del filtro de casos, explicaciones generadas). Ninguna automatización decide la publicación de un caso: la decisión es de dos revisores humanos. Puede pedir revisión humana de cualquier resultado automático por el mismo canal.',
        ],
      },
      {
        titulo: 'Reclamos',
        parrafos: [
          'Ante cualquier incumplimiento puede reclamar ante el responsable del tratamiento y, en segunda instancia, ante la Autoridad Nacional de Protección de Datos Personales del Perú.',
        ],
      },
    ],
  },
  {
    slug: 'terminos',
    titulo: 'Términos de Uso',
    resumenSimple: [
      'Esta plataforma informa y ordena información pública: no fiscaliza, no asesora jurídicamente y no presenta denuncias.',
      'La evidencia que sube sigue siendo de su comunidad; la plataforma recibe solo una licencia de uso.',
      'Todo documento generado es un borrador hasta que un especialista colegiado lo aprueba.',
    ],
    secciones: [
      {
        titulo: 'Qué es y qué no es la plataforma',
        lista: [
          'Es: un sistema de información que reúne, cita y explica documentos ambientales oficiales en español, quechua, aimara y asháninka (con estados de validación declarados), recibe casos comunitarios con filtro de verificación y prepara borradores de documentos.',
          'No es: un organismo fiscalizador, un estudio jurídico ni un laboratorio. No presenta denuncias ni solicitudes ante ninguna entidad, no firma documentos, no reemplaza a OEFA, a la ANA, a un perito ni a un profesional colegiado.',
        ],
      },
      {
        titulo: 'Reglas para cargar casos',
        parrafos: [
          'Quien carga un caso declara contar con legitimidad para hacerlo, acepta el filtro de verificación y las reglas de publicación, y garantiza que la evidencia es propia o autorizada. Está prohibido subir contenido con menores identificables, datos individuales de salud, ubicaciones exactas de viviendas o datos personales de terceros.',
        ],
      },
      {
        titulo: 'Titularidad comunal de las evidencias',
        parrafos: [
          'La propiedad de las evidencias permanece en la comunidad que las aporta. La plataforma recibe únicamente una licencia de uso para verificar el caso y, si se aprueba, difundirlo con su leyenda. El retiro del caso implica la eliminación efectiva de ficha, evidencia y transcripciones.',
        ],
      },
      {
        titulo: 'Suspensión y cambios',
        parrafos: [
          'El equipo puede suspender casos en revisión mientras se verifica su cumplimiento de estas reglas. Los cambios a estos términos se publican en esta página con su fecha; el documento prevaleciente es el de la fuente oficial citada en cada registro.',
        ],
      },
    ],
  },
  {
    slug: 'aviso',
    titulo: 'Aviso Legal',
    resumenSimple: [
      'La información oficial se reproduce con fines informativos y con cita: la fuente primaria prevalece.',
      'Los documentos generados son borradores hasta la firma de un experto colegiado.',
      'El semáforo evalúa documentos, no empresas.',
    ],
    secciones: [
      {
        titulo: 'Naturaleza de la información',
        parrafos: [
          'Los registros mostrados reproducen información pública de OEFA, SENACE, ANA y otras fuentes oficiales, con cita literal, fecha y enlace al portal institucional junto con el término de búsqueda del documento. La fuente primaria prevalece sobre cualquier resumen de esta plataforma. Si la fuente oficial corrige un dato, el registro se actualiza con la misma visibilidad con la que se publicó el original, dejando constancia en la bitácora pública del registro.',
        ],
      },
      {
        titulo: 'Documentos generados',
        parrafos: [
          'Actas, informes y denuncias generados son borradores con franja visible, sin firma y sin fecha de presentación. Solo adquieren valor para su presentación tras la revisión y aprobación de un especialista colegiado (ingeniero ambiental o civil, o abogado), identificado con nombre y colegiatura. La plataforma no garantiza resultados ante autoridad alguna.',
        ],
      },
      {
        titulo: 'Sobre el semáforo y el vocabulario',
        parrafos: [
          'El semáforo mide el contenido de la información oficial disponible (hallazgo vigente, procedimiento en curso, evaluación sin hallazgo): no existe nota ni ranking de empresas. Una medida preventiva no es una sanción; una reconsideración fundada en parte no es una absolución; una confirmación en apelación no agota necesariamente la historia. El sistema usa el lenguaje de los actos oficiales y deja que el documento hable.',
        ],
      },
      {
        titulo: 'Marcas y terceros',
        parrafos: [
          'Los nombres de instituciones, empresas y unidades se citan exclusivamente como aparecen en los documentos públicos. Este proyecto no está afiliado a Meta, OEFA, SENACE ni ANA; los modelos de Meta se usan conforme a sus licencias (ver Transparencia de IA y TERCEROS.md).',
        ],
      },
    ],
  },
  {
    slug: 'contenido',
    titulo: 'Política de Contenido y Moderación',
    resumenSimple: [
      'Ningún caso se publica directo: pasa por un filtro de cinco pasos con dos revisores humanos.',
      'El retiro es un derecho permanente y borra todo, no solo la vista pública.',
      'Cualquier tercero puede pedir rectificación de un registro con bitácora pública.',
    ],
    secciones: [
      {
        titulo: 'Filtro de verificación en cinco pasos',
        lista: [
          'Paso 0 · Registro protegido: consentimiento informado y opción de identidad reservada.',
          'Paso 1 · Evidencia íntegra: huella SHA-256 en el momento de la carga, fecha registrada, metadatos con opción de ocultarse; la evidencia no se edita jamás (una incorporación posterior es una nueva versión con su propia huella).',
          'Paso 2 · Consistencia automática: la IA compara lugar y fecha declarados con los metadatos, detecta duplicados y cruza el lugar con la información oficial disponible. La ausencia de contraste no bloquea el caso: se marca «sin contraste oficial disponible».',
          'Paso 3 · Revisión humana: dos revisores, al menos uno con perfil ambiental o legal, examinan autenticidad, integridad, consistencia del relato, ausencia de menores identificables y de datos personales de terceros.',
          'Paso 4 · Publicación por niveles: Recibido (privado) → En verificación → Evidencia verificada o Descartado con motivo y derecho a apelación.',
        ],
      },
      {
        titulo: 'Motivos de descarte',
        lista: [
          'Menores identificables en la evidencia (regla absoluta).',
          'Ubicación exacta de viviendas o datos individuales de salud.',
          'Evidencia duplicada o presentada como caso distinto.',
          'Datos personales de terceros sin legitimidad.',
          'Inconsistencia sustancial entre relato y evidencia detectada por los revisores.',
        ],
      },
      {
        titulo: 'Apelación y retiro',
        parrafos: [
          'Un caso descartado indica su motivo y la comunidad conserva el derecho de apelación por su canal de contacto. El retiro es permanente: elimina ficha, evidencias y transcripciones del sistema (borrado efectivo), no solo de la vista pública.',
        ],
      },
      {
        titulo: 'Rectificación de terceros',
        parrafos: [
          'Cualquier tercero —incluida la empresa aludida— puede pedir la rectificación de un registro con su alegación y contacto. Si se acepta, el registro se corrige con la misma visibilidad con la que se publicó el dato original y la bitácora pública del registro deja constancia de qué se corrigió, cuándo y en virtud de qué documento.',
        ],
      },
    ],
  },
  {
    slug: 'seguridad',
    titulo: 'Política de Seguridad',
    resumenSimple: [
      'Las claves viven solo en el servidor; el navegador nunca llama directo a la API.',
      'El acceso a las evidencias está controlado por roles y queda en bitácora.',
      'Los incidentes se notifican a la autoridad y a los afectados, en principio dentro de las 48 horas.',
    ],
    secciones: [
      {
        titulo: 'Medidas técnicas',
        lista: [
          'Claves de API exclusivamente en variables de entorno del servidor; el archivo .env está fuera del control de versiones (existe .env.example sin valores).',
          'El backend es el único poseedor de la clave: el navegador nunca llama directamente a la Meta Model API.',
          'Cifrado en tránsito (HTTPS en despliegue; en la demo local, el propio equipo es el anfitrión).',
          'Control de acceso por roles: comunidad, verificador, experto, administrador. En esta instancia de demostración los roles se acreditan con claves declaradas (ver /api/salud); en producción se sustituye por autenticación real con cuentas individuales.',
          'Bitácora de accesos a las evidencias: solo los roles autorizados pueden descargar una evidencia cargada.',
          'Dependencias fijadas con archivo de bloqueo y auditoría de vulnerabilidades (npm audit) en la integración continua.',
          'Escaneo de secretos sobre todo el árbol del repositorio antes de hacerlo público.',
        ],
      },
      {
        titulo: 'Copias de seguridad',
        parrafos: [
          'Los datos semilla viven en el repositorio (control de versiones = respaldo). El estado dinámico (db.json y evidencias) se respalda en el servidor y existe un script de respaldo local de la demostración (datos, audios y construcción estática) como plan B sin internet.',
        ],
      },
      {
        titulo: 'Protocolo de incidentes',
        lista: [
          'Detección y contención: aislar el servicio afectado y preservar registros de aplicación (sin contenido sensible en los registros).',
          'Evaluación del alcance: qué datos personales estuvieron expuestos.',
          'Notificación a la Autoridad Nacional de Protección de Datos Personales, en principio dentro de las 48 horas de detectado el incidente, conforme al Reglamento D.S. N.° 016-2024-JUS.',
          'Comunicación a los afectados por el canal registrado, con la descripción del incidente y las medidas adoptadas.',
        ],
      },
      {
        titulo: 'Reporte de vulnerabilidades',
        parrafos: [
          'Si encuentra una vulnerabilidad, repórtela al canal de contacto del proyecto con los pasos para reproducirla. Pedimos divulgación coordinada y reconocemos públicamente los reportes válidos, si el reportante lo desea.',
        ],
      },
    ],
  },
  {
    slug: 'transparencia-ia',
    titulo: 'Aviso de Transparencia de IA',
    resumenSimple: [
      'Ningún texto generado se publica sin pasar por un verificador (P6).',
      'La IA nunca decide la publicación de un caso ni firma documentos.',
      'Cada salida lleva Registro de Generación: modelo, prompt, fuentes, fecha y hash.',
    ],
    secciones: [
      {
        titulo: 'Qué hace y qué no hace la inteligencia artificial, módulo por módulo',
        lista: [
          'Radar (Módulo A): sin IA. Muestra registros curados a mano con fuente, fecha y cita.',
          'Asistente Rimay (Módulo B): la IA explica registros verificados en lenguaje simple y, como borrador, en lengua originaria. No da asesoría legal ni diagnósticos; se presenta como IA al abrir la sesión; lo que no consta, lo dice.',
          'Laboratorio de Evidencia (Módulo C): la IA (o su respaldo local declarado) delimita áreas visualmente anómalas. No mide química y jamás se dice «contaminación detectada».',
          'Documentos (Módulo D): la IA arma borradores desde fichas verificadas. No firma, no fecha presentaciones y no envía nada.',
          'Casos (Módulo E): la IA actúa como asistente del filtro (consistencia, duplicados, cruce con la información oficial), nunca como juez. Dos revisores humanos deciden la publicación.',
        ],
      },
      {
        titulo: 'Modelos y cadena de prompts',
        parrafos: [
          'Motor técnico-legal y multilingüe: Muse Spark (Meta Model API) cuando hay clave configurada; sin clave, el sistema corre en MODO DEMO declarado con respuestas ancladas a los datos semilla. Capa de idiomas: MMS de Meta (checkpoints facebook/mms-tts-quz, -ayr, -cni; CC-BY-NC 4.0) para síntesis de voz ejecutada solo en el servidor; Omnilingual ASR o MMS-1B-all para transcripción; NLLB-200 solo para quechua y aimara. SeamlessM4T quedó descartado: su lista oficial no incluye estas lenguas.',
          'Cadena de prompts versionada: P1 extractor → P2/P3 explicadores → P4 estructurador de reportes → P5 generador de documentos → P6 verificador. El P6 marca afirmación por afirmación y una sola afirmación no soportada bloquea la salida completa. La corrida de las diez preguntas trampa se guarda como evidencia en los informes de auditoría.',
        ],
      },
      {
        titulo: 'Registro de Generación',
        parrafos: [
          'Cada salida de la IA —explicación, documento, lámina— porta su Registro de Generación: modelo y versión, fecha y hora, versión del prompt empleado, identificadores de las fuentes citadas y hash del documento fuente. En los PDF el registro se imprime como pie visible, junto al estado de la revisión humana o experta.',
        ],
      },
      {
        titulo: 'Límites declarados',
        lista: [
          'Variedades: los checkpoints disponibles no son réplica exacta de las variedades locales (quz = quechua del Cusco; cni = asháninka general; quy de NLLB = Ayacucho). La validación por hablantes es obligatoria.',
          'Calidad: modelos de investigación con corpus limitados; la inteligibilidad se prueba con hablantes antes de uso público serio.',
          'Licencias: MMS y NLLB-200 son CC-BY-NC 4.0 (no comercial); Omnilingual ASR es Apache 2.0. Todos los modelos usados se declaran en TERCEROS.md.',
        ],
      },
    ],
  },
];
