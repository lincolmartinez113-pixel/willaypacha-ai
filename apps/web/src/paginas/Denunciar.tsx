import { useMemo, useState } from 'react';
import { useLengua } from '../i18n';
import Icono, { type NombreIcono } from '../componentes/Icono';
import { Chakana, CintaTextil } from '../componentes/Simbolos';
import { INSTITUCIONES, FECHA_VERIFICACION_ENLACES } from '../datos-instituciones';

/** Guía práctica de denuncia y actuación. Contenido informativo con base
 *  normativa real del Perú. La plataforma NO presenta denuncias: prepara
 *  antecedentes y borradores; la presentación la realiza la persona por los
 *  canales oficiales. Los textos en lenguas originarias se generan como
 *  BORRADOR (glosario + sustitución declarada), pendientes de validación. */

const SITUACIONES: { id: string; texto: string; rutas: (keyof typeof INSTITUCIONES)[]; nota: string }[] = [
  { id: 'agua-consumo', texto: 'El agua de consumo, el ganado o los cultivos están en contacto con el agua sospechosa.', rutas: ['ana', 'oefa'], nota: 'El agua de consumo es competencia del Estado en su conjunto: pida a la ANA verificación del cuerpo de agua y denuncie la actividad ante OEFA/SINADA si hay una unidad o efluente involucrado.' },
  { id: 'color-olor', texto: 'El color, olor o espuma del agua cambió y se repite en el tiempo.', rutas: ['oefa', 'ana'], nota: 'Documente CADA episodio con fecha (Módulo C). Los episodios aislados se pierden; la serie de fechas es la que sostiene el caso.' },
  { id: 'peces', texto: 'Han muerto peces o plantas acuáticas de forma inusual.', rutas: ['oefa', 'ana'], nota: 'Hecho de alta relevancia para la fiscalización: fotografíe con fecha y lugar, y denuncie en las horas siguientes si es posible.' },
  { id: 'salud', texto: 'Hay personas con malestares y un médico señaló posible relación ambiental.', rutas: ['minsa', 'oefa'], nota: 'La salud primero: atención y registro en el establecimiento. El informe médico acompaña la denuncia; la plataforma no da diagnósticos.' },
  { id: 'cronico', texto: 'El problema ocurre desde hace semanas o meses y sigue ahí.', rutas: ['oefa', 'defensoria'], nota: 'Un problema sostenido amerita seguimiento activo: guarde el número de expediente y si las respuestas son incompletas, reitere y considere a la Defensoría.' },
  { id: 'contradiccion', texto: 'Los documentos oficiales que encontramos NO coinciden con lo que ustedes ven.', rutas: ['oefa', 'senace'], nota: 'Ese contraste es justo lo que el sistema documenta: revisen el estudio (SENACE/EVA), adjunten evidencia con huella y denuncien ante OEFA señalando la discrepancia con los antecedentes citados.' },
];

