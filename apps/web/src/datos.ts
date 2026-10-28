import semilla from '../../../data/datos-semilla.json';

/** Datos semilla curados: se empaquetan con la app (funciona sin conexión) y se
 *  refrescan desde /api/seed cuando el servidor está disponible. */

export interface Fuente {
  organismo: string;
  documento: string;
  url: string;
  busqueda: string;
}

export interface Registro {
  id: string;
  unidadId: string;
  tipo: string;
  cuerpoAgua: string | null;
  componente: string | null;
  parametro: string;
  estandar: string;
  hecho: string;
  fecha: string;
  fechaNota?: string;
  citaLiteral: string;
  citaPagina: string;
  semaforo: 'rojo' | 'ambar' | 'verde';
  semaforoRegla: string;
  atribucion: string;
  estadoProcesal?: string;
  fuente: Fuente;
  confianza: string;
  fechaConsulta: string;
  hashDocumento: string | null;
  hashNota?: string;
}

export interface ComponenteUnidad {
  id: string;
  tipo: string;
  nombre: string;
  coordenadas: { lat: number; lng: number; aproximadas: boolean; nota?: string };
}

export interface Unidad {
  id: string;
  territorioId: string;
  nombre: string;
  empresa: string;
  actividad: string;
  capacidad: string | null;
  ubicacion: string;
  comunidadReferencia: string;
  cuenca: string;
  lenguaContexto: string;
  coordenadas: { lat: number; lng: number; aproximadas: boolean; nota?: string };
  motivoSeleccion: string;
  certificacion: string | null;
  componentes: ComponenteUnidad[];
}

export interface Semilla {
  meta: { nombre: string; fechaPreparacion: string; metodo: string; reglaOro: string; notaHash: string };
  normativas: {
    ecaAgua: { nombre: string; norma: string; notaHonestidad: string; fuente: Fuente };
    lmpEfluentesMineros: {
      nombre: string;
      norma: string;
      notaUso: string;
      fuente: Fuente;
      parametros: { parametro: string; unidad: string; limiteCualquierMomento: string; promedioAnual: string }[];
      notaProtocolo: string;
    };
  };
  territorios: { id: string; nombre: string; lenguaPrincipal: string; estado: string; leyenda?: string }[];
  unidades: Unidad[];
  semforoReglas: { rojo: string; ambar: string; verde: string; leyenda: string };
  registros: Registro[];
}

export const SEMILLA = semilla as unknown as Semilla;

export function registrosDe(unidadId: string): Registro[] {
  return SEMILLA.registros.filter((r) => r.unidadId === unidadId);
}

export function unidadPor(id: string): Unidad | undefined {
  return SEMILLA.unidades.find((u) => u.id === id);
}

/** Enlace a la fuente primaria: portal institucional + término de búsqueda exacto. */
export function urlBusqueda(f: Fuente): string {
  return `${f.url}${f.url.includes('?') ? '&' : '?'}buscar=${encodeURIComponent(f.busqueda)}`;
}

export function etiquetaTipo(tipo: string): string {
  const mapa: Record<string, string> = {
    hallazgo: 'Hallazgo oficial',
    'hallazgo-matizado': 'Hallazgo matizado',
    'sin-hallazgo': 'Sin hallazgo',
    certificacion: 'Certificación ambiental',
    'acto-fiscalizacion': 'Acto de fiscalización',
  };
  return mapa[tipo] || tipo;
}

export function fechaCorta(iso: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return new Date(iso + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  return iso;
}
