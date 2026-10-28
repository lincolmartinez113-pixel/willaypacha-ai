/** Sistema de íconos monolínea (SVG, stroke currentColor). Sin emoji como UI. */
import type { CSSProperties, ReactElement } from 'react';

export type NombreIcono =
  | 'radar' | 'mic' | 'aperture' | 'documento' | 'comunidad' | 'alfiler' | 'gota'
  | 'escudo' | 'balanza' | 'alerta' | 'verificado' | 'info' | 'externo' | 'reloj'
  | 'candado' | 'capas' | 'pulso' | 'lenguas' | 'chevron' | 'lupa' | 'subir'
  | 'cerebro' | 'libro' | 'flecha' | 'mas' | 'x' | 'ojo' | 'ojo-tapado' | 'huella' | 'lista'
  | 'x-social' | 'facebook' | 'youtube' | 'globo' | 'sol' | 'luna';

const TRAZOS: Record<NombreIcono, ReactElement> = {
  radar: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 12l6.5-6.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
      <path d="M12 17.5V21" />
      <path d="M8.5 21h7" />
    </>
  ),
  aperture: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v7l6 6" />
      <path d="M3.6 9h7.4l4-6" />
      <path d="M6 19l4.6-6.2" />
    </>
  ),
  documento: (
    <>
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v4h4" />
      <path d="M10 12h5M10 15.5h5M10 8.5h2" />
    </>
  ),
  comunidad: (
    <>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <circle cx="17" cy="9.5" r="2.4" />
      <path d="M15.5 14.6c2.9.2 5 2 5 4.9" />
    </>
  ),
  alfiler: (
    <>
      <path d="M12 21s-6.5-5.4-6.5-10.2A6.5 6.5 0 0 1 12 4.3a6.5 6.5 0 0 1 6.5 6.5C18.5 15.6 12 21 12 21z" />
      <circle cx="12" cy="10.7" r="2.3" />
    </>
  ),
  gota: (
    <>
      <path d="M12 3.5s6 6.4 6 10.4a6 6 0 0 1-12 0c0-4 6-10.4 6-10.4z" />
      <path d="M9.5 14a2.6 2.6 0 0 0 2.5 2.6" />
    </>
  ),
  escudo: (
    <>
      <path d="M12 3l7 2.6v5.6c0 4.6-3 7.9-7 9.8-4-1.9-7-5.2-7-9.8V5.6z" />
      <path d="M9.2 12l2 2 3.6-3.9" />
    </>
  ),
  balanza: (
    <>
      <path d="M12 4v16" />
      <path d="M7 20h10" />
      <path d="M5 7h14" />
      <path d="M5 7l-2.4 5.4a2.9 2.9 0 0 0 4.8 0z" />
      <path d="M19 7l-2.4 5.4a2.9 2.9 0 0 0 4.8 0z" />
      <circle cx="12" cy="5.4" r="1.4" />
    </>
  ),
  alerta: (
    <>
      <path d="M12 4L2.8 19.5h18.4z" />
      <path d="M12 10v4" />
      <circle cx="12" cy="16.6" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  verificado: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.4 12.2l2.4 2.4 4.8-5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5" />
      <circle cx="12" cy="8" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  externo: (
    <>
      <path d="M14 4h6v6" />
      <path d="M20 4l-8.5 8.5" />
      <path d="M18.5 13.5V20h-14V6h6.5" />
    </>
  ),
  reloj: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  candado: (
    <>
      <rect x="5.5" y="10.5" width="13" height="9.5" rx="2" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
      <circle cx="12" cy="15.2" r="1.2" />
    </>
  ),
  capas: (
    <>
      <path d="M12 3.5l8.5 4.5L12 12.5 3.5 8z" />
      <path d="M4 12.2l8 4.3 8-4.3" />
      <path d="M4 16.2l8 4.3 8-4.3" />
    </>
  ),
  pulso: (
    <>
      <path d="M3 12h4l2.5-6 4 12 2.5-6h5" />
    </>
  ),
  lenguas: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c-4.7 4.7-4.7 12.3 0 17 4.7-4.7 4.7-12.3 0-17z" />
    </>
  ),
  chevron: <path d="M6 9.5l6 6 6-6" />,
  lupa: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M15.8 15.8L20.5 20.5" />
    </>
  ),
  subir: (
    <>
      <path d="M12 16V4.5" />
      <path d="M7.5 9L12 4.5 16.5 9" />
      <path d="M4.5 16.5v3h15v-3" />
    </>
  ),
  cerebro: (
    <>
      <rect x="5" y="5" width="14" height="14" rx="3" />
      <path d="M9.5 9.5h5v5h-5z" />
      <path d="M12 3.8V5M12 19v1.2M3.8 12H5M19 12h1.2" />
    </>
  ),
  libro: (
    <>
      <path d="M4.5 6.5A2.5 2.5 0 0 1 7 4h12.5v14.5H7a2.5 2.5 0 0 0-2.5 2.5z" />
      <path d="M4.5 6.5v14.5" />
      <path d="M9 8.5h7M9 11.5h5" />
    </>
  ),
  flecha: (
    <>
      <path d="M4.5 12h14" />
      <path d="M13.5 7l5 5-5 5" />
    </>
  ),
  mas: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8.5v7M8.5 12h7" />
    </>
  ),
  x: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  ojo: (
    <>
      <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.6" />
    </>
  ),
  'ojo-tapado': (
    <>
      <path d="M2.5 12S6 5.8 12 5.8c1.6 0 3 .4 4.3 1M21.5 12s-3.5 6.2-9.5 6.2c-1.6 0-3-.4-4.3-1" />
      <path d="M4 20L20 4" />
    </>
  ),
  huella: (
    <>
      <rect x="5.5" y="4" width="13" height="16" rx="2" />
      <path d="M9 4V2.8M15 4V2.8" />
      <path d="M9 11.5h6M9 15h4" />
    </>
  ),
  lista: (
    <>
      <path d="M9 6.5h11M9 12h11M9 17.5h11" />
      <circle cx="4.8" cy="6.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="4.8" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="4.8" cy="17.5" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  'x-social': <path d="M4.5 4.5l15 15M19.5 4.5l-15 15" strokeWidth="2.1" />,
  facebook: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M13.8 8h-1.3c-1 0-1.5.5-1.5 1.5V11h2.6l-.4 2.4h-2.2V20" />
    </>
  ),
  youtube: (
    <>
      <rect x="3" y="6.5" width="18" height="11" rx="3" />
      <path d="M10.2 9.6l4.6 2.4-4.6 2.4z" fill="currentColor" stroke="none" />
    </>
  ),
  globo: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c-4.7 4.7-4.7 12.3 0 17 4.7-4.7 4.7-12.3 0-17z" />
    </>
  ),
  sol: (
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.8v2.2M12 19v2.2M2.8 12h2.2M19 12h2.2M5.5 5.5l1.6 1.6M16.9 16.9l1.6 1.6M18.5 5.5l-1.6 1.6M7.1 16.9l-1.6 1.6" />
    </>
  ),
  luna: (
    <path d="M20 14.2A8.3 8.3 0 1 1 9.8 4a6.6 6.6 0 0 0 10.2 10.2z" />
  ),
};

export default function Icono({
  nombre,
  tamano = 18,
  estilo,
}: {
  nombre: NombreIcono;
  tamano?: number;
  estilo?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={tamano}
      height={tamano}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flex: 'none', ...estilo }}
    >
      {TRAZOS[nombre]}
    </svg>
  );
}
