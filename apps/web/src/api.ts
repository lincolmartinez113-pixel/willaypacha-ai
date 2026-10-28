/** Cliente HTTP del frontend. Si el servidor no está disponible (demo estática u
 *  offline), las llamadas blandas devuelven null y la interfaz lo declara. */

export interface Salud {
  ok: boolean;
  version: string;
  modo: 'demo' | 'en-vivo';
  meta: { habilitada: boolean; modelo: string; nota: string };
  idiomas: unknown;
  segmentacion: { motorActivo: string; declaracion: string; motorEnVivo: string | null };
  clavesPorDefecto: boolean;
  aviso: string;
  fecha: string;
}

export interface ResultadoExplicacion {
  bloqueado: boolean;
  modo: string;
  texto: string;
  textoLengua: string | null;
  estadoTraduccion: string | null;
  terminosGlosario: { es: string; lengua: string; valor: string; estado: string }[];
  motivo: string;
  citas: {
    registroId: string;
    organismo: string;
    documento: string;
    url: string;
    busqueda: string;
    fecha: string;
    semaforo: string;
    citaLiteral: string;
    hashDocumento: string | null;
  }[];
  registroGeneracion: {
    modo: string;
    modelo: string;
    prompt: string;
    fecha: string;
    fuentes: { id: string; hash: string | null }[];
    verificacion: { aprobado: boolean; motivoBloqueo: string | null };
    nota?: string;
  };
  error?: string;
  motivoCaida?: string | null;
}

export interface DocumentoResumen {
  id: string;
  tipo: string;
  unidadId: string;
  estado: string;
  creadoEl: string;
  aprobadoEl: string | null;
  experto: { nombre: string; tipo: string; colegiatura: string } | null;
  puedeDescargarFinal: boolean;
  bitacora: { fecha: string; evento: string; detalle: string }[];
}

export interface CasoPublico {
  id: string;
  estado: string;
  relato: string;
  lengua: string;
  zona: string;
  identidadReservada: boolean;
  evidencias: { hash: string; tipo: string; fechaCarga: string; metadatosOcultos: boolean; metadatos: unknown }[];
  consistencia: { resultado: string; nota: string };
  publicadoEl: string;
  leyenda: string;
  descargo?: { motivo: string; apelacion: string };
}

async function pedir<T>(ruta: string, opciones?: RequestInit): Promise<T | null> {
  try {
    const r = await fetch(ruta, { headers: { 'content-type': 'application/json' }, ...opciones });
    if (!r.ok) {
      const cuerpo = (await r.json().catch(() => ({}))) as Record<string, unknown>;
      throw new Error(String(cuerpo.error || `HTTP ${r.status}`));
    }
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

/** Igual que pedir, pero lanza el error para mostrarlo en pantalla. */
export async function pedirEstricto<T>(ruta: string, opciones?: RequestInit): Promise<T> {
  const r = await fetch(ruta, { headers: { 'content-type': 'application/json' }, ...opciones });
  const cuerpo = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(String((cuerpo as Record<string, unknown>).error || `HTTP ${r.status}`));
  return cuerpo as T;
}

export function cabecerasRol(rol: string, clave: string): Record<string, string> {
  const h: Record<string, string> = { 'content-type': 'application/json' };
  if (rol) h['x-demo-rol'] = rol;
  if (clave) h['x-demo-clave'] = clave;
  return h;
}

export const api = {
  salud: (): Promise<Salud | null> => pedir<Salud>('/api/salud'),  explicar: (consulta: string, lengua: string, registroId?: string): Promise<ResultadoExplicacion | null> =>
    pedir<ResultadoExplicacion>('/api/explicar', {
      method: 'POST',
      body: JSON.stringify({ consulta, lengua, registroId: registroId ?? null }),
    }),
  disponibilidadIdiomas: () => pedir<Record<string, unknown>>('/api/idiomas/disponibilidad'),
  disponibilidadTts: (): Promise<{ tts: Record<string, Record<string, unknown>> } | null> =>
    pedir<{ tts: Record<string, Record<string, unknown>> }>('/api/idiomas/disponibilidad'),
  tts: (texto: string, lengua: string): Promise<{ disponible: boolean; motivo?: string; checkpoint?: string; licencia?: string } | null> =>
    pedir('/api/voz/tts', { method: 'POST', body: JSON.stringify({ texto, lengua }) }),
  segment: (): Promise<{ motor: string; instruccion: string; etiquetaObligatoria: string } | null> =>
    pedir('/api/segment', { method: 'POST' }),
  documentos: (): Promise<{ documentos: DocumentoResumen[] } | null> => pedir('/api/documentos'),
  bitacoraRegistro: (registroId: string): Promise<{ cambios: { cambio: string; documento: string | null; fecha: string }[] } | null> =>
    pedir(`/api/bitacora/${encodeURIComponent(registroId)}`),
  casosPublicos: (): Promise<{ publicados: CasoPublico[]; leyenda: string } | null> =>
    pedir('/api/casos'),
};

