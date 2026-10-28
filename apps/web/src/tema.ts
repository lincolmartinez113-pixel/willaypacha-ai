/** Puente entre los tokens CSS y el código que los necesita fuera del CSS
 *  (canvas de la lámina, marcadores de Leaflet). Una sola fuente de verdad:
 *  los valores viven en :root de estilos.css. */
export function token(nombre: string, respaldo = '#000000'): string {
  if (typeof window === 'undefined') return respaldo;
  const valor = getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();
  return valor || respaldo;
}

export const COLORES_MAPA: Record<string, string> = {
  bocamina: 'var(--mapa-bocamina)',
  relavera: 'var(--mapa-relavera)',
  'punto-vertimiento': 'var(--mapa-vertimiento)',
  'cuerpo-agua': 'var(--mapa-agua)',
  comunidad: 'var(--mapa-comunidad)',
};

/** Paleta concreta por tema (Leaflet pinta SVG y no resuelve var()). */
const PALETA_MAPA: Record<'papel' | 'noche', Record<string, string>> = {
  papel: {
    bocamina: '#2f5f8f',
    relavera: '#9c3f66',
    'punto-vertimiento': '#b97a06',
    'cuerpo-agua': '#3d7ea6',
    comunidad: '#5d4834',
  },
  noche: {
    bocamina: '#7fb2e8',
    relavera: '#e08ab0',
    'punto-vertimiento': '#e8a33c',
    'cuerpo-agua': '#5cc9d8',
    comunidad: '#cfd8e6',
  },
};

export function coloresMapaConcretos(tema: 'papel' | 'noche' = 'papel'): Record<string, string> {
  return PALETA_MAPA[tema] || PALETA_MAPA.papel;
}

/** Teselas de OpenStreetMap (sin clave de API). El tema noche se resuelve con
 *  un filtro CSS sobre la capa de teselas (ver estilos.css). */
export function tilesDelTema(_tema: 'papel' | 'noche'): string {
  return 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
}
