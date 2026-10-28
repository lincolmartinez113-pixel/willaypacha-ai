import { useEffect, useState } from 'react';
import { api, cabecerasRol, pedirEstricto, type CasoPublico } from '../api';
import Icono from '../componentes/Icono';

type Pestana = 'publicos' | 'registrar' | 'seguimiento' | 'revision';

interface Seguimiento {
  id: string;
  estado: string;
  creadoEl: string;
  bitacora: { fecha: string; evento: string; detalle: string }[];
  evidencias: { hash: string; fechaCarga: string }[];
  nota: string;
}

interface CasoBandeja {
  id: string;
  estado: string;
  creadoEl: string;
  relato: string;
  evidencias: number;
  revisiones: { revisor: { nombre: string; perfil: string }; dictamen: string; contieneMenores: boolean }[];
  consistencia: { resultado: string; nota: string };
  identidadReservada: boolean;
}

const PESTANAS: { id: Pestana; etiqueta: string; icono: 'comunidad' | 'mas' | 'lista' | 'escudo' }[] = [
  { id: 'publicos', etiqueta: 'Casos publicados', icono: 'comunidad' },
  { id: 'registrar', etiqueta: 'Registrar un caso', icono: 'mas' },
  { id: 'seguimiento', etiqueta: 'Seguimiento y retiro', icono: 'lista' },
  { id: 'revision', etiqueta: 'Panel de revisión', icono: 'escudo' },
];

