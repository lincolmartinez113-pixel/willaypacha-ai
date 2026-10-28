import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raizWeb = path.dirname(fileURLToPath(import.meta.url));

/** Build de ARCHIVO ÚNICO: apps/web/standalone/index.html contiene toda la app
 *  (JS y CSS embebidos, rutas hash) y funciona con DOBLE CLIC bajo file://.
 *  Sin backend, el modo demo declarado degrada con honestidad: el Radar y las
 *  páginas legales funcionan; el asistente declara que el servidor no responde. */
export default defineConfig({
  root: raizWeb,
  plugins: [react(), viteSingleFile()],
  base: './',
  build: {
    outDir: path.join(raizWeb, 'standalone'),
    emptyOutDir: true,
  },
});
