# Fondo vivo — símbolos andinos con deriva libre y parallax de puntero

**Fecha:** 26 de octubre de 2026 · **Encargo:** que los símbolos del fondo se muevan libremente y
reaccionen al puntero.

## 1. Qué se implementó

- **Capa `FondoSimbolos`** (`componentes/FondoSimbolos.tsx`): dos capas de contornos andinos y dos
  **chakanas** gigantes que:
  - **derivan solas** con animaciones propias (contornos 95 s / 150 s, chakanas girando 240 s y
    320 s en sentido inverso);
  - **responden al puntero** con parallax suave: el puntero fija `--px/--py` (−1…1) mediante un
    `requestAnimationFrame` con suavizado (lerp 0,085), y cada capa aplica un multiplicador distinto
    (contornos 40/30 px; chakanas 64/46 px; la segunda capa va en sentido contrario).
- **La portada acompaña**: la foto inclina ±1° en perspectiva según el puntero (transición 0,35 s).
- **Sin costo de layout**: todo es `transform` (y `will-change`), el listener es pasivo y el bucle
  rAF se cancela al desmontar y al llegar al objetivo.

## 2. Accesibilidad y rendimiento

- Con `prefers-reduced-motion: reduce`: **la capa se oculta por completo** (`display: none`) y se
  detiene el giro de las chakanas — verificado en Chromium.
- La capa es `aria-hidden`, `pointer-events: none` y `z-index: −1`: no intercepta clics ni cubre
  contenido.
- En **impresión** se oculta (documentos siempre en papel).
- No se añadieron dependencias.

## 3. Verificación real (medición en Chromium)

| Comprobación | Resultado |
|---|---|
| Puntero arriba-izquierda | `--px −0.52 · --py −0.40` → capa `(−21, −12) px` · chakana `(−33.6, −18.3) px` |
| Puntero abajo-derecha | `--px −0.24 · --py −0.27` → capa `(−9.6, −8.2) px` · chakana `(−15.4, −12.6) px` |
| Respuesta detectada | **✓** (transformaciones distintas por posición) |
| `prefers-reduced-motion` | `fondo-simbolos: display none` · giro chakana `none` |
| Pruebas | **57/57** |
| Visual | 13 ✓ · 0 excepciones JS |
| Responsive | **35/35** (320–1440) |
| Archivo único | 4,67 MB |

Evidencia: `docs/evidencia/fondo-vivo/fondo-puntero-arriba-izq.png`,
`fondo-puntero-abajo-der.png`, `docs/evidencia/tema-noche/radar-noche.png` (fondo vivo sobre tema
noche).

## 4. Archivos

`apps/web/src/componentes/FondoSimbolos.tsx` (nuevo) · `App.tsx` (montaje) · `estilos.css`
(bloque «Fondo vivo»: capas, derivas, chakanas, parallax de portada, reduce e impresión).

## 5. Límites

- El suavizado del parallax es continuo pero discreto por diseño; en equipos con rAF limitado
  (cabeceras antiguas) el seguimiento será más lento, sin romper nada.
- Verificación solo en Chromium; Safari/Firefox pendientes.
- AA completa con lectores y Lighthouse siguen pendientes (no se declaran).