const PASOS: { num: string; titulo: string; cuerpo: string[]; icono: NombreIcono }[] = [
  {
    num: '1',
    titulo: 'Documentar lo que ocurre (con seguridad)',
    icono: 'aperture',
    cuerpo: [
      'Fotografíe y describa los hechos con fecha y lugar. Use el Laboratorio de Evidencia: calcula la huella SHA-256 en su propio dispositivo, muestra los metadatos y permite ocultarlos de las vistas públicas.',
      'Registre el caso en Casos de la Comunidad: queda con consentimiento informado, identidad reservada si lo decide, y pasa un filtro con dos revisores humanos antes de publicarse.',
      'Recuerde el límite: la evidencia prueba que el archivo no fue alterado desde su carga; lo que la fotografía muestra lo determina OEFA o un laboratorio.',
    ],
  },
  {
    num: '2',
    titulo: 'Reunir los antecedentes oficiales',
    icono: 'libro',
    cuerpo: [
      'En el Radar de Transparencia busque qué dicen los documentos sobre esa unidad y ese cuerpo de agua: cada registro tiene fuente, fecha y cita que puede imprimir o adjuntar.',
      'Contraste real cargado en esta instancia: en la quebrada Chogñacota el estudio de OEFA encontró superación de estándares atribuida al efluente P-4; en la microcuenca Larancota concluyó que no hubo influencia negativa. Ambas conclusiones se muestran con el mismo cuidado.',
      'Los estudios aprobados y sus modificaciones se consultan en la plataforma EVA y en la Consulta Ciudadana del SENACE (enlaces en el directorio de abajo).',
      'Los valores contra los que se compara: ECA del D.S. N.° 004-2017-MINAM (en el cuerpo de agua) y LMP del D.S. N.° 010-2010-MINAM (en lo que la actividad descarga).',
    ],
  },
  {
    num: '3',
    titulo: 'Evaluar la gravedad y elegir la ruta',
    icono: 'alerta',
    cuerpo: [
      'Use el evaluador de la parte superior: marca lo que está pasando y genera una hoja de ruta con las autoridades sugeridas, imprimible para llevarla a la asamblea.',
      'Si cree que hay delito ambiental, la ruta la evalúa la FEMA (Ministerio Público); la plataforma no califica delitos.',
    ],
  },
  {
    num: '4',
    titulo: 'Preparar los documentos',
    icono: 'documento',
    cuerpo: [
      'La lista de abajo reúne lo que habitualmente piden las autoridades. Los documentos con marcadores [COMPLETAR] se revisan y completan ustedes; ninguno sale firmado por la máquina.',
      'Genere el borrador en Documentos y revise: acta de asamblea bilingüe, informe técnico de contraste ECA/LMP, o denuncia/solicitud.',
    ],
  },
  {
    num: '5',
    titulo: 'Presentar por el canal oficial',
    icono: 'subir',
    cuerpo: [
      'El formulario de denuncias ambientales de OEFA (SINADA) está en línea en facilita.gob.pe; la ANA atiene trámites y Mesa de Partes por su portal; la Defensoría recibe casos en línea por su SID. Enlaces directos en el directorio.',
      'Exija y guarde el NÚMERO DE EXPEDIENTE y el cargo con fecha: es la llave del seguimiento.',
      'Plazos: como regla general del procedimiento administrativo (TUO de la Ley N.° 27444), la entidad responde en 30 días hábiles salvo que su TUPA fije un plazo distinto; el silencio administrativo (positivo o negativo) depende de lo que el TUPA del trámite establezca: verifíquelo en el portal de la entidad. No citamos plazos específicos de cada procedimiento para no desinformar.',
      'Pida que las comunicaciones lleguen por el canal que ustedes indiquen y, si corresponde, solicite intérprete registrado (Ley N.° 29735).',
    ],
  },
  {
    num: '6',
    titulo: 'Hacer seguimiento y buscar la mediación',
    icono: 'reloj',
    cuerpo: [
      'Consulte el expediente periódicamente con su número. Si hay medidas o compromisos, verifique su cumplimiento y registre lo que observa con fecha.',
      'La mediación no reemplaza la fiscalización: la Defensoría del Pueblo facilita mesas de diálogo; OEFA puede convocar acuerdos ambientales. Los compromisos que la empresa asumió en sus estudios se pueden contrastar con lo supervisado.',
      'Si la respuesta es incompleta, procede la apelación o la reiteración por el mismo canal; la Defensoría puede acompañar.',
    ],
  },
];

const DOCUMENTOS = [
  'Documento de identidad de quien presenta (DNI) o ficha RUC de la comunidad.',
  'Si actúa la comunidad: acta de asamblea que autoriza la denuncia (el Módulo D genera un borrador bilingüe para revisar y aprobar en asamblea).',
  'Relato de hechos con fechas: qué se observó, desde cuándo, cada cuánto.',
  'Fotografías o videos con fecha y lugar — el Módulo C calcula su huella SHA-256 y puede ocultar metadatos de personas.',
  'Croquis o referencia de ubicación (zona o cuenca; nunca la ubicación exacta de viviendas en documentos públicos).',
  'Antecedentes oficiales: los registros del Radar con su cita (evaluación de causalidad, resoluciones, monitoreos).',
  'NO tome muestras de agua por cuenta propia para «probar» la contaminación: los análisis valen si siguen el protocolo oficial (muestreo por la ANA u OEFA o un laboratorio acreditado).',
  'Si necesita presentarse en quechua, aimara o asháninka: solicite intérprete o traductor registrado (Ley N.° 29735).',
];