export default function Casos() {
  const [pestana, setPestana] = useState<Pestana>('publicos');

  const [publicos, setPublicos] = useState<CasoPublico[] | null>(null);
  const [leyenda, setLeyenda] = useState('');
  useEffect(() => {
    api.casosPublicos().then((r) => {
      setPublicos(r?.publicados ?? []);
      setLeyenda(r?.leyenda ?? '');
    });
  }, []);

  const [relato, setRelato] = useState('');
  const [zona, setZona] = useState('');
  const [contacto, setContacto] = useState('');
  const [lenguaCaso, setLenguaCaso] = useState('es');
  const [identidadReservada, setIdentidadReservada] = useState(true);
  const [consentimiento, setConsentimiento] = useState(false);
  const [ocultarMetadatos, setOcultarMetadatos] = useState(true);
  const [archivos, setArchivos] = useState<FileList | null>(null);
  const [resultado, setResultado] = useState<{ id: string; codigoRetiro: string } | null>(null);
  const [errorRegistro, setErrorRegistro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const [segId, setSegId] = useState('');
  const [segCodigo, setSegCodigo] = useState('');
  const [seguimiento, setSeguimiento] = useState<Seguimiento | null>(null);
  const [errorSeg, setErrorSeg] = useState<string | null>(null);

  const [rol, setRol] = useState('verificador');
  const [clave, setClave] = useState('');
  const [bandeja, setBandeja] = useState<CasoBandeja[] | null>(null);
  const [revisorNombre, setRevisorNombre] = useState('');
  const [revisorPerfil, setRevisorPerfil] = useState('ambiental');
  const [dictamen, setDictamen] = useState('favorable');
  const [contieneMenores, setContieneMenores] = useState(false);
  const [motivoDescarte, setMotivoDescarte] = useState('');
  const [errorRevision, setErrorRevision] = useState<string | null>(null);

  async function cargarBandeja() {
    setErrorRevision(null);
    try {
      const r = await fetch('/api/casos', { headers: cabecerasRol(rol, clave) });
      const cuerpo = await r.json();
      if (!r.ok) throw new Error(cuerpo.error || `HTTP ${r.status}`);
      setBandeja(cuerpo.bandeja ?? []);
    } catch (err) {
      setErrorRevision(err instanceof Error ? err.message : 'acceso denegado');
    }
  }

  async function registrar(e: React.FormEvent) {
    e.preventDefault();
    setErrorRegistro(null);
    if (!consentimiento) {
      setErrorRegistro('Se requiere consentimiento informado para registrar el caso.');
      return;
    }
    setEnviando(true);
    try {
      const fd = new FormData();
      fd.append('relato', relato);
      fd.append('zona', zona);
      fd.append('contacto', contacto);
      fd.append('lengua', lenguaCaso);
      fd.append('identidadReservada', String(identidadReservada));
      fd.append('metadatosOcultos', String(ocultarMetadatos));
      fd.append('consentimiento', 'true');
      if (archivos) for (const f of Array.from(archivos)) fd.append('evidencias', f);
      const r = await fetch('/api/casos', { method: 'POST', body: fd });
      const cuerpo = await r.json();
      if (!r.ok) throw new Error(cuerpo.error || `HTTP ${r.status}`);
      setResultado({ id: cuerpo.id, codigoRetiro: cuerpo.codigoRetiro });
      setRelato('');
      setArchivos(null);
      setConsentimiento(false);
    } catch (err) {
      setErrorRegistro(err instanceof Error ? err.message : 'no se pudo registrar el caso');
    } finally {
      setEnviando(false);
    }
  }

  async function consultarSeguimiento(e: React.FormEvent) {
    e.preventDefault();
    setErrorSeg(null);
    setSeguimiento(null);
    try {
      const r = await fetch(`/api/casos/${encodeURIComponent(segId)}/seguimiento?codigo=${encodeURIComponent(segCodigo)}`);
      const cuerpo = await r.json();
      if (!r.ok) throw new Error(cuerpo.error || `HTTP ${r.status}`);
      setSeguimiento(cuerpo);
    } catch (err) {
      setErrorSeg(err instanceof Error ? err.message : 'no se pudo consultar');
    }
  }

  async function retirarCaso() {
    setErrorSeg(null);
    try {
      await pedirEstricto(`/api/casos/${encodeURIComponent(segId)}/retirar`, {
        method: 'POST',
        body: JSON.stringify({ contacto: segCodigo.split('|')[0] || contacto, codigoRetiro: segCodigo }),
      });
      setSeguimiento(null);
      setSegId('');
      setSegCodigo('');
      window.alert('Caso retirado: ficha, evidencias y transcripciones eliminadas del sistema (borrado efectivo).');
    } catch (err) {
      setErrorSeg(err instanceof Error ? err.message : 'no se pudo retirar');
    }
  }

  async function accionCaso(id: string, cuerpo: Record<string, unknown>) {
    setErrorRevision(null);
    try {
      await pedirEstricto(`/api/casos/${id}/revision`, {
        method: 'POST',
        headers: cabecerasRol(rol, clave),
        body: JSON.stringify(cuerpo),
      });
      await cargarBandeja();
    } catch (err) {
      setErrorRevision(err instanceof Error ? err.message : 'acción rechazada');
    }
  }

  return (
    <>
      <div className="intro">
        <div className="surge">
          <div className="kicker">Módulo E · Casos de la comunidad</div>
          <h1>Ningún caso se publica directo</h1>
          <p className="plomo">
            Cada caso recorre un filtro de cinco pasos que combina integridad técnica, consistencia automática —la
            IA como asistente del filtro, nunca como juez— y revisión humana con dos revisores. La publicación
            verifica la evidencia, no el hecho ambiental: eso lo determina OEFA o un laboratorio acreditado.
          </p>
        </div>
        <aside className="ficha surge surge-2">
          <div className="ficha-titulo"><span>Reglas duras</span></div>
          <ul className="lista-limpia mini texto-2 mb-0" style={{ listStyle: 'none', padding: 0 }}>
            <li><Icono nombre="x" tamano={12} /> Ningún caso con menores identificables.</li>
            <li><Icono nombre="x" tamano={12} /> Ninguna ubicación exacta de viviendas: zona o cuenca.</li>
            <li><Icono nombre="x" tamano={12} /> Ningún dato individual de salud.</li>
            <li><Icono nombre="verificado" tamano={12} /> Retiro permanente con borrado efectivo.</li>
          </ul>
        </aside>
      </div>

      <div className="tabs surge surge-2" role="tablist">
        {PESTANAS.map((p) => (
          <button key={p.id} className={pestana === p.id ? 'activo' : ''} onClick={() => setPestana(p.id)} role="tab">
            <Icono nombre={p.icono} tamano={14} />
            {p.etiqueta}
          </button>
        ))}
      </div>

      {pestana === 'publicos' && (
        <section className="placa panel-entra">
          <div className="placa-cabecera">
            <div>
              <div className="placa-cintillo" style={{ marginBottom: '0.4rem' }}><span>Evidencia verificada</span></div>
              <h2>Casos publicados con su leyenda de alcance</h2>
            </div>
          </div>
          <div className="aviso info mb-2">
            <Icono nombre="escudo" tamano={16} />
            <span>{leyenda || 'La plataforma verificó la autenticidad e integridad de la evidencia. Esto no afirma que hubo contaminación: eso lo determina OEFA o un laboratorio acreditado.'}</span>
          </div>

          {publicos === null && <span className="esqueleto" style={{ height: 90 }} />}
          {publicos && publicos.length === 0 && (
            <div className="vacio">
              <Icono nombre="comunidad" tamano={30} />
              <div className="vacio-titulo">Todavía no hay casos publicados</div>
              <small>Los casos en verificación permanecen privados hasta que dos revisores humanos los aprueban.</small>
            </div>
          )}
          {publicos?.map((c) => (
            <article key={c.id} className="tarjeta">
              <div className="tarjeta-cabecera">
                <div className="tarjeta-titulo">{c.id}</div>
                <span className="chip verde"><Icono nombre="verificado" tamano={11} />Evidencia verificada</span>
              </div>
              <p className="pequena">{c.relato}</p>
              <div className="meta-linea">
                <span><strong>Zona:</strong> {c.zona}</span>
                <span><strong>Publicado:</strong> {new Date(c.publicadoEl).toLocaleString('es-PE')}</span>
                <span><strong>Evidencias:</strong> {c.evidencias.length}</span>
              </div>
              {c.evidencias.map((ev) => <p key={ev.hash} className="hash mb-0">sha256 · {ev.hash}</p>)}
              <p className="mini texto-3 mt-05 mb-0">{c.leyenda}</p>
            </article>
          ))}
        </section>
      )}

      {pestana === 'registrar' && (
        <section className="placa esquinas panel-entra">
          <div className="placa-cintillo"><span>Registro protegido · Ley N.° 29733</span></div>
          {resultado ? (
            <div className="aviso exito">
              <Icono nombre="verificado" tamano={16} />
              <span>
                <strong>Caso {resultado.id} recibido.</strong> Estado: privado, en cola de verificación.
                <p className="mt-05 mb-0">
                  Guarde su código de retiro: <span className="mono negrita">{resultado.codigoRetiro}</span> — permite
                  seguir el caso y retirarlo con borrado efectivo en cualquier momento.
                </p>
                <button className="boton secundario pequeno mt-1" onClick={() => setResultado(null)}>Registrar otro caso</button>
              </span>
            </div>
          ) : (
            <form onSubmit={registrar}>
              <div className="campo">
                <label htmlFor="relato">¿Qué observó? (relato)</label>
                <textarea id="relato" value={relato} onChange={(e) => setRelato(e.target.value)} required minLength={20} placeholder="Qué vio, dónde (según su descripción), cuándo. No evaluamos la veracidad: eso es parte del filtro." />
              </div>
              <div className="rejilla dos">
                <div className="campo">
                  <label htmlFor="zona">Zona o cuenca</label>
                  <input id="zona" value={zona} onChange={(e) => setZona(e.target.value)} placeholder="p. ej., cuenca del Ramis, sector Chogñacota" />
                  <small>No se publica la ubicación exacta de viviendas.</small>
                </div>
                <div className="campo">
                  <label htmlFor="contacto">Contacto (nunca se publica)</label>
                  <input id="contacto" type="email" value={contacto} onChange={(e) => setContacto(e.target.value)} required />
                  <small>Se usa para el seguimiento y para atender sus derechos ARCO.</small>
                </div>
              </div>
              <div className="rejilla dos">
                <div className="campo">
                  <label htmlFor="lengua-caso">Lengua del reporte</label>
                  <select id="lengua-caso" value={lenguaCaso} onChange={(e) => setLenguaCaso(e.target.value)}>
                    <option value="es">Español</option>
                    <option value="qu">Quechua</option>
                    <option value="ay">Aimara</option>
                    <option value="ash">Asháninka</option>
                  </select>
                </div>
                <div className="campo">
                  <label htmlFor="archivos">Evidencias (fotos, videos, audios, PDF)</label>
                  <input id="archivos" type="file" multiple accept="image/*,video/*,audio/*,application/pdf" onChange={(e) => setArchivos(e.target.files)} />
                  <small>La huella SHA-256 se calcula al cargar; la evidencia no se edita jamás.</small>
                </div>
              </div>
              <div className="rejilla dos mb-1">
                <label className="check">
                  <input type="checkbox" checked={identidadReservada} onChange={(e) => setIdentidadReservada(e.target.checked)} />
                  <span><strong>Identidad reservada:</strong> mi identidad solo será visible para el equipo verificador, nunca en público.</span>
                </label>
                <label className="check">
                  <input type="checkbox" checked={ocultarMetadatos} onChange={(e) => setOcultarMetadatos(e.target.checked)} />
                  <span>Ocultar los metadatos (fecha/coordenadas) en las vistas públicas.</span>
                </label>
              </div>
              <label className="check mb-2">
                <input type="checkbox" checked={consentimiento} onChange={(e) => setConsentimiento(e.target.checked)} />
                <span>
                  Doy mi <strong>consentimiento informado</strong> conforme a la Ley N.° 29733 y su Reglamento
                  (D.S. N.° 016-2024-JUS): se me informó qué se guardará (relato, evidencia, contacto), para qué
                  (verificar y publicar el caso si se aprueba), por cuánto tiempo y qué derechos me asisten (acceso,
                  rectificación, cancelación y oposición, gratuitos). La evidencia sigue siendo de la comunidad; la
                  plataforma recibe solo una licencia de uso para verificarla y difundirla.
                </span>
              </label>
              <button className="boton" disabled={enviando || !consentimiento}>
                <Icono nombre="subir" tamano={15} />
                {enviando ? 'Enviando…' : 'Enviar caso al filtro de verificación'}
              </button>
              {errorRegistro && <div className="aviso rojo mt-1"><Icono nombre="alerta" tamano={16} /><span>{errorRegistro}</span></div>}
            </form>
          )}
        </section>
      )}

      {pestana === 'seguimiento' && (
        <section className="placa panel-entra">
          <div className="placa-cintillo"><span>Seguimiento y retiro</span></div>
          <form onSubmit={consultarSeguimiento} className="fila mb-2">
            <div className="campo crecer mb-0">
              <label htmlFor="seg-id">Código del caso</label>
              <input id="seg-id" value={segId} onChange={(e) => setSegId(e.target.value)} placeholder="CASO-0001" required />
            </div>
            <div className="campo crecer mb-0">
              <label htmlFor="seg-codigo">Código de retiro</label>
              <input id="seg-codigo" value={segCodigo} onChange={(e) => setSegCodigo(e.target.value)} required />
            </div>
            <button className="boton secundario">Consultar</button>
          </form>

          {errorSeg && <div className="aviso rojo"><Icono nombre="alerta" tamano={16} /><span>{errorSeg}</span></div>}

          {seguimiento ? (
            <div className="tarjeta">
              <div className="tarjeta-cabecera">
                <div className="tarjeta-titulo">{seguimiento.id}</div>
                <span className="chip ambar"><span className="punto" />{seguimiento.estado}</span>
              </div>
              <p className="mini texto-3">Creado: {new Date(seguimiento.creadoEl).toLocaleString('es-PE')} · {seguimiento.nota}</p>
              <ul className="bitacora">
                {seguimiento.bitacora.map((b, i) => (
                  <li key={i}><span className="cuando">{new Date(b.fecha).toLocaleString('es-PE')}</span><span>{b.detalle}</span></li>
                ))}
              </ul>
              <div className="aviso rojo mt-2">
                <Icono nombre="alerta" tamano={16} />
                <span>
                  <strong>Retirar el caso.</strong> Elimina ficha, evidencias y transcripciones del sistema —no solo de
                  la vista pública—. Para confirmar, ingrese el contacto declarado con el formato{' '}
                  <span className="mono">correo|código</span>.
                  <div className="fila mt-05">
                    <input placeholder="correo@ejemplo.org|código" value={segCodigo} onChange={(e) => setSegCodigo(e.target.value)} style={{ maxWidth: 340 }} />
                    <button className="boton peligro pequeno" onClick={retirarCaso}>Retirar con borrado efectivo</button>
                  </div>
                </span>
              </div>
            </div>
          ) : (
            <div className="vacio">
              <Icono nombre="lista" tamano={30} />
              <div className="vacio-titulo">El caso es suyo y puede retirarlo</div>
              <small>Con su código de caso y su código de retiro puede ver el estado y pedir el borrado efectivo.</small>
            </div>
          )}
        </section>
      )}

      {pestana === 'revision' && (
        <section className="placa panel-entra">
          <div className="placa-cabecera">
            <div>
              <div className="placa-cintillo" style={{ marginBottom: '0.4rem' }}><span>Panel de revisión</span></div>
              <h2>Filtro humano, adversarial y trazable</h2>
            </div>
          </div>
          <div className="fila mb-2">
            <select value={rol} onChange={(e) => setRol(e.target.value)} className="selector-lengua" aria-label="Rol">
              <option value="verificador">Verificador</option>
              <option value="admin">Administrador</option>
            </select>
            <input type="password" placeholder="Clave del rol (demo)" aria-label="Clave del rol para revisión (demostración)" value={clave} onChange={(e) => setClave(e.target.value)} style={{ maxWidth: 240 }} />
            <button className="boton secundario" onClick={cargarBandeja}>Abrir bandeja</button>
          </div>

          <div className="rejilla tres">
            <div className="campo"><label>Revisor (nombre)</label><input value={revisorNombre} onChange={(e) => setRevisorNombre(e.target.value)} /></div>
            <div className="campo"><label>Perfil</label>
              <select value={revisorPerfil} onChange={(e) => setRevisorPerfil(e.target.value)}>
                <option value="ambiental">Ambiental</option>
                <option value="legal">Legal</option>
                <option value="técnico">Técnico</option>
                <option value="comunitario">Comunitario</option>
              </select>
            </div>
            <div className="campo"><label>Dictamen</label>
              <select value={dictamen} onChange={(e) => setDictamen(e.target.value)}>
                <option value="favorable">Favorable</option>
                <option value="desfavorable">Desfavorable</option>
              </select>
            </div>
          </div>
          <label className="check mb-2">
            <input type="checkbox" checked={contieneMenores} onChange={(e) => setContieneMenores(e.target.checked)} />
            <span>La evidencia contiene menores identificables (bloquea la publicación).</span>
          </label>

          {errorRevision && <div className="aviso rojo mb-2"><Icono nombre="alerta" tamano={16} /><span>{errorRevision}</span></div>}
          {bandeja === null && <span className="esqueleto" style={{ height: 70 }} />}
          {bandeja && bandeja.length === 0 && (
            <div className="vacio">
              <Icono nombre="escudo" tamano={30} />
              <div className="vacio-titulo">Bandeja vacía</div>
              <small>Abra la bandeja con la clave del rol para ver los casos en verificación.</small>
            </div>
          )}

          {bandeja?.map((c) => (
            <div key={c.id} className="tarjeta">
              <div className="tarjeta-cabecera">
                <div>
                  <div className="tarjeta-titulo">{c.id}</div>
                  <div className="tarjeta-sub">{new Date(c.creadoEl).toLocaleString('es-PE')} · {c.evidencias} evidencia(s) · {c.revisiones.length} revisión(es)</div>
                </div>
                <span className={`chip ${c.estado === 'verificado' ? 'verde' : c.estado === 'descartado' ? 'rojo' : 'ambar'}`}>
                  <span className="punto" />{c.estado}
                </span>
              </div>
              <p className="pequena mb-05">{c.relato}</p>
              <p className="mini texto-3">{c.consistencia.resultado} — {c.consistencia.nota}</p>
              {c.revisiones.map((r, i) => (
                <p key={i} className="mini texto-3 mb-0">· {r.revisor.nombre} ({r.revisor.perfil}): {r.dictamen}{r.contieneMenores ? ' — advirtió menores identificables' : ''}</p>
              ))}
              <div className="fila mt-1">
                <button className="boton secundario pequeno" onClick={() => accionCaso(c.id, { accion: 'en-verificacion' })} disabled={c.estado !== 'recibido'}>
                  Pasar a verificación
                </button>
                <button
                  className="boton secundario pequeno"
                  onClick={() => accionCaso(c.id, { accion: 'revisar', revisor: { nombre: revisorNombre, perfil: revisorPerfil }, dictamen, contieneMenores })}
                  disabled={c.estado !== 'en-verificacion'}
                >
                  Registrar dictamen
                </button>
                <button className="boton pequeno" onClick={() => accionCaso(c.id, { accion: 'verificar' })} disabled={c.estado !== 'en-verificacion'}>
                  Publicar (2 revisores)
                </button>
              </div>
              <div className="fila mt-1">
                <input placeholder="Motivo de descarte" value={motivoDescarte} onChange={(e) => setMotivoDescarte(e.target.value)} style={{ maxWidth: 340 }} />
                <button className="boton peligro pequeno" onClick={() => accionCaso(c.id, { accion: 'descartar', motivo: motivoDescarte })} disabled={!motivoDescarte}>
                  Descartar con motivo
                </button>
              </div>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
