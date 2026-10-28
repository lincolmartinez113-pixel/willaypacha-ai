import creditos from './img/creditos.json';
import hero from './assets/img/hero-altiplano.webp';
import textil from './assets/img/quechua-textil.webp';
import minera from './assets/img/mineria-subterranea.webp';
import lagunas from './assets/img/selva-central.webp';
import perene from './assets/img/rio-perene.webp';
import alpacas from './assets/img/altiplano-ganado.webp';
import relaves from './assets/img/relaves.webp';
import paisaje from './assets/img/paisaje-rio.webp';

export interface CreditoFoto {
  archivo: string;
  titulo: string;
  autor: string;
  licencia: string;
  pagina: string;
  pie: string;
  busqueda?: string;
  fuente: string;
}

export const CREDITOS = creditos as {
  meta: { fuente: string; nota: string; generado: string; verificado?: string };
  fotos: CreditoFoto[];
};

/** Las fotos viven en src/assets y se importan: el build las empaqueta (y el
 *  build de archivo único las incrusta en base64, así funcionan bajo file://). */
const URLS: Record<string, string> = {
  'img/hero-altiplano.webp': hero,
  'img/quechua-textil.webp': textil,
  'img/mineria-subterranea.webp': minera,
  'img/selva-central.webp': lagunas,
  'img/rio-perene.webp': perene,
  'img/altiplano-ganado.webp': alpacas,
  'img/relaves.webp': relaves,
  'img/paisaje-rio.webp': paisaje,
};

export function urlDe(archivo: string): string {
  return URLS[archivo] ?? archivo;
}

export function creditoDe(archivo: string): CreditoFoto | undefined {
  return CREDITOS.fotos.find((f) => f.archivo === archivo);
}

export const IMAGEN_HERO = 'img/hero-altiplano.webp';
