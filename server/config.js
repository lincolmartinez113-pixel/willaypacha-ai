import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cargarEnvDeRaiz } from './env.js';

// Carga el .env de la raíz SOLO al arrancar el servidor real. Bajo pruebas
// (importación del app con supertest) no se toca, para conservar el modo
// demo determinista que la suite espera.
cargarEnvDeRaiz();

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function env(nombre, defecto = '') {
  const v = process.env[nombre];
  return v === undefined || v === '' ? defecto : v;
}

export const config = {
  raiz,
  puerto: Number(env('PORT', '8787')),
  entorno: env('NODE_ENV', 'development'),

  meta: {
    apiKey: env('META_API_KEY', ''),
    apiBase: env('META_API_BASE', 'https://api.meta.ai/v1'),
    modelo: env('META_MODEL', 'muse-spark-1.3'),
    modeloVoz: env('META_VOICE_MODEL', 'muse-voice'),
    modeloSegmentacion: env('META_SEGMENT_MODEL', 'sam-3.1'),
  },

  idiomas: {
    ttsHabilitado: env('IDIOMAS_TTS_HABILITADO', 'false') === 'true',
    ttsRutaModelos: env('IDIOMAS_TTS_RUTA_MODELOS', ''),
  },

  // Claves de demostración por rol. Si no están definidas se usan valores de
  // demo DEBILITADOS y se declara en /api/salud y en la Política de Seguridad.
  claves: {
    verificador: env('DEMO_CLAVE_VERIFICADOR', 'demo-verificador'),
    admin: env('DEMO_CLAVE_ADMIN', 'demo-admin'),
    clavesPorDefecto: !process.env.DEMO_CLAVE_VERIFICADOR && !process.env.DEMO_CLAVE_ADMIN,
  },

  whatsapp: {
    token: env('WHATSAPP_TOKEN', ''),
    phoneNumberId: env('WHATSAPP_PHONE_NUMBER_ID', ''),
    verifyToken: env('WHATSAPP_VERIFY_TOKEN', ''),
  },

  rutaDatos: path.join(raiz, 'server', 'data'),
};

export const VERSION_SISTEMA = '0.1.0';
export const AVISO_INSTANCIA =
  'Instancia de demostración. Sin META_API_KEY el sistema corre en MODO DEMO declarado: respuestas ancladas a data/datos-semilla.json, sin llamadas en vivo a la Meta Model API. Las capacidades no disponibles se declaran, nunca se simulan.';
export function leerSeed() {
  return JSON.parse(readFileSync(path.join(raiz, 'data', 'datos-semilla.json'), 'utf8'));
}
