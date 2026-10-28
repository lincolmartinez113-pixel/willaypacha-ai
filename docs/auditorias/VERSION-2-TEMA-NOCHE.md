# Versión 2 visual — tema «Noche andina» · WillayPacha AI

**Fecha:** 24 de octubre de 2026 · **Encargo:** «genera la versión dos con la mejor etapa, no
quiero ver el mismo diseño». Se entrega un **segundo diseño completo, vivo y seleccionable**, sin
fork del producto ni datos nuevos.

## 1. Qué es la versión 2

Un **tema alternativo real** («Noche andina») construido sobre el mismo sistema de tokens de la
FASE 1/2: fondo tinta azulada, acento oro, **titulares en sans** (Instrument Sans) en lugar de la
serif editorial, mapa oscuro y texturas nocturnas. Se alterna con el tema original («Papel») desde
la cabecera; la elección persiste entre visitas.

- **Selector:** botón luna/sol en la cabecera (`aria-label` «Cambiar al tema…»), etiqueta visible en
  pantallas ≥1440 px, icono solo por debajo.
- **Persistencia:** `localStorage['wp-tema']` (papel | noche) y atributo `data-tema` en `<html>`.
- **Mismo producto:** los dos temas comparten módulos, datos, verificador y textos legales.

## 2. Cómo está construido (sin duplicar el producto)

- **Override de tokens** `[data-tema='noche']` en `estilos.css`: 27 variables (superficies, texto
  AA, acento oro, semáforo recalibrado, sombras, foco, paleta de mapa y textura). Nada de CSS
  duplicado por componente.
- **Tipografía:** el tema noche redefine `--display` a Instrument Sans con tracking −0.03em: los
  titulares cambian de familia sin tocar componentes.
- **Textura:** `body::after` ahora consume `var(--textura)`; cada tema define la suya (contornos
  andinos en terracota / en azul pálido).
- **Mapa:** `tilesDelTema()` elige CARTO Voyager (papel) o CARTO dark (noche); la paleta de
  marcadores tiene versión propia por tema. El mapa se reconstruye al cambiar tema.
- **Impresión:** bajo `@media print` los tokens vuelven siempre a papel (los documentos impresos no
  heredan el tema oscuro).

## 3. Diferencias visibles frente al diseño original

| Pieza | Papel (v1) | Noche andina (v2) |
|---|---|---|
| Fondo | crema cálido | tinta azul profunda |
| Titulares | Fraunces serif editorial | Instrument Sans, tenso, corporativo |
| Acento | terracota | oro cálido |
| Portada | velo cálido | velo nocturno + degradado crema→oro |
| Mapa | teselas claras Voyager | teselas oscuras CARTO dark |
| Chips/semáforo | velos claros | velos oscuros con texto recalibrado |

## 4. Verificación real (ejecución nueva)

- **Contraste del tema noche:** 8/8 pares **AA** (texto 15,83 · texto-2 10,18 · texto-3 6,92 ·
  texto-4 5,33 · acento 8,27 · rojo 5,93 · ámbar 8,28 · verde 8,61) — medido con la fórmula WCAG.
- **Persistencia:** recarga con `data-tema=noche` ✓; tras pulsar «Papel» → `data-tema=papel` y
  `localStorage=papel` ✓.
- **Teselas:** el mapa del tema noche carga `dark_all` ✓.
- **Desbordes:** escritorio 1280/1280 ✓ · móvil 390/390 ✓ (noche) · matriz completa 320–1440 ✓.
- **Excepciones JS:** 0.
- **Pruebas y build:** `npm test` 57/57 · build ✓ · visual 13 ✓ (tema papel) ·
  `build:standalone` 4,67 MB.
- **Evidencia:** `docs/evidencia/tema-noche/{radar-noche, rimay-noche, denunciar-noche,
  movil-radar-noche}.png` + `verificacion.txt` · script reproducible `tools/verificar-tema.mjs`.

## 5. Archivos

`contextoTema.tsx` (nuevo) · `main.tsx` (proveedor) · `Cabecera.tsx` (selector + chip compacto) ·
`estilos.css` (bloque noche + textura por token + cabecera compacta) · `tema.ts` (paleta de mapa y
teselas por tema) · `Radar.tsx` (mapa dependiente del tema) · `Icono.tsx` (sol/luna) ·
`tools/verificar-tema.mjs` (nuevo).

## 6. Límites y pendientes

- WCAG 2.2 AA completa (lectores de pantalla) sigue pendiente; aquí se midió contraste de tokens,
  foco y estructura, no conformidad plena.
- Verificación en Chromium; Safari/Firefox no probados.
- La impresión del tema noche se resolvió por tokens (fuerza papel); no se adjunta captura impresa.
- Los dos temas comparten datos y funciones: no hay divergencia funcional que auditar por separado.

## 7. Cómo verlo

Abrir la aplicación → botón **luna** en la cabecera (o `localStorage['wp-tema']='noche'`). El tema
se conserva al navegar entre módulos.
