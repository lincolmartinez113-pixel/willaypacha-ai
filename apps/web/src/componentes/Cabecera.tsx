import { NavLink } from 'react-router-dom';
import Icono, { type NombreIcono } from './Icono';
import type { Salud } from '../api';
import { useLengua, type CodigoLengua } from '../i18n';
import { useTema } from '../contextoTema';

const LENGUAS: { codigo: CodigoLengua; etiqueta: string }[] = [
  { codigo: 'es', etiqueta: 'Español' },
  { codigo: 'qu', etiqueta: 'Runa simi · quechua' },
  { codigo: 'ay', etiqueta: 'Aymar aru · aimara' },
  { codigo: 'ash', etiqueta: 'Asháninka' },
];

const MODULOS: { ruta: string; etiqueta: string; icono: NombreIcono }[] = [
  { ruta: '/', etiqueta: 'Radar', icono: 'radar' },
  { ruta: '/rimay', etiqueta: 'Asistente', icono: 'mic' },
  { ruta: '/evidencia', etiqueta: 'Evidencia', icono: 'aperture' },
  { ruta: '/documentos', etiqueta: 'Documentos', icono: 'documento' },
  { ruta: '/casos', etiqueta: 'Casos', icono: 'comunidad' },
  { ruta: '/denunciar', etiqueta: 'Denunciar', icono: 'escudo' },
];

export function Marca({ tamano = 36 }: { tamano?: number }) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 44 44" aria-hidden="true" style={{ flex: 'none' }}>
      <defs>
        <linearGradient id="marca-fondo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff3df" />
          <stop offset="1" stopColor="#f0dcc0" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="42" height="42" rx="12" fill="url(#marca-fondo)" stroke="rgba(193,79,36,0.45)" />
      <g fill="none" stroke="#c14f24" strokeOpacity="0.55" strokeWidth="1.1">
        <path d="M13 27c-3-5 0-12 6-14s13 1 14 7-3 11-9 12-9-1-11-5z" />
        <path d="M16 25.5c-2-3.4 0-8.4 4.4-9.8s9.2.7 9.9 5" />
      </g>
      <circle cx="21" cy="23" r="2.1" fill="#c14f24" />
      <circle cx="26.5" cy="18.5" r="1.3" fill="#a87518" />
      <circle cx="30" cy="25" r="1.1" fill="#2e8f5a" />
    </svg>
  );
}

export default function Cabecera({ salud, cargandoSalud, enLinea }: { salud: Salud | null; cargandoSalud?: boolean; enLinea: boolean }) {
  const { lengua, setLengua } = useLengua();
  const { tema, alternar } = useTema();

  return (
    <header className="cabecera">
      <div className="cabecera-interior">
        <NavLink to="/" className="marca" aria-label="WillayPacha AI — inicio">
          <Marca />
          <span>
            <span className="marca-nombre">WillayPacha AI</span>
            <span className="marca-sub">Dossier del territorio</span>
          </span>
        </NavLink>

        <nav className="nav" aria-label="Módulos">
          {MODULOS.map((m) => (
            <NavLink key={m.ruta} to={m.ruta} end={m.ruta === '/'}>
              <Icono nombre={m.icono} tamano={15} />
              {m.etiqueta}
            </NavLink>
          ))}
        </nav>

        <div className="cabecera-acciones">
          {!enLinea && (
            <span className="chip offline"><span className="punto" /><span className="chip-texto">Sin conexión</span></span>
          )}
          {cargandoSalud ? (
            <span className="chip neutro" aria-busy="true" role="status" aria-label="Consultando el estado del motor">
              <span className="esqueleto" style={{ width: 84, height: 10, display: 'inline-block' }} />
            </span>
          ) : salud ? (
            <span className={`chip ${salud.modo === 'en-vivo' ? 'vivo' : 'demo'}`} title={salud.meta.nota}>
              <span className="punto" />
              <span className="chip-texto">{salud.modo === 'en-vivo' ? `en vivo · ${salud.meta.modelo}` : 'modo demo'}</span>
            </span>
          ) : (
            <span className="chip neutro"><span className="punto" /><span className="chip-texto">sin backend</span></span>
          )}
          <label className="sr-only" htmlFor="selector-lengua">Lengua de la interfaz</label>
          <select
            id="selector-lengua"
            className="selector-lengua"
            value={lengua}
            onChange={(e) => setLengua(e.target.value as CodigoLengua)}
            aria-label="Lengua de la interfaz — simi / aru"
          >
            {LENGUAS.map((l) => (
              <option key={l.codigo} value={l.codigo}>
                {l.etiqueta}{l.codigo !== 'es' ? ' · borrador' : ''}
              </option>
            ))}
          </select>
          <button
            className="boton fantasma pequeno tema-boton"
            onClick={alternar}
            aria-label={tema === 'papel' ? 'Cambiar al tema Noche andina' : 'Cambiar al tema Papel'}
            title={tema === 'papel' ? 'Tema Noche andina' : 'Tema Papel'}
          >
            <Icono nombre={tema === 'papel' ? 'luna' : 'sol'} tamano={16} />
            <span className="tema-etiqueta">{tema === 'papel' ? 'Noche' : 'Papel'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
