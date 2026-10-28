import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SEMILLA, registrosDe, unidadPor, urlBusqueda, fechaCorta, type Registro } from '../datos';
import Semaforo, { Vacio } from '../componentes/Semaforo';
import TarjetaRegistro from '../componentes/TarjetaRegistro';
import Icono from '../componentes/Icono';
import Foto from '../componentes/Foto';
import { Dona } from '../componentes/Graficos';
import { CintaTextil, Chakana } from '../componentes/Simbolos';
import { INSTITUCIONES, FECHA_VERIFICACION_ENLACES } from '../datos-instituciones';
import { IMAGEN_HERO, creditoDe, urlDe } from '../datos-img';
import { pedirEstricto } from '../api';
import { coloresMapaConcretos, tilesDelTema } from '../tema';
import { useTema } from '../contextoTema';

const ROTULOS_COMPONENTE: Record<string, string> = {
  bocamina: 'Bocamina',
  relavera: 'Relavera',
  'punto-vertimiento': 'Vertimiento',
  'cuerpo-agua': 'Cuerpo de agua',
  comunidad: 'Comunidad',
};

function MapaUnidad({ unidadId }: { unidadId: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapa = useRef<L.Map | null>(null);
  const { tema } = useTema();

  useEffect(() => {
    const unidad = unidadPor(unidadId);
    if (!unidad || !ref.current) return;
    if (!mapa.current) {
      mapa.current = L.map(ref.current, { scrollWheelZoom: false, attributionControl: true }).setView(
        [unidad.coordenadas.lat, unidad.coordenadas.lng],
        11,
      );
      L.tileLayer(tilesDelTema(tema), {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapa.current);
      mapa.current.on('tileload', (evento) => {
        const img = (evento as { tile?: HTMLImageElement }).tile;
        if (img && !img.hasAttribute('alt')) img.setAttribute('alt', '');
      });
    }
    const m = mapa.current;
    m.setView([unidad.coordenadas.lat, unidad.coordenadas.lng], 11);
    m.eachLayer((capa) => {
      if (capa instanceof L.Marker || capa instanceof L.CircleMarker) m.removeLayer(capa);
    });

    const pinUnidad = L.divIcon({
      className: '',
      html: '<div class="pin-unidad"><span></span></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    L.marker([unidad.coordenadas.lat, unidad.coordenadas.lng], { icon: pinUnidad })
      .bindPopup(`<strong style="font-family:var(--display)">${unidad.nombre}</strong><br/><span style="color:var(--texto-3)">Unidad minera · coordenadas aproximadas</span>`)
      .addTo(m);

    const colores = coloresMapaConcretos(tema);
    for (const c of unidad.componentes) {
      const colorMapa = colores[c.tipo] || colores.comunidad;
      L.circleMarker([c.coordenadas.lat, c.coordenadas.lng], {
        radius: 6.5,
        color: colorMapa,
        weight: 1.8,
        fillColor: colorMapa,
        fillOpacity: 0.5,
      })
        .bindPopup(`<strong>${c.nombre}</strong><br/><span style="color:var(--texto-3)">${ROTULOS_COMPONENTE[c.tipo] || c.tipo} · aproximado</span>`)
        .addTo(m);
    }
    return () => {
      m.remove();
      mapa.current = null;
    };
  }, [unidadId, tema]);

  return (
    <div className="mapa-marco">
      <div ref={ref} className="mapa" role="application" aria-label="Mapa de la unidad minera" />
      <div className="mapa-leyenda">
        <strong>Lectura</strong>
        Anillo: unidad. Puntos: componentes, agua y comunidad.
      </div>
    </div>
  );
}

function Rectificacion({ registroId }: { registroId: string }) {
  const [alegacion, setAlegacion] = useState('');
  const [contacto, setContacto] = useState('');
  const [resultado, setResultado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResultado(null);
    try {
      const r = await pedirEstricto<{ id: string; compromiso: string }>('/api/rectificaciones', {
        method: 'POST',
        body: JSON.stringify({ registroId, alegacion, contacto }),
      });
      setResultado(`Recibida como ${r.id}. ${r.compromiso}`);
      setAlegacion('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'no se pudo enviar');
    }
  }

  return (
    <form onSubmit={enviar} className="mt-1">
      <p className="mini texto-3 mb-05">
        ¿Considera inexacto algún dato? Cualquier tercero puede pedir rectificación; si se acepta, se corrige con la misma visibilidad y queda en la bitácora.
      </p>
      <div className="fila">
        <div className="campo crecer mb-0">
          <label htmlFor={`alegacion-${registroId}`}>Alegación</label>
          <input id={`alegacion-${registroId}`} value={alegacion} onChange={(e) => setAlegacion(e.target.value)} required minLength={10} />
        </div>
        <div className="campo crecer mb-0">
          <label htmlFor={`contacto-${registroId}`}>Contacto (no se publica)</label>
          <input id={`contacto-${registroId}`} type="email" value={contacto} onChange={(e) => setContacto(e.target.value)} required />
        </div>
        <button className="boton secundario">Enviar</button>
      </div>
      {error && <p className="mini mt-05" style={{ color: 'var(--rojo)' }}>{error}</p>}
      {resultado && <p className="mini mt-05" style={{ color: 'var(--verde)' }}>{resultado}</p>}
    </form>
  );
}

export default function Radar() {
  const [territorioId, setTerritorioId] = useState('altoandino');
  const territorio = SEMILLA.territorios.find((t) => t.id === territorioId)!;
  const unidades = useMemo(() => SEMILLA.unidades.filter((u) => u.territorioId === territorioId), [territorioId]);
  const [unidadId, setUnidadId] = useState(unidades[0]?.id ?? '');
  useEffect(() => setUnidadId(unidades[0]?.id ?? ''), [unidades]);
  const unidad = unidadPor(unidadId);
  const registros = unidad ? registrosDe(unidad.id) : [];

  const conteo = useMemo(() => {
    const c = { rojo: 0, ambar: 0, verde: 0 };
    for (const r of registros) c[r.semaforo] += 1;
    return c;
  }, [registros]);

  const lineaTiempo = useMemo(
    () =>
      registros
        .filter((r) => r.tipo === 'acto-fiscalizacion' || r.tipo === 'certificacion')
        .sort((a, b) => a.fecha.localeCompare(b.fecha)),
    [registros],
  );

  const años = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const r of registros) {
      const año = /^\d{4}/.test(r.fecha) ? r.fecha.slice(0, 4) : 'en trámite';
      acc[año] = (acc[año] || 0) + 1;
    }
    return Object.entries(acc).sort(([a], [b]) => a.localeCompare(b));
  }, [registros]);

  return (
    <>
      <section className="portada surge" aria-label="Portada de WillayPacha AI">
        <div className="portada-foto">
          <img src={urlDe(IMAGEN_HERO)} alt="Amanecer en el lago Titicaca, altiplano de Puno" />
          <div className="portada-velo" aria-hidden="true" />
          <div className="portada-grano" aria-hidden="true" />
          <div className="portada-meta" aria-hidden="true">
            <span>OCT 2026 · PUNO — JUNÍN</span>
            <span>MONITOREO AMBIENTAL COMUNITARIO</span>
            <span>FUENTE · FECHA · CITA</span>
          </div>
          <span className="portada-chakana" aria-hidden="true"><Chakana tamano={76} trazar /></span>
          {creditoDe(IMAGEN_HERO) && (
            <span className="portada-credito">
              Foto: {creditoDe(IMAGEN_HERO)!.autor} · {creditoDe(IMAGEN_HERO)!.licencia}
            </span>
          )}
          <div className="portada-titular">
            <h1 className="portada-titulo">
              <span className="linea-foto">El territorio</span>
              <span className="linea-papel">habla.</span>
            </h1>
            <p className="portada-sub">
              Lo que dice la fuente oficial vs. lo que vive la comunidad — en tu lengua, con fuente, fecha y cita.
            </p>
          </div>
        </div>

        <div className="portada-stats" aria-label="Cifras reales de la instancia">
          <span><strong>{SEMILLA.unidades.length}</strong> unidades verificadas</span>
          <span><strong>{SEMILLA.registros.length}</strong> registros citados</span>
          <span><strong>4</strong> lenguas</span>
          <span><strong>100 %</strong> con fuente</span>
        </div>

        <div className="portada-cuerpo">
          <p className="portada-plomo">
            Pregunta en tu lengua qué dice el informe oficial sobre tu quebrada. Documenta lo que ves con
            huella verificable. Denuncia ante la autoridad correcta. <strong>Y si algo no consta, te lo decimos.</strong>
          </p>
          <div className="portada-acciones">
            <a className="boton" href="#/rimay"><Icono nombre="mic" tamano={15} />Preguntar en mi lengua</a>
            <a className="boton secundario" href="#/denunciar"><Icono nombre="escudo" tamano={15} />Cómo denunciar</a>
            <a className="boton fantasma" href="#tabla-contraste"><Icono nombre="lista" tamano={15} />Bajar al radar</a>
          </div>
        </div>
      </section>

      <CintaTextil className="mt-2 mb-1" />

      <div className="territorios" role="tablist" aria-label="Selector de territorio">
        {SEMILLA.territorios.map((t) => {
          const activo = t.id === territorioId;
          const nUnidades = SEMILLA.unidades.filter((u) => u.territorioId === t.id).length;
          return (
            <button
              key={t.id}
              className={`territorio ${activo ? 'activo' : ''} ${t.estado === 'en-preparacion' ? 'preparacion' : ''}`}
              onClick={() => setTerritorioId(t.id)}
              aria-pressed={activo}
            >
              <span className="territorio-indicador" />
              <span>
                {t.nombre}
                <small>
                  {t.estado === 'en-preparacion'
                    ? 'en preparación — sin datos simulados'
                    : `${nUnidades} unidad${nUnidades === 1 ? '' : 'es'}`}
                </small>
              </span>
            </button>
          );
        })}
      </div>

      {territorio.estado === 'en-preparacion' && (
        <div className="aviso mb-2" role="note">
          <Icono nombre="info" tamano={16} />
          <span><strong>{territorio.nombre}:</strong> {territorio.leyenda}</span>
        </div>
      )}

      {unidad ? (
        <>
          <section className="banda">
            <header className="banda-cab">
              <span className="overline">Expediente · {unidad.id}</span>
              <h2>{unidad.nombre}</h2>
              <p className="meta-linea">
                <span>{unidad.empresa}</span>
                <span>{unidad.actividad}</span>
                <span>{unidad.ubicacion}</span>
              </p>
              <details className="nota-tecnica">
                <summary>Ficha técnica · comunidad, cuenca y lengua</summary>
                <p>
                  Comunidad de referencia: {unidad.comunidadReferencia}. Cuenca: {unidad.cuenca}.
                  {unidad.capacidad ? ` Capacidad: ${unidad.capacidad}.` : ''} Lengua del contexto: {unidad.lenguaContexto}.
                  {' '}{unidad.motivoSeleccion}{unidad.certificacion ? ` Certificación: ${unidad.certificacion}.` : ''}
                </p>
              </details>
            </header>

            <MapaUnidad unidadId={unidad.id} />

            <details className="nota-tecnica mt-1">
              <summary>Descripción textual del mapa (alternativa accesible)</summary>
              <ul className="lista-limpia mini">
                {unidad.componentes.map((c) => (
                  <li key={c.id}>
                    <strong>{c.nombre}</strong> — {ROTULOS_COMPONENTE[c.tipo] || c.tipo} · {c.coordenadas.lat.toFixed(3)}, {c.coordenadas.lng.toFixed(3)} (aproximadas)
                  </li>
                ))}
              </ul>
            </details>
          </section>

          <section className="banda">
            <header className="banda-cab">
              <span className="overline">Cifras del expediente</span>
            </header>
            <div className="cifras">
              <div className="cifra"><strong>{conteo.rojo}</strong><span>hallazgo(s)</span></div>
              <div className="cifra"><strong>{conteo.ambar}</strong><span>en curso</span></div>
              <div className="cifra"><strong>{conteo.verde}</strong><span>sin hallazgo</span></div>
              <div className="cifra-dona">
                <Dona
                  datos={[
                    { rotulo: 'Hallazgo', valor: conteo.rojo, color: 'var(--rojo)' },
                    { rotulo: 'En curso', valor: conteo.ambar, color: 'var(--ambar)' },
                    { rotulo: 'Sin hallazgo', valor: conteo.verde, color: 'var(--verde)' },
                  ]}
                  tamano={104}
                />
              </div>
              <p className="mini texto-3 mb-0">
                Años: {años.map(([a, v]) => `${a} (${v})`).join(' · ')}. El semáforo evalúa documentos, no empresas.
              </p>
            </div>
          </section>

          <section id="tabla-contraste" className="banda">
            <header className="banda-cab">
              <span className="overline">Contraste documental</span>
              <h2>Lo que registran los documentos</h2>
            </header>
            <div className="tabla-envoltura tabla-limpia">
              <table className="tabla">
                <caption className="sr-only">Tabla de contraste: cuerpo o componente, parámetro, estado del semáforo, cita literal, fuente y fecha de cada registro</caption>
                <thead>
                  <tr>
                    <th>Cuerpo / componente</th>
                    <th>Parámetro y estándar</th>
                    <th>Estado</th>
                    <th>Cita literal</th>
                    <th>Fuente</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map((r: Registro) => (
                    <tr key={r.id}>
                      <td className="celda-fuerte">{r.cuerpoAgua || r.componente || '—'}</td>
                      <td className="celda-mini">{r.parametro}<div className="celda-mini">{r.estandar}</div></td>
                      <td><Semaforo valor={r.semaforo} /></td>
                      <td className="celda-mini" style={{ maxWidth: 360, fontStyle: 'italic' }}>«{r.citaLiteral}»</td>
                      <td className="celda-mini">
                        <a href={urlBusqueda(r.fuente)} target="_blank" rel="noreferrer noopener" className="enlace-accion">
                          {r.fuente.organismo} <Icono nombre="externo" tamano={11} />
                        </a>
                        <div className="celda-mini">{fechaCorta(r.fecha)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {registros.map((r, i) => (
              <details key={`detalle-${r.id}`} className="plegable" style={{ animationDelay: `${0.04 * i}s` }}>
                <summary>Expediente completo — {r.cuerpoAgua || r.componente}</summary>
                <div className="plegable-cuerpo">
                  <TarjetaRegistro registro={r} />
                  <Rectificacion registroId={r.id} />
                </div>
              </details>
            ))}
          </section>

          {lineaTiempo.length > 0 && (
            <section className="banda">
              <header className="banda-cab">
                <span className="overline">Línea de fiscalización</span>
                <h2>La historia procesal, en orden</h2>
                <p className="mini texto-3 mb-0">Una medida preventiva no es una sanción; una reconsideración parcial no es una absolución.</p>
              </header>
              <ul className="tl">
                {lineaTiempo.map((r) => (
                  <li key={`tl-${r.id}`} className="tl-item">
                    <span className={`tl-punto ${r.semaforo}`} />
                    <div className="tl-fecha">{fechaCorta(r.fecha)} · {r.fuente.organismo}</div>
                    <div className="tl-cuerpo">{r.hecho}</div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="banda">
            <header className="banda-cab">
              <span className="overline">Entender los estudios</span>
            </header>
            <dl className="definiciones">
              <div>
                <dt>Qué es un EIA</dt>
                <dd>El instrumento que el Estado aprueba (hoy vía SENACE). Contiene compromisos que la empresa asumió: se pueden contrastar con lo supervisado.</dd>
              </div>
              <div>
                <dt>ECA ≠ LMP</dt>
                <dd>El ECA mide el cuerpo receptor; el LMP limita lo que la actividad descarga. Cada estudio cita la norma de su época.</dd>
              </div>
              <div>
                <dt>Cuando el estudio contradice lo que ves</dt>
                <dd>Documenta con huella, contrasta con las fuentes y denuncia ante OEFA/ANA. Ese contraste es exactamente lo que este sistema registra.</dd>
              </div>
            </dl>
          </section>

          <section className="banda">
            <header className="banda-cab">
              <span className="overline">El territorio en imágenes</span>
            </header>
            <div className="galeria-libre">
              <Foto archivo="img/quechua-textil.webp" leyenda="Comunidad altoandina (Lares, Cusco)" />
              <Foto archivo="img/mineria-subterranea.webp" leyenda="Labor minera subterránea" />
              <Foto archivo="img/rio-perene.webp" leyenda="Río Perené — archivo" />
              <Foto archivo="img/altiplano-ganado.webp" leyenda="Ganadería de altura" />
            </div>
            <p className="mini texto-3 mt-05 mb-0">
              Imágenes referenciales, no fotodocumento de los puntos exactos. Créditos completos en <Link to="/creditos">/creditos</Link>.
            </p>
          </section>

          <section className="banda">
            <header className="banda-cab">
              <span className="overline">Marco normativo</span>
              <h2>Contra qué se contrasta</h2>
            </header>
            <div className="tabla-envoltura tabla-limpia">
              <table className="tabla">
                <caption className="sr-only">Límites máximos permisibles de efluentes minero-metalúrgicos (D.S. N.° 010-2010-MINAM)</caption>
                <thead>
                  <tr><th>Parámetro</th><th>Unidad</th><th>Límite en cualquier momento</th><th>Promedio anual</th></tr>
                </thead>
                <tbody>
                  {SEMILLA.normativas.lmpEfluentesMineros.parametros.map((p) => (
                    <tr key={p.parametro}>
                      <td className="celda-fuerte">{p.parametro}</td>
                      <td className="celda-mini">{p.unidad}</td>
                      <td className="dato-mono">{p.limiteCualquierMomento}</td>
                      <td className="dato-mono">{p.promedioAnual}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mini texto-3 mt-05 mb-0">
              <a href={urlBusqueda(SEMILLA.normativas.lmpEfluentesMineros.fuente)} target="_blank" rel="noreferrer noopener">
                {SEMILLA.normativas.lmpEfluentesMineros.norma} — abrir fuente →
              </a>{' '}
              · {SEMILLA.normativas.ecaAgua.norma} (ECA Agua): <a href={urlBusqueda(SEMILLA.normativas.ecaAgua.fuente)} target="_blank" rel="noreferrer noopener">abrir fuente →</a>
            </p>
          </section>

          <section className="banda">
            <header className="banda-cab">
              <span className="overline">Canales oficiales</span>
              <h2>Las instituciones, con sus servicios y redes</h2>
              <p className="mini texto-3 mb-0">
                Verificado el {FECHA_VERIFICACION_ENLACES}.{' '}
                <Link to="/denunciar">¿Cómo denunciar? →</Link>
              </p>
            </header>
            <ul className="lista-canales">
              {Object.entries(INSTITUCIONES).map(([key, inst]) => (
                <li key={key} className="canal-fila">
                  <span className="canal-entidad">{inst.sigla}</span>
                  <span className="canal-enlaces">
                    {inst.canales.map((c) => (
                      <a key={c.url} href={c.url} target="_blank" rel="noreferrer noopener">
                        {c.etiqueta.length > 40 ? c.etiqueta.slice(0, 38) + '…' : c.etiqueta}
                      </a>
                    ))}
                    {inst.redes.map((r) => (
                      <a key={r.url} href={r.url} target="_blank" rel="noreferrer noopener" className="canal-red">
                        <Icono nombre={r.tipo === 'x' ? 'x-social' : r.tipo === 'facebook' ? 'facebook' : 'youtube'} tamano={11} />
                        {r.usuario}
                      </a>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : (
        <section className="banda">
          <Vacio
            icono="capas"
            titulo="Territorio en preparación"
            detalle="Sin unidades verificadas todavía: no se presenta ningún dato simulado como real."
          />
        </section>
      )}
    </>
  );
}
