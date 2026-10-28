# Etapa «Liquid Glass» — vidrio, aurora y luz viva · WillayPacha AI

**Fecha:** 26 de octubre de 2026 · **Encargo:** nueva etapa de diseño con más animaciones,
transiciones y acabado tipo «liquid glass», sin salir del principio: datos reales, fuentes citadas,
accesibilidad y rendimiento medidos.

## 1. Qué se añadió

### A. Vidrio esmerilado (glassmorphism) sobre el sistema existente
- Nuevos tokens de vidrio por tema: `--vidrio-fondo`, `--vidrio-borde`, `--vidrio-brillo`,
  `--vidrio-sombra` (papel: vidrio lechoso; noche: vidrio ahumado).
- Aplicado a **placas, fichas y tarjetas** con `backdrop-filter: blur(10px) saturate(1.06)`,
  **halo interior superior** (`inset 0 1px 0`) y borde especular que se enciende en hover.
- **Cabecera** con vidrio más profundo (blur 16px) en ambos temas.
- Chips de la portada (metadatos y crédito) con micro-vidrio (blur 8px).

### B. Aurora líquida (fondo vivo)
- Tres orbes de luz (`--aurora-a/b/c`) con desenfoque de 70px y **deriva lenta** (34 s / 44 s /
  52 s, alternancia) — ámbar, azul y terracota en papel; oro y azul en noche.
- **Se desactiva por completo con `prefers-reduced-motion`** (verificado: `display: none`).
- No intercepta clics (`pointer-events: none`) ni cubre contenido (z-index −1).

### C. Luz viva y microinteracciones
- **Resplandor que sigue al puntero** en tarjetas (`--mx/--my` vía listener pasivo delegado; CSS
  radial con 0,55 de opacidad al hover).
- **Barrido de luz** en botones al hover (300 ms, una pasada; desactivado con reduce).
- Elevación de tarjeta 2 px al hover; borde especular activo.
- Se conservan las transiciones ya validadas (panel-in, detalles, hoja de ruta, página).

### D. Coherencia y seguridad visual
- Todo se apoya en los **mismos tokens** y en ambos temas; no se duplican componentes.
- **Impresión**: sin aurora y sin blur; fondos blancos (los documentos siguen saliendo en papel).
- Ninguna animación oculta contenido ni retrasa una acción; ninguno de los bucles nuevos supera
  capas decorativas sin información.

## 2. Verificación real (ejecución nueva)

| Comprobación | Resultado |
|---|---|
| `npm test` | **57/57**, exit 0 |
| `npm run build` / `build:standalone` | ✓ · **4,67 MB** |
| `npm run test:visual` | exit 0 · 13 ✓ · 0 excepciones JS |
| `node tools/verificar-responsive.mjs` | **35/35** sin desbordes (320–1440) |
| `node tools/verificar-tema.mjs` | contraste noche **8/8 AA** · persistencia ✓ · teselas `dark_all` ✓ · sin desbordes 1280/390 ✓ · 0 excepciones |
| `prefers-reduced-motion` | **aurora `display:none`** · **barrido de botón `display:none`** (medido en Chromium) |

## 3. Evidencia

- `docs/evidencia/liquid/{01-radar, 02-rimay, 06-denunciar, 04-standalone}.png` (tema papel).
- `docs/evidencia/tema-noche/{radar, rimay, denunciar, movil-radar}-noche.png` + `verificacion.txt`
  (tema noche, con aurora visible).

## 4. Archivos

`apps/web/src/App.tsx` (aurora + listener de luz) · `apps/web/src/estilos.css` (bloque Liquid
Glass: tokens de vidrio, aurora, resplandor, barrido, impresión y reduce) ·
`tools/verificar-tema.mjs` (verificación reutilizada).

## 5. Límites y pendientes

- El desenfoque de fondo (`backdrop-filter`) se limita a placas/tarjetas/cabecera; en equipos muy
  modestos puede costar GPU. Es estático por superficie y se desactiva en impresión.
- Verificación solo en Chromium; Safari/Firefox pendientes (Safari soporta `backdrop-filter`, pero
  no se declara compatibilidad sin prueba).
- AA completa con lectores de pantalla y Lighthouse siguen pendientes (no se declaran).
- Las cifras y textos siguen siendo los reales del proyecto: la etapa es exclusivamente visual.
