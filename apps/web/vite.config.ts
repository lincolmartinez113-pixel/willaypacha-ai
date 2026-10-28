import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raizWeb = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: raizWeb,
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
  build: {
    outDir: path.join(raizWeb, 'dist'),
    emptyOutDir: true,
  },
});
