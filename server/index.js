import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { config, VERSION_SISTEMA } from './config.js';
import { nucleo } from './api/rutas-core.js';
import { vivoPrueba } from './api/vivo-prueba.js';
import { samPrueba } from './api/sam-prueba.js';
import { documentos } from './api/rutas-documentos.js';
import { casos } from './api/rutas-casos.js';
import { arco } from './api/rutas-arco.js';
import { whatsapp } from './whatsapp/index.js';

export const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

app.get('/api', (req, res) => {
  res.json({
    nombre: 'WillayPacha AI',
    version: VERSION_SISTEMA,
    mensaje: 'Información pública con fuente, fecha y cita. Ningún texto generado se muestra sin pasar por el verificador.',
    endpoints: [
      'GET /api/salud',
      'GET /api/seed',
      'GET /api/registros?unidadId=',
      'POST /api/explicar',
      'POST /api/vivo-prueba',
      'POST /api/sam-prueba',
      'GET /api/idiomas/disponibilidad',
      'POST /api/voz/tts · POST /api/voz/transcribir',
      'POST /api/segment',
      'GET|POST /api/documentos · GET /api/documentos/:id/pdf · GET /api/documentos/registro/:registroId/pdf · POST /api/documentos/:id/revision',
      'GET|POST /api/casos · POST /api/casos/:id/revision · POST /api/casos/:id/retirar',
      'POST /api/arco/solicitud · POST /api/arco/:id/ejecutar',
      'POST /api/rectificaciones · GET /api/bitacora/:registroId',
    ],
  });
});

app.use('/api', nucleo);
app.use('/api', vivoPrueba);
app.use('/api', samPrueba);
app.use('/api/documentos', documentos);
app.use('/api/casos', casos);
app.use('/api/arco', arco);
app.use('/api/whatsapp', whatsapp);

app.use((req, res) => {
  res.status(404).json({ error: 'ruta no encontrada', ruta: req.originalUrl });
});

// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  const esMulter = error?.name === 'MulterError' || /tipo de archivo no permitido/.test(error?.message || '');
  res.status(esMulter ? 400 : 500).json({
    error: esMulter ? 'archivo rechazado' : 'error interno',
    detalle: String(error?.message || error),
  });
});

const esEjecucionDirecta =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (esEjecucionDirecta) {
  app.listen(config.puerto, () => {
    console.log(`WillayPacha AI — servidor en http://localhost:${config.puerto}`);
    console.log(`Modo: ${config.meta.apiKey ? 'EN VIVO (Meta Model API)' : 'DEMO declarado (sin META_API_KEY)'}`);
    console.log('Regla: ningún texto generado se muestra sin pasar por el verificador P6.');
  });
}
