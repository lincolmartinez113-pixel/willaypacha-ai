import { useEffect, useState } from 'react';
import { api, cabecerasRol, pedirEstricto, type DocumentoResumen } from '../api';
import { SEMILLA } from '../datos';
import Icono from '../componentes/Icono';

const TIPOS = [
  {
    valor: 'informe',
    titulo: 'Informe Técnico Preliminar',
    detalle: 'Contraste ECA/LMP con la tabla normativa citada y los hallazgos de los documentos oficiales.',
    icono: 'pulso' as const,
  },
  {
    valor: 'acta',
    titulo: 'Acta de Asamblea (bilingüe)',
    detalle: 'Constancia formal del acuerdo comunal, con los hechos citados y versión en lengua originaria.',
    icono: 'comunidad' as const,
  },
  {
    valor: 'denuncia',
    titulo: 'Denuncia / Solicitud',
    detalle: 'Denuncia ambiental para SINADA–OEFA o solicitud de verificación ante la ANA, con antecedentes citados.',
    icono: 'balanza' as const,
  },
];

const PASOS = ['borrador-ia', 'en-revision', 'aprobado'];
const ROTULOS_PASO: Record<string, string> = { 'borrador-ia': 'Borrador IA', 'en-revision': 'En revisión', aprobado: 'Aprobado' };

