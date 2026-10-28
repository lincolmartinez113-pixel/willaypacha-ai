# Iteración «Nivel 2» — cabeceras editoriales, accesibilidad y peso · WillayPacha AI

**Fecha:** 24 de octubre de 2026 · **Encargo:** subir el nivel de toda la página (no solo la
portada) sin salir del principio: nada inventado, todo con fuente, crédito y verificación.

## 1. Qué se cambió (visible y medible)

### A. Cabeceras editoriales en TODAS las vistas
La portada del Radar ya tenía el nivel editorial; el resto de páginas seguían con una cabecera
plana. Ahora `.intro` es una **cabecera editorial común** aplicada a Rimay, Evidencia, Documentos,
Casos, Denunciar, Legal y Créditos:

- **Regla de acento** (56 × 2 px, terracota) sobre el kicker, como en la portada.
- **Titular display mayor**: `clamp(2.2rem, 4.8vw, 3.6rem)` con tracking −0.025em (antes heredaba
  el tamaño base y se veía tímido).
- **Alineación superior** de la rejilla y ancho de línea de entrada limitado a 60ch para lectura.

### B. Accesibilidad (comprobable en código)
- **Enlace «Saltar al contenido»** visible al recibir foco de teclado; `main` con `id="contenido"`.
- **Alternativa textual del mapa** (Radar): `details` con la unidad, sus componentes, tipo y
  coordenadas aproximadas — el contenido del mapa ya no depende solo de ver la imagen.
- **Leyendas de tabla** (`caption.sr-only`) en la tabla de contraste, la tabla LMP, el directorio de
  autoridades y el manifest de créditos.

### C. Peso y rendimiento (medido)
- **Fotografías convertidas a WebP** (calidad 80, máx. 1600 px) con `tools/optimizar-fotos.py`:
  **5,27 MB → 2,84 MB (−46 %)**; los JPG originales se conservan como fuente de la conversión.
- **Archivo único: 7,90 MB → 4,66 MB (−41 %)** — la descarga de doble clic pesa casi la mitad.
- `datos-img.ts` y `creditos.json` migrados a `.webp`; la galería y la portada usan los mismos
  créditos (nada de imágenes sin procedencia).

## 2. Verificación real (ejecutada)

| Comprobación | Resultado |
|---|---|
| `npm test` | **57/57**, exit 0 |
| `npm run build` | ✓ sin errores de tipos |
| `npm run test:visual` | exit 0 · 13 comprobaciones ✓ · **0 excepciones JS** |
| `node tools/verificar-responsive.mjs` | **35/35** sin desbordes (320–1440 px × 7 vistas) |
| `build:standalone` | ✓ · **4,66 MB** (antes 7,90 MB) |
| Móvil 390 px | sin desborde (`scrollWidth = 390`) |

## 3. Evidencia

- `docs/evidencia/portada/v2/01-radar.png` · `02-rimay.png` · `06-denunciar.png` (escritorio, nueva
  cabecera + portada).
- Capturas móvil: `docs/evidencia/portada/movil-radar.png` (iteración anterior, misma estructura).
- Antes/después de la portada: `docs/evidencia/portada/{antes,después}/01-radar.png`.

## 4. Archivos tocados

- `apps/web/src/estilos.css` — `.intro` editorial + `.saltar`; sin cambios de tokens.
- `apps/web/src/App.tsx` — enlace de salto + `id="contenido"`.
- `apps/web/src/paginas/Radar.tsx` — alternativa textual del mapa, captions, galería WebP.
- `apps/web/src/paginas/Denunciar.tsx`, `Creditos.tsx` — captions de tabla.
- `apps/web/src/datos-img.ts`, `src/img/creditos.json` — rutas WebP.
- `tools/optimizar-fotos.py` — conversión reproducible.
- Evidencia nueva en `docs/evidencia/portada/v2/`.

## 5. Lo que NO se tocó (principio intacto)

Datos semilla, textos normativos, verificador P6, flujo de casos/ARCO, advertencias legales,
separación oficial/comunitario, semáforo con etiquetas y crédito fotográfico visible.

## 6. Limitaciones y pendientes

- WCAG 2.2 AA completa (lectores de pantalla) y Lighthouse siguen pendientes (fases posteriores).
- Los JPG originales permanecen en el repositorio como fuente; su retirada del paquete puede hacerse
  en una limpieza posterior (no afecta al bundle: solo se empaqueta lo importado).
- Verificación en Chromium únicamente.
