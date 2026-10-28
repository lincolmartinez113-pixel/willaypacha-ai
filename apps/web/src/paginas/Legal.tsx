import { useParams, Link, NavLink } from 'react-router-dom';
import { DOCS_LEGAL } from '../legal/contenidos';
import { useLengua } from '../i18n';
import Icono from '../componentes/Icono';

const ICONO_DOC: Record<string, Parameters<typeof Icono>[0]['nombre']> = {
  privacidad: 'candado',
  terminos: 'documento',
  aviso: 'balanza',
  contenido: 'lista',
  seguridad: 'escudo',
  'transparencia-ia': 'cerebro',
};

export default function Legal() {
  const { documento } = useParams();
  const doc = DOCS_LEGAL.find((d) => d.slug === documento) ?? null;
  const { paquete } = useLengua();

  if (!doc) {
    return (
      <>
        <div className="intro">
          <div className="surge">
            <div className="kicker">Documentos legales y de transparencia</div>
            <h1>Las reglas por las que corre esta plataforma</h1>
            <p className="plomo">
              Seis documentos redactados desde los datos reales del proyecto —normas, instituciones, lugares y
              flujos concretos—, no desde plantillas. Privacidad y términos incluyen resumen en lenguaje simple y
              versiones en lenguas originarias con su estado de validación.
            </p>
          </div>
          <aside className="ficha surge surge-2">
            <div className="ficha-titulo"><span>Idiomas de las políticas</span></div>
            <p className="mini texto-2 mb-0">
              Una política de privacidad que la comunidad no puede leer en su lengua no cumple su función aunque
              cumpla su forma. Las versiones en quechua, aimara y asháninka están en <strong>borrador</strong>,
              pendientes de validación por hablantes e intérpretes registrados.
            </p>
          </aside>
        </div>

        <div className="doc-indice surge surge-2">
          {DOCS_LEGAL.map((d) => (
            <Link key={d.slug} to={`/legal/${d.slug}`} className="tarjeta">
              <div className="tarjeta-cabecera">
                <div className="tarjeta-titulo" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Icono nombre={ICONO_DOC[d.slug] || 'documento'} tamano={16} estilo={{ color: 'var(--acento)' }} />
                  {d.titulo}
                </div>
                <Icono nombre="flecha" tamano={14} estilo={{ color: 'var(--texto-3)' }} />
              </div>
              <ul className="lista-limpia mini mb-0">
                {d.resumenSimple.map((r, i) => (
                  <li key={i}>· {r}</li>
                ))}
              </ul>
            </Link>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="legal-disposicion mt-2">
        <nav className="legal-nav surge" aria-label="Documentos legales">
          {DOCS_LEGAL.map((d) => (
            <NavLink key={d.slug} to={`/legal/${d.slug}`} className={({ isActive }) => (isActive ? 'activo' : '')}>
              <Icono nombre={ICONO_DOC[d.slug] || 'documento'} tamano={14} />
              {d.titulo}
            </NavLink>
          ))}
          <NavLink to="/legal" end className={({ isActive }) => (isActive ? 'activo' : '')}>
            <Icono nombre="lista" tamano={14} />
            Todos los documentos
          </NavLink>
        </nav>

        <article className="placa esquinas surge surge-2">
          <div className="placa-cabecera">
            <div>
              <div className="placa-cintillo" style={{ marginBottom: '0.4rem' }}><span>Documento real del proyecto · v1</span></div>
              <h1 style={{ fontSize: '2.1rem' }}>{doc.titulo}</h1>
            </div>
            <Icono nombre={ICONO_DOC[doc.slug] || 'documento'} tamano={26} estilo={{ color: 'var(--acento)' }} />
          </div>

          <div className="aviso info mb-2">
            <Icono nombre="info" tamano={16} />
            <span>
              <strong>En lenguaje simple:</strong>
              <ul className="lista-limpia mini mt-05 mb-0">
                {doc.resumenSimple.map((r, i) => <li key={i}>· {r}</li>)}
              </ul>
            </span>
          </div>

          <div className="prosa">
            {doc.secciones.map((s) => (
              <div key={s.titulo}>
                <h3>{s.titulo}</h3>
                {s.parrafos?.map((p, i) => <p key={i}>{p}</p>)}
                {s.lista && (
                  <ul>
                    {s.lista.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>

          <div className="separador" />
          <div className="aviso neutro mb-0">
            <Icono nombre="lenguas" tamano={16} />
            <span>
              <strong>Versiones en lenguas originarias:</strong> en borrador, pendientes de validación por
              hablantes e intérpretes registrados. Aviso vigente ({paquete.nombre}): {paquete.aviso}
            </span>
          </div>
        </article>
      </div>
    </>
  );
}