export default function Documentos() {
  const [documentos, setDocumentos] = useState<DocumentoResumen[] | null>(null);
  const [tipo, setTipo] = useState('informe');
  const [unidadId, setUnidadId] = useState('san-rafael');
  const [solicitante, setSolicitante] = useState('');
  const [entidad, setEntidad] = useState('sinada');
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const [rol, setRol] = useState('verificador');
  const [clave, setClave] = useState('');
  const [fichaRegistroId, setFichaRegistroId] = useState('SR-001-chognacota-agua');
  const [docActivo, setDocActivo] = useState<string | null>(null);
  const [expertoNombre, setExpertoNombre] = useState('');
  const [expertoColegiatura, setExpertoColegiatura] = useState('');
  const [expertoTipo, setExpertoTipo] = useState('CIP');
  const [observaciones, setObservaciones] = useState('');
  const [accionError, setAccionError] = useState<string | null>(null);

  async function cargar() {
    const r = await api.documentos();
    setDocumentos(r?.documentos ?? []);
  }
  useEffect(() => { cargar(); }, []);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setCreando(true);
    setError(null);
    setAviso(null);
    try {
      const r = await pedirEstricto<{ id: string; aviso: string }>('/api/documentos', {
        method: 'POST',
        body: JSON.stringify({ tipo, unidadId, datos: { solicitante, entidad: tipo === 'denuncia' ? entidad : undefined } }),
      });
      setAviso(`${r.id} generado. ${r.aviso}`);
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'no se pudo generar');
    } finally {
      setCreando(false);
    }
  }

  async function accion(id: string, cuerpo: Record<string, unknown>) {
    setAccionError(null);
    try {
      await pedirEstricto(`/api/documentos/${id}/revision`, {
        method: 'POST',
        headers: cabecerasRol(rol, clave),
        body: JSON.stringify(cuerpo),
      });
      setAviso('Transición registrada en la bitácora.');
      await cargar();
    } catch (err) {
      setAccionError(err instanceof Error ? err.message : 'acción rechazada');
    }
  }

  return (
    <>
      <div className="intro">
        <div className="surge">
          <div className="kicker">Módulo D · Generador legal y bandeja de expertos</div>
          <h1>La máquina prepara, el profesional responde, la comunidad decide</h1>
          <p className="plomo">
            Todo documento nace como borrador con franja visible en cada página, sin firma y sin fecha de
            presentación. El PDF final solo se habilita tras la aprobación de un especialista colegiado (CIP o
            CAL). La plataforma no presenta documentos ante ninguna entidad: eso lo hace la persona, por los
            canales oficiales.
          </p>
        </div>
        <aside className="ficha surge surge-2">
          <div className="ficha-titulo"><span>Frontera del módulo</span></div>
          <p className="mini texto-2 mb-0">
            El sistema no firma por nadie y no envía nada. Cada PDF lleva su <strong>Registro de Generación</strong>:
            modelo, prompt, fuentes citadas, hash y estado de revisión humana impresos en el pie.
          </p>
        </aside>
      </div>

      <section className="placa esquinas surge surge-1">
        <div className="placa-cintillo"><span>Generar un documento borrador</span></div>
        <div className="rejilla tres mb-1">
          {TIPOS.map((t) => (
            <button
              key={t.valor}
              type="button"
              className={`territorio ${tipo === t.valor ? 'activo' : ''}`}
              onClick={() => setTipo(t.valor)}
              style={{ alignItems: 'flex-start' }}
            >
              <Icono nombre={t.icono} tamano={19} estilo={{ color: tipo === t.valor ? 'var(--acento)' : 'var(--texto-3)', marginTop: 2 }} />
              <span>
                {t.titulo}
                <small>{t.detalle}</small>
              </span>
            </button>
          ))}
        </div>

        <form onSubmit={crear}>
          <div className="rejilla tres">
            <div className="campo">
              <label htmlFor="unidad-doc">Unidad de referencia</label>
              <select id="unidad-doc" value={unidadId} onChange={(e) => setUnidadId(e.target.value)}>
                {SEMILLA.unidades.map((u) => (
                  <option key={u.id} value={u.id}>{u.nombre}</option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label htmlFor="solicitante">Solicitante (marcador a completar)</label>
              <input id="solicitante" value={solicitante} onChange={(e) => setSolicitante(e.target.value)} placeholder="[COMPLETAR: comunidad o persona]" />
            </div>
            {tipo === 'denuncia' && (
              <div className="campo">
                <label htmlFor="entidad">Entidad destinataria</label>
                <select id="entidad" value={entidad} onChange={(e) => setEntidad(e.target.value)}>
                  <option value="sinada">SINADA — OEFA (denuncia)</option>
                  <option value="ana">ANA (verificación de agua)</option>
                </select>
              </div>
            )}
          </div>
          <button className="boton" disabled={creando}>
            <Icono nombre="documento" tamano={15} />
            {creando ? 'Generando…' : 'Generar borrador PDF'}
          </button>
        </form>
        {error && <div className="aviso rojo mt-1"><Icono nombre="alerta" tamano={16} /><span>{error}</span></div>}
        {aviso && <div className="aviso exito mt-1"><Icono nombre="verificado" tamano={16} /><span>{aviso}</span></div>}
      </section>

      <section className="placa esquinas surge surge-2">
        <div className="placa-cintillo"><span>Ficha de registro verificado</span></div>
        <p className="mini texto-2">
          Un solo PDF por registro: resumen aprobado por el verificador P6, cita completa con organismo,
          documento y fecha, semáforo, pendientes declarados y bloque de revisión experta vacío y pendiente
          (sin firma ni aprobación inventadas). Lleva su Registro de Generación en el pie.
        </p>
        <div className="fila">
          <div className="campo" style={{ minWidth: 280, flex: 1 }}>
            <label htmlFor="ficha-registro">Registro</label>
            <select id="ficha-registro" value={fichaRegistroId} onChange={(e) => setFichaRegistroId(e.target.value)}>
              {SEMILLA.registros.map((r) => (
                <option key={r.id} value={r.id}>{r.id} · {r.cuerpoAgua ?? r.componente ?? r.parametro}</option>
              ))}
            </select>
          </div>
          <a className="boton secundario pequeno" href={`/api/documentos/registro/${fichaRegistroId}/pdf`} download={`ficha-${fichaRegistroId}.pdf`}>
            <Icono nombre="documento" tamano={13} />
            Descargar ficha PDF
          </a>
        </div>
      </section>

      <section className="placa surge surge-2">
        <div className="placa-cabecera">
          <div>
            <div className="placa-cintillo" style={{ marginBottom: '0.4rem' }}><span>Bandeja</span></div>
            <h2>Documentos en curso</h2>
          </div>
          <span className="chip neutro">{documentos ? `${documentos.length} documento(s)` : 'cargando…'}</span>
        </div>

        <div className="aviso neutro mb-2">
          <Icono nombre="candado" tamano={16} />
          <span>
            <strong>Acceso de revisión (demostración):</strong> los roles se acreditan con claves declaradas; en
            producción, autenticación real con cuentas individuales y bitácora de accesos.
            <div className="fila mt-05">
              <select value={rol} onChange={(e) => setRol(e.target.value)} className="selector-lengua" aria-label="Rol">
                <option value="verificador">Verificador</option>
                <option value="admin">Administrador</option>
              </select>
              <input type="password" placeholder="Clave del rol (demo)" aria-label="Clave del rol para revisión (demostración)" value={clave} onChange={(e) => setClave(e.target.value)} style={{ maxWidth: 240 }} />
            </div>
          </span>
        </div>

        {documentos === null && <span className="esqueleto" style={{ height: 60 }} />}
        {documentos && documentos.length === 0 && (
          <div className="vacio">
            <Icono nombre="documento" tamano={30} />
            <div className="vacio-titulo">Aún no hay documentos</div>
            <small>Genere un borrador arriba: nace con franja de revisión en cada página.</small>
          </div>
        )}

        {documentos?.map((d) => {
          const indice = PASOS.indexOf(d.estado);
          const abierto = docActivo === d.id;
          return (
            <div key={d.id} className="tarjeta">
              <div className="tarjeta-cabecera">
                <div>
                  <div className="tarjeta-titulo">{d.id} · {TIPOS.find((t) => t.valor === d.tipo)?.titulo ?? d.tipo}</div>
                  <div className="tarjeta-sub">Unidad: {d.unidadId} · {new Date(d.creadoEl).toLocaleString('es-PE')}</div>
                </div>
                <span className={`chip ${d.estado === 'aprobado' ? 'verde' : d.estado === 'en-revision' ? 'neutro' : 'ambar'}`}>
                  <span className="punto" />{ROTULOS_PASO[d.estado] || d.estado}
                </span>
              </div>

              <div className="pasos mb-1">
                {PASOS.map((p, i) => (
                  <span key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span className={`paso ${i < indice ? 'hecho' : i === indice ? 'actual' : ''}`}>{ROTULOS_PASO[p]}</span>
                    {i < PASOS.length - 1 && <span className="flecha">→</span>}
                  </span>
                ))}
              </div>

              <div className="fila">
                <a className="boton secundario pequeno" href={`/api/documentos/${d.id}/pdf`} target="_blank" rel="noreferrer noopener">
                  <Icono nombre="ojo" tamano={13} />
                  Ver PDF borrador
                </a>
                {d.puedeDescargarFinal ? (
                  <a className="boton pequeno" href={`/api/documentos/${d.id}/pdf?version=final`} target="_blank" rel="noreferrer noopener">
                    <Icono nombre="verificado" tamano={13} />
                    PDF final
                  </a>
                ) : (
                  <span className="chip rojo"><Icono nombre="candado" tamano={11} />PDF final bloqueado hasta aprobación</span>
                )}
                <button className="boton fantasma pequeno" onClick={() => setDocActivo(abierto ? null : d.id)}>
                  {abierto ? 'Cerrar' : 'Panel de revisión'}
                </button>
              </div>

              {d.experto && (
                <p className="mini mt-05 mb-0" style={{ color: 'var(--verde)' }}>
                  <Icono nombre="verificado" tamano={12} /> Aprobado por {d.experto.nombre} — {d.experto.tipo} N.° {d.experto.colegiatura}
                  {d.aprobadoEl ? ` · ${new Date(d.aprobadoEl).toLocaleString('es-PE')}` : ''}
                </p>
              )}

              {abierto && (
                <div className="mt-1">
                  <div className="separador" />
                  <div className="fila mb-1">
                    <button className="boton secundario pequeno" onClick={() => accion(d.id, { accion: 'revisar' })} disabled={d.estado !== 'borrador-ia'}>
                      Tomar para revisión
                    </button>
                  </div>
                  <div className="rejilla tres">
                    <div className="campo"><label>Nombre del experto</label><input value={expertoNombre} onChange={(e) => setExpertoNombre(e.target.value)} placeholder="Ing. / Abg." /></div>
                    <div className="campo"><label>Colegiatura</label><input value={expertoColegiatura} onChange={(e) => setExpertoColegiatura(e.target.value)} placeholder="N.°" /></div>
                    <div className="campo"><label>Tipo</label>
                      <select value={expertoTipo} onChange={(e) => setExpertoTipo(e.target.value)}>
                        <option value="CIP">CIP</option>
                        <option value="CAL">CAL</option>
                      </select>
                    </div>
                  </div>
                  <div className="fila mb-1">
                    <button
                      className="boton pequeno"
                      onClick={() => accion(d.id, { accion: 'aprobar', experto: { nombre: expertoNombre, colegiatura: expertoColegiatura, tipo: expertoTipo } })}
                      disabled={d.estado !== 'en-revision'}
                    >
                      Aprobar y habilitar PDF final
                    </button>
                  </div>
                  <div className="campo">
                    <label>Observaciones (devolver a borrador)</label>
                    <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Qué debe corregirse, con precisión." />
                  </div>
                  <button className="boton secundario pequeno" onClick={() => accion(d.id, { accion: 'observar', observaciones })} disabled={d.estado !== 'en-revision'}>
                    Observar y devolver
                  </button>
                  {accionError && <div className="aviso rojo mt-1"><Icono nombre="alerta" tamano={16} /><span>{accionError}</span></div>}

                  <h4 className="mt-2">Bitácora</h4>
                  <ul className="bitacora">
                    {d.bitacora.map((b, i) => (
                      <li key={i}>
                        <span className="cuando">{new Date(b.fecha).toLocaleString('es-PE')}</span>
                        <span>{b.detalle}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </section>
    </>
  );
}