export default function Denunciar() {
  const { lengua, paquete, terminos, esEspanol } = useLengua();
  const [marcadas, setMarcadas] = useState<Record<string, boolean>>({});
  const [verBorrador, setVerBorrador] = useState(false);

  const seleccionadas = SITUACIONES.filter((s) => marcadas[s.id]);
  const rutasSugeridas = useMemo(() => {
    const orden: (keyof typeof INSTITUCIONES)[] = ['oefa', 'ana', 'minsa', 'senace', 'defensoria', 'mp', 'cultura'];
    const conjunto = new Set<keyof typeof INSTITUCIONES>();
    for (const s of seleccionadas) for (const r of s.rutas) conjunto.add(r);
    if (seleccionadas.length >= 3) conjunto.add('defensoria');
    return orden.filter((k) => conjunto.has(k));
  }, [seleccionadas]);

  const terminosLengua = useMemo(
    () =>
      Object.entries(terminos)
        .map(([es_, v]) => ({ es: es_, ...(v[lengua as 'qu' | 'ay' | 'ash'] || { valor: null, estado: 'borrador', respaldadoPor: '' }) }))
        .filter((t) => t.valor),
    [terminos, lengua],
  );

  /** Traducción borrador en cliente: sustitución del glosario aprobado (misma
   *  regla P3) + marca explícita de estado. No se inventan equivalencias. */
  function traducirBorrador(texto: string): string {
    let salida = texto;
    for (const t of terminosLengua) {
      salida = salida.replace(new RegExp(`\\b${t.es}\\b`, 'gi'), `${t.valor} (${t.es})`);
    }
    return salida;
  }

  return (
    <>
      <div className="intro">
        <div className="surge">
          <div className="kicker">Guía práctica · Denunciar y actuar</div>
          <h1>Si el territorio está pidiendo ayuda, esta es la ruta</h1>
          <p className="plomo capitular">
            Qué documentación reunir, ante qué autoridad acudir según lo que está pasando, cómo presentar la
            denuncia, cómo hacer seguimiento y cómo protegerse en el proceso. La plataforma <strong>no presenta
            denuncias</strong> por nadie: ordena antecedentes citados y prepara borradores; la presentación la
            realiza la persona o la comunidad por los canales oficiales.
          </p>
          <div className="intro-acciones">
            <a className="boton secundario" href="#/evidencia"><Icono nombre="aperture" tamano={15} />Documentar evidencia</a>
            <a className="boton secundario" href="#/documentos"><Icono nombre="documento" tamano={15} />Preparar borradores</a>
          </div>
        </div>
        <aside className="ficha surge surge-2" style={{ display: 'grid', placeItems: 'center', textAlign: 'center' }}>
          <Chakana tamano={92} />
          <p className="mini texto-3 mb-0 mt-1">
            Chakana: los tres mundos y el centro. Informar el territorio también es cuidar a quien lo habita.
          </p>
        </aside>
      </div>

      <CintaTextil className="mb-2" />

      {/* ── Evaluador → hoja de ruta ── */}
      <section className="placa esquinas surge surge-2">
        <div className="placa-cabecera">
          <div>
            <div className="placa-cintillo" style={{ marginBottom: '0.4rem' }}><span>Evaluador de situación</span></div>
            <h2>Marque lo que está pasando y reciba su hoja de ruta</h2>
            <p className="placa-sub mb-0">No es un formulario que se envía a nadie: es una guía que se arma en su pantalla con las rutas que corresponden a su caso, lista para imprimir y llevar a la asamblea.</p>
          </div>
          <span className={`chip ${seleccionadas.length >= 3 ? 'rojo' : seleccionadas.length >= 1 ? 'ambar' : 'neutro'}`}>
            <span className="punto" />{seleccionadas.length} situación(es)
          </span>
        </div>
        <div className="triage">
          {SITUACIONES.map((s) => (
            <label key={s.id} className="triage-pregunta">
              <input type="checkbox" checked={!!marcadas[s.id]} onChange={(e) => setMarcadas((m) => ({ ...m, [s.id]: e.target.checked }))} />
              <span>{s.texto}</span>
            </label>
          ))}
        </div>

        {seleccionadas.length > 0 && (
          <div className="hoja-ruta mt-2" role="region" aria-label="Hoja de ruta sugerida">
            <div className="hoja-cabecera">
              <div>
                <div className="ficha-titulo"><span>Hoja de ruta sugerida</span><span>{new Date().toLocaleDateString('es-PE')}</span></div>
                <h3 style={{ fontFamily: 'var(--display)' }}>Para llevar a la asamblea y al canal oficial</h3>
              </div>
              <button className="boton secundario pequeno solo-pantalla" onClick={() => window.print()}>
                <Icono nombre="documento" tamano={13} />
                Imprimir
              </button>
            </div>

            <ol className="lista-hoja">
              {seleccionadas.map((s) => (
                <li key={s.id}>
                  <strong>{s.texto}</strong>
                  <div className="mini texto-3">{s.nota}</div>
                </li>
              ))}
            </ol>

            <h4>Autoridades sugeridas, en este orden</h4>
            <div className="envoltura-chips">
              {rutasSugeridas.map((k, i) => (
                <span key={k} className="chip acento">
                  {i + 1}. {INSTITUCIONES[k].sigla}
                </span>
              ))}
            </div>

            <h4 className="mt-1">Lleve consigo</h4>
            <ul className="lista-doc">
              <li>Relato de hechos con fechas y lugar (zona o cuenca).</li>
              <li>Evidencia fotográfica con huella SHA-256 (Módulo C).</li>
              <li>Antecedentes oficiales citados del Radar (impresos o en PDF).</li>
              <li>DNI y, si actúa la comunidad, acta de asamblea autorizante.</li>
            </ul>

            <p className="mini texto-3 mb-0 mt-05">
              Esta hoja se genera en su navegador con la información que usted marcó. No se envía a ningún
              servidor ni registra datos personales. La presentación de la denuncia sigue siendo decisión de
              la persona o la comunidad por los canales oficiales.
            </p>
          </div>
        )}
      </section>

      {/* ── Pasos ── */}
      <section className="placa revelar">
        <div className="placa-cabecera">
          <div>
            <div className="placa-cintillo" style={{ marginBottom: '0.4rem' }}><span>La ruta, paso a paso</span></div>
            <h2>De la observación a la denuncia presentada</h2>
          </div>
          {!esEspanol && (
            <button className="boton secundario pequeno" onClick={() => setVerBorrador((v) => !v)}>
              <Icono nombre="lenguas" tamano={14} />
              {verBorrador ? 'Ocultar versión en lengua' : `Ver versión borrador en ${paquete.nombreNativo || paquete.nombre}`}
            </button>
          )}
        </div>

        {verBorrador && !esEspanol && (
          <div className="lengua-borrador mb-2">
            <span className="marca-lengua">{paquete.nombreNativo || paquete.nombre} · borrador — pendiente de validación por hablante o intérprete registrado</span>
            Los pasos de esta guía pueden expresarse en {paquete.nombre} usando el glosario aprobado del proyecto; lo que
            aún no está en el glosario permanece en español entre paréntesis:{' '}
            {terminosLengua.map((t) => `${t.valor} (${t.es})`).join(' · ') || 'aún sin términos con valor'}.
            La traducción completa y validada es la siguiente tarea con hablantes e intérpretes registrados (Ley N.° 29735):
            ninguna autoridad ni esta plataforma la sustituye. Regla P3: no se inventan equivalencias.
          </div>
        )}

        {PASOS.map((p) => (
          <div key={p.num} className="paso-guia">
            <span className="paso-num">{p.num}</span>
            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icono nombre={p.icono} tamano={16} estilo={{ color: 'var(--acento)' }} />
                {p.titulo}
              </h3>
              {p.cuerpo.map((parrafo, i) => (
                <p key={i} className="pequena texto-2 mb-05">{verBorrador ? traducirBorrador(parrafo) : parrafo}</p>
              ))}
            </div>
          </div>
        ))}

        <div className="separador" />
        <h4>Documentación que habitualmente se pide</h4>
        <ul className="lista-doc">
          {DOCUMENTOS.map((d) => (
            <li key={d.slice(0, 24)}>{verBorrador ? traducirBorrador(d) : d}</li>
          ))}
        </ul>
        <p className="mini texto-3 mt-05 mb-0">
          Base normativa citada: Ley N.° 28611 (General del Ambiente) · TUO de la Ley N.° 27444 (procedimiento
          administrativo general) · D.S. N.° 004-2017-MINAM y D.S. N.° 010-2010-MINAM · Ley N.° 29735 (uso y difusión de
          lenguas originarias) · Ley N.° 29733 y su Reglamento (datos personales). Sin teléfonos ni plazos específicos
          inventados: los canales y plazos vigentes se confirman en el portal y el TUPA de cada entidad.
        </p>
      </section>

      {/* ── Autoridades: directorio con canales reales ── */}
      <section className="placa revelar">
        <div className="placa-cabecera">
          <div>
            <div className="placa-cintillo" style={{ marginBottom: '0.4rem' }}><span>Directorio de autoridades</span></div>
            <h2>Ante quién acudir, con canales oficiales verificados</h2>
            <p className="placa-sub mb-0">
              Servicios y cuentas institucionales verificados el {FECHA_VERIFICACION_ENLACES} en dominios oficiales
              (gob.pe, senace.gob.pe, defensoria.gob.pe). El portal oficial siempre prevalece sobre las redes; si un
              enlace cambiara, repórtelo por el canal de rectificación y lo corregimos.
            </p>
          </div>
        </div>
        <div className="tabla-envoltura">
          <table className="tabla">
                <caption className="sr-only">Directorio de autoridades con canales oficiales y redes verificadas</caption>
            <thead>
              <tr><th>Entidad</th><th>Canales oficiales</th><th>Redes institucionales</th></tr>
            </thead>
            <tbody>
              {Object.entries(INSTITUCIONES).map(([key, inst]) => {
                const usos: Record<string, string> = {
                  oefa: 'Denuncias por contaminación de actividades fiscalizables (SINADA) y fiscalización.',
                  ana: 'Verificación y monitoreo del agua, vertimientos y caudales.',
                  senace: 'Consultar los EIA aprobados y sus expedientes (EVA y consulta ciudadana).',
                  defensoria: 'Quejas por servicios del Estado, mediación y conflicto social.',
                  cultura: 'Intérpretes registrados, consulta previa y pueblos indígenas.',
                  mp: 'Evaluación penal de hechos potencialmente delictivos (FEMA).',
                  minsa: 'Atención y registro de afectaciones a la salud.',
                };
                return (
                  <tr key={key}>
                    <td className="celda-fuerte" style={{ minWidth: 210 }}>
                      {inst.nombre}
                      <div className="celda-mini dato-mono">{inst.sigla}</div>
                      <div className="celda-mini">{usos[key]}</div>
                    </td>
                    <td>
                      <div className="canales-entidad">
                        {inst.canales.map((c) => (
                          <a key={c.url} href={c.url} target="_blank" rel="noreferrer noopener" className="canal-enlace">
                            <Icono nombre={c.tipo === 'tramite' ? 'subir' : c.tipo === 'consulta' ? 'lupa' : 'globo'} tamano={12} />
                            {c.etiqueta}
                          </a>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="envoltura-chips">
                        {inst.redes.map((r) => (
                          <a key={r.url} className="chip neutro" href={r.url} target="_blank" rel="noreferrer noopener" title={`Cuenta oficial verificada: ${r.usuario}`}>
                            <Icono nombre={r.tipo === 'x' ? 'x-social' : r.tipo === 'facebook' ? 'facebook' : 'youtube'} tamano={11} />
                            {r.usuario}
                          </a>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="aviso neutro mt-1 mb-0">
          <Icono nombre="balanza" tamano={16} />
          <span>
            La vía de denuncia y la vía penal son distintas: OEFA fiscaliza, la FEMA investiga delitos. Una medida
            preventiva no es una sanción y una reconsideración parcial no es una absolución: el estado procesal se
            muestra con fecha en el Radar.
          </span>
        </div>
      </section>

      {/* ── Vulnerabilidades y protección ── */}
      <section className="placa esquinas revelar">
        <div className="placa-cabecera">
          <div>
            <div className="placa-cintillo" style={{ marginBottom: '0.4rem' }}><span>Vulnerabilidades y protección</span></div>
            <h2>Cuidarse mientras se reclama</h2>
          </div>
        </div>
        <div className="rejilla tres">
          {[
            { icono: 'ojo-tapado' as const, titulo: 'Presiones y represalias', texto: 'Use la identidad reservada del Módulo E: su identidad solo la ve el equipo verificador. No se publica la ubicación exacta de viviendas ni datos individuales de salud.' },
            { icono: 'lenguas' as const, titulo: 'Barrera de lengua', texto: 'Tiene derecho a servicios en lengua originaria y a intérprete registrado (Ley N.° 29735). Pídale a la entidad intérprete del registro del Ministerio de Cultura; no firme lo que no entiende.' },
            { icono: 'candado' as const, titulo: 'Datos personales', texto: 'El tratamiento de datos está bajo la Ley N.° 29733: consentimiento informado, derechos ARCO gratuitos y borrado efectivo probado en esta plataforma.' },
            { icono: 'alerta' as const, titulo: 'Evidencia frágil', texto: 'Fotos sin fecha o muestras caseras se cuestionan: use el Módulo C (hash + metadatos) y pida monitoreos con protocolo oficial a la autoridad.' },
            { icono: 'reloj' as const, titulo: 'Hechos que se pierden', texto: 'Los episodios de coloración o espuma son breves: documente cada episodio con fecha. La acumulación de registros es la que sostiene el caso.' },
            { icono: 'comunidad' as const, titulo: 'Decisión comunal', texto: 'La denuncia comunal se legitima en asamblea: el Módulo D prepara el acta bilingüe que la asamblea revisa y aprueba. Nadie decide por la comunidad.' },
          ].map((v) => (
            <div key={v.titulo} className="tarjeta">
              <div className="tarjeta-titulo" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Icono nombre={v.icono} tamano={15} estilo={{ color: 'var(--acento)' }} />
                {v.titulo}
              </div>
              <p className="pequena texto-2 mb-0">{v.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <CintaTextil className="mt-2" />
    </>
  );
}
