#!/usr/bin/env node
/**
 * FASE 2 · Incremento 1 — aplica la tabla de correspondencia aprobada a
 * apps/web/src/estilos.css. NO es una sustitución ciega: cada valor antiguo
 * tiene un destino declarado aquí y la tabla completa se escribe en
 * docs/evidencia/fase-2/tabla-correspondencia.txt para el informe.
 * Uso: node tools/fase-2-aplicar-tokens.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const RUTA = 'apps/web/src/estilos.css';
let css = readFileSync(RUTA, 'utf8');

// ── 1. Escala tipográfica (6 roles) ──────────────────────────────
const TIPOGRAFIA = [
  // [valor antiguo literal, destino]
  ['font-size: clamp(2.1rem, 4.2vw, 3.3rem);', 'font-size: var(--t-display);'],
  ['font-size: 1.62rem;', 'font-size: var(--t-h2);'],
  ['font-size: 1.5rem;', 'font-size: var(--t-h2);'],
  ['font-size: 1.16rem;', 'font-size: var(--t-h3);'],
  ['font-size: 1.14rem;', 'font-size: var(--t-h3);'],
  ['font-size: 1.06rem;', 'font-size: var(--t-h3);'],
  ['font-size: 15px;', 'font-size: var(--t-cuerpo);'],
  ['font-size: 1.04rem;', 'font-size: var(--t-cuerpo);'],
  ['font-size: 1.02rem;', 'font-size: var(--t-cuerpo);'],
  ['font-size: 1rem;', 'font-size: var(--t-cuerpo);'],
  ['font-size: 0.98rem;', 'font-size: var(--t-cuerpo);'],
  ['font-size: 0.95rem;', 'font-size: var(--t-cuerpo);'],
  ['font-size: 0.92rem;', 'font-size: var(--t-cuerpo);'],
  ['font-size: 0.9rem;', 'font-size: var(--t-cuerpo);'],
  ['font-size: 0.88rem;', 'font-size: var(--t-pequena);'],
  ['font-size: 0.87rem;', 'font-size: var(--t-pequena);'],
  ['font-size: 0.86rem;', 'font-size: var(--t-pequena);'],
  ['font-size: 0.85rem;', 'font-size: var(--t-pequena);'],
  ['font-size: 0.83rem;', 'font-size: var(--t-pequena);'],
  ['font-size: 0.82rem;', 'font-size: var(--t-pequena);'],
  ['font-size: 0.8rem;', 'font-size: var(--t-pequena);'],
  ['font-size: 0.79rem;', 'font-size: var(--t-pequena);'],
  ['font-size: 0.78rem;', 'font-size: var(--t-pequena);'],
  ['font-size: 0.76rem;', 'font-size: var(--t-micro);'],
  ['font-size: 0.75rem;', 'font-size: var(--t-micro);'],
  ['font-size: 0.74rem;', 'font-size: var(--t-micro);'],
  ['font-size: 0.73rem;', 'font-size: var(--t-micro);'],
  ['font-size: 0.72rem;', 'font-size: var(--t-micro);'],
  ['font-size: 0.7rem;', 'font-size: var(--t-micro);'],
  ['font-size: 0.68rem;', 'font-size: var(--t-micro);'],
  ['font-size: 0.66rem;', 'font-size: var(--t-micro);'],
  ['font-size: 0.64rem;', 'font-size: var(--t-micro);'],
  ['font-size: 0.62rem;', 'font-size: var(--t-micro);'],
  ['font-size: 0.6rem;', 'font-size: var(--t-micro);'],
];
// Casos conservados a propósito (relativos o de terceros):
//   font-size: 0.84em (código en línea, relativo) · 2.6em (capitular, relativo)
//   font-size del canvas/lámina (constantes de tema en TS) · leaflet !important.

// ── 2. Espaciado (escala 4 px: --e-1…--e-7) ─────────────────────
const ESPACIADO = [
  ['gap: 2.2rem;', 'gap: var(--e-7);'],
  ['gap: 1.7rem;', 'gap: var(--e-6);'],
  ['gap: 1.5rem;', 'gap: var(--e-6);'],
  ['gap: 1.4rem;', 'gap: var(--e-6);'],
  ['gap: 1.1rem;', 'gap: var(--e-5);'],
  ['gap: 1rem;', 'gap: var(--e-4);'],
  ['gap: 0.9rem;', 'gap: var(--e-4);'],
  ['gap: 0.85rem 1rem;', 'gap: var(--e-4) var(--e-4);'],
  ['gap: 0.85rem;', 'gap: var(--e-4);'],
  ['gap: 0.8rem;', 'gap: var(--e-4);'],
  ['gap: 0.75rem;', 'gap: var(--e-3);'],
  ['gap: 0.7rem;', 'gap: var(--e-3);'],
  ['gap: 0.65rem;', 'gap: var(--e-3);'],
  ['gap: 0.6rem;', 'gap: var(--e-3);'],
  ['gap: 0.55rem;', 'gap: var(--e-2);'],
  ['gap: 0.5rem;', 'gap: var(--e-2);'],
  ['gap: 0.45rem;', 'gap: var(--e-2);'],
  ['gap: 0.42rem;', 'gap: var(--e-2);'],
  ['gap: 0.4rem;', 'gap: var(--e-2);'],
  ['gap: 0.38rem;', 'gap: var(--e-1);'],
  ['gap: 0.35rem;', 'gap: var(--e-1);'],
  ['gap: 0.34rem;', 'gap: var(--e-1);'],
  ['gap: 0.3rem 1.1rem;', 'gap: var(--e-1) var(--e-5);'],
  ['gap: 0.3rem 1rem;', 'gap: var(--e-1) var(--e-4);'],
  ['gap: 0.3rem;', 'gap: var(--e-1);'],
  ['gap: 0.25rem;', 'gap: var(--e-1);'],
  ['gap: 0.2rem;', 'gap: var(--e-1);'],
  ['gap: 0.15rem;', 'gap: var(--e-1);'],
  ['gap: 0.4rem 0.6rem;', 'gap: var(--e-2) var(--e-3);'],
  ['gap: 0.35rem 1rem;', 'gap: var(--e-1) var(--e-4);'],
  ['gap: 0.35rem 0.5rem;', 'gap: var(--e-1) var(--e-2);'],
  ['gap: 0.3rem 0.5rem;', 'gap: var(--e-1) var(--e-2);'],
  ['gap: 0.2rem 0.5rem;', 'gap: var(--e-1) var(--e-2);'],
  ['gap: 0.6rem;', 'gap: var(--e-3);'],
  ['gap: 2rem;', 'gap: var(--e-6);'],
  ['gap: 1.2rem;', 'gap: var(--e-5);'],
  ['gap: 0.15rem 0.6rem;', 'gap: var(--e-1) var(--e-3);'],
];

// ── 3. Radios (3 tokens) ─────────────────────────────────────────
const RADIOS = [
  ['border-radius: 7px;', 'border-radius: var(--radio-xs);'],
  ['border-radius: 8px;', 'border-radius: var(--radio-xs);'],
  ['border-radius: 9px;', 'border-radius: var(--radio-sm);'],
  ['border-radius: 10px;', 'border-radius: var(--radio-sm);'],
  ['border-radius: 6px;', 'border-radius: var(--radio-xs);'],
];

// ── 4. Duraciones y foco ─────────────────────────────────────────
const MOVIMIENTO = [
  ['transition: transform 0.14s, box-shadow 0.2s, filter 0.15s;', 'transition: transform var(--dur-1), box-shadow var(--dur-2), filter var(--dur-1);'],
  ['transition: transform 0.15s, box-shadow 0.25s, filter 0.15s;', 'transition: transform var(--dur-1), box-shadow var(--dur-2), filter var(--dur-1);'],
  ['transition: transform 0.18s, border-color 0.18s, box-shadow 0.18s;', 'transition: transform var(--dur-2), border-color var(--dur-2), box-shadow var(--dur-2);'],
  ['transition: border-color 0.15s, background 0.15s, color 0.15s;', 'transition: border-color var(--dur-2), background var(--dur-2), color var(--dur-2);'],
  ['transition: color 0.15s, background 0.15s, border-color 0.15s;', 'transition: color var(--dur-2), background var(--dur-2), border-color var(--dur-2);'],
  ['transition: border-color 0.15s, color 0.15s, background 0.15s;', 'transition: border-color var(--dur-2), color var(--dur-2), background var(--dur-2);'],
  ['transition: border-color 0.18s;', 'transition: border-color var(--dur-2);'],
  ['transition: border-color 0.15s;', 'transition: border-color var(--dur-2);'],
  ['transition: color 0.15s;', 'transition: color var(--dur-2);'],
  ['transition: transform 0.15s;', 'transition: transform var(--dur-1);'],
  ['transition: filter 0.15s, background 0.15s;', 'transition: filter var(--dur-1), background var(--dur-1);'],
  ['box-shadow: 0 0 0 3px rgba(193, 79, 36, 0.12);', 'box-shadow: var(--foco);'],
  ['outline: 2px solid var(--acento); outline-offset: 1px;', 'outline: 2px solid var(--acento); outline-offset: 1px;'],
];

const TABLAS = [
  ['TIPOGRAFÍA', TIPOGRAFIA],
  ['ESPACIADO', ESPACIADO],
  ['RADIOS', RADIOS],
  ['MOVIMIENTO/FOCO', MOVIMIENTO],
];

mkdirSync('docs/evidencia/fase-2', { recursive: true });
const tabla = [];

let reemplazos = 0;
for (const [nombre, tablaMapeo] of TABLAS) {
  tabla.push(`\n## ${nombre}\nvalor antiguo → token nuevo · reemplazos`);
  for (const [viejo, nuevo] of tablaMapeo) {
    const n = css.split(viejo).length - 1;
    css = css.split(viejo).join(nuevo);
    tabla.push(`${viejo} → ${nuevo} · ${n}`);
    reemplazos += n;
  }
}

writeFileSync(RUTA, css, 'utf8');
writeFileSync('docs/evidencia/fase-2/tabla-correspondencia.txt',
  '# Tabla de correspondencia FASE 2 (tokens aplicados a estilos.css)\n' +
  tabla.join('\n') + `\n\nTOTAL reemplazos: ${reemplazos}\n`, 'utf8');
console.log(`✓ Tokens aplicados: ${reemplazos} reemplazos. Tabla: docs/evidencia/fase-2/tabla-correspondencia.txt`);
