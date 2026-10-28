/** Directorio de instituciones con CANALES REALES verificados.
 *  Verificación: búsqueda web el 21/10/2026 (servicios oficiales en dominios
 *  gob.pe / senace.gob.pe / defensoria.gob.pe, y perfiles institucionales en
 *  redes). El portal oficial siempre prevalece; si un enlace cambiara, se
 *  reporta por el canal de rectificación y se corrige. */

export interface Canal {
  etiqueta: string;
  url: string;
  tipo: 'portal' | 'tramite' | 'consulta' | 'red';
}

export interface RedSocial {
  tipo: 'x' | 'facebook' | 'youtube';
  url: string;
  usuario: string;
}

export interface Institucion {
  sigla: string;
  nombre: string;
  canales: Canal[];
  redes: RedSocial[];
}

export const INSTITUCIONES: Record<string, Institucion> = {
  oefa: {
    sigla: 'OEFA · SINADA',
    nombre: 'Organismo de Evaluación y Fiscalización Ambiental',
    canales: [
      { etiqueta: 'Portal institucional', url: 'https://www.gob.pe/institucion/oefa/', tipo: 'portal' },
      { etiqueta: 'Formulario de Denuncias Ambientales (SINADA, en línea)', url: 'https://facilita.gob.pe/t/2453', tipo: 'tramite' },
    ],
    redes: [
      { tipo: 'x', url: 'https://x.com/OEFAperu', usuario: '@OEFAperu' },
      { tipo: 'facebook', url: 'https://www.facebook.com/oefa.peru', usuario: 'OEFA Perú' },
    ],
  },
  ana: {
    sigla: 'ANA',
    nombre: 'Autoridad Nacional del Agua',
    canales: [
      { etiqueta: 'Portal, trámites y Mesa de Partes', url: 'https://www.gob.pe/ana', tipo: 'portal' },
    ],
    redes: [
      { tipo: 'x', url: 'https://x.com/ANAPeru', usuario: '@ANAPeru' },
      { tipo: 'facebook', url: 'https://www.facebook.com/autoridadnacionaldelagua', usuario: 'Autoridad Nacional del Agua' },
    ],
  },
  senace: {
    sigla: 'SENACE',
    nombre: 'Servicio Nacional de Certificación Ambiental',
    canales: [
      { etiqueta: 'Portal institucional', url: 'https://www.gob.pe/institucion/senace/', tipo: 'portal' },
      { etiqueta: 'Plataforma EVA (ventanilla única)', url: 'https://www.senace.gob.pe/eva', tipo: 'tramite' },
      { etiqueta: 'Consulta Ciudadana de Proyectos', url: 'https://consultaciudadana.senace.gob.pe/', tipo: 'consulta' },
    ],
    redes: [
      { tipo: 'x', url: 'https://x.com/SenacePeru', usuario: '@SenacePeru' },
      { tipo: 'facebook', url: 'https://www.facebook.com/SenacePeru', usuario: 'Senace Perú' },
    ],
  },
  defensoria: {
    sigla: 'DP',
    nombre: 'Defensoría del Pueblo',
    canales: [
      { etiqueta: 'Portal institucional', url: 'https://www.defensoria.gob.pe/', tipo: 'portal' },
      { etiqueta: 'Presente su caso en línea (SID)', url: 'https://apps2.defensoria.gob.pe/sidPublic', tipo: 'tramite' },
    ],
    redes: [
      { tipo: 'x', url: 'https://x.com/Defensoria_Peru', usuario: '@Defensoria_Peru' },
      { tipo: 'facebook', url: 'https://www.facebook.com/defensoriaperu', usuario: 'Defensoría del Pueblo' },
    ],
  },
  cultura: {
    sigla: 'MC',
    nombre: 'Ministerio de Cultura',
    canales: [
      { etiqueta: 'Portal institucional', url: 'https://www.gob.pe/institucion/cultura/', tipo: 'portal' },
    ],
    redes: [
      { tipo: 'x', url: 'https://x.com/MinCulturaPe', usuario: '@MinCulturaPe' },
      { tipo: 'facebook', url: 'https://www.facebook.com/mincu.pe', usuario: 'Ministerio de Cultura del Perú' },
    ],
  },
  mp: {
    sigla: 'MP · FEMA',
    nombre: 'Ministerio Público — Fiscalía de la Nación',
    canales: [
      { etiqueta: 'Portal institucional', url: 'https://www.gob.pe/institucion/mp-fn/', tipo: 'portal' },
    ],
    redes: [
      { tipo: 'x', url: 'https://x.com/FiscaliaPeru', usuario: '@FiscaliaPeru' },
      { tipo: 'facebook', url: 'https://www.facebook.com/FiscaliaPeru', usuario: 'Ministerio Público — Fiscalía de la Nación' },
    ],
  },
  minsa: {
    sigla: 'MINSA',
    nombre: 'Ministerio de Salud',
    canales: [
      { etiqueta: 'Portal institucional', url: 'https://www.gob.pe/minsa/', tipo: 'portal' },
    ],
    redes: [
      { tipo: 'x', url: 'https://x.com/Minsa_Peru', usuario: '@Minsa_Peru' },
      { tipo: 'facebook', url: 'https://www.facebook.com/minsaperu', usuario: 'Ministerio de Salud del Perú' },
    ],
  },
};

export const FECHA_VERIFICACION_ENLACES = '21/10/2026';
