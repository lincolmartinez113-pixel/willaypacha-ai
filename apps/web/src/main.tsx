import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { ProveedorLengua } from './i18n';
import { ProveedorTema } from './contextoTema';
import '@fontsource-variable/fraunces';
import '@fontsource-variable/instrument-sans';
import '@fontsource-variable/jetbrains-mono';
import './estilos.css';

createRoot(document.getElementById('raiz')!).render(
  <React.StrictMode>
    <HashRouter>
      <ProveedorLengua>
        <ProveedorTema>
          <App />
        </ProveedorTema>
      </ProveedorLengua>
    </HashRouter>
  </React.StrictMode>,
);

// PWA: service worker solo en producción.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* sin service worker: la app sigue funcionando en línea */
    });
  });
}
