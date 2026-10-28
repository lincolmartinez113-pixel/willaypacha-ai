# Portada informativa — iteración de nivel editorial · WillayPacha AI

**Fecha:** 22 de octubre de 2026 · **Encargo:** portada informativa al nivel de la referencia
adjunta (poster de estudio creativo), con la temática del proyecto, sin salir de las
especificaciones y con la honestidad como regla.

## 1. Lectura del referente (analizado, no copiado)

La imagen de referencia es un poster que contiene un mockup de hero: foto a sangre con grano de
película, titular display gigante **superpuesto a la imagen** con degradado (crema→azul / salmón),
barra de metadatos en mayúsculas y micro-tipografía, tarjeta redondeada y lista de servicios a la
derecha. Se tomó el **principio** (jerarquía editorial + imagen cinematográfica + tipografía
superpuesta), no el contenido ni la estética ajena.

## 2. Traducción a WillayPacha AI

Se reemplazó la cabecera anterior del Radar (intro + banda de foto) por una **portada única**:

- **Foto real a sangre** (amanecer en el Titicaca, Diego Delso · CC BY-SA 4.0) con **crédito
  visible** en la esquina — la regla de procedencia también aplica a la portada.
- **Titular editorial superpuesto**: «El territorio» (degradado crema→oro) + «habla.» (salmón),
  Fraunces a `clamp(2.6rem, 6.4vw, 5.2rem)`, dentro de la foto y sobre el velo oscuro.
- **Barra de metadatos** (OCT 2026 · PUNO — JUNÍN / MONITOREO AMBIENTAL COMUNITARIO / FUENTE ·
  FECHA · CITA) y **grano de película** sutil (SVG turbulence) para textura editorial.
- **Chakana trazada** como marca de agua del territorio.
- **Cifras reales** en franja: 2 unidades verificadas · 8 registros con fuente y cita · 4 lenguas ·
  100 % citado — todas derivadas de `datos-semilla.json` y del verificador de datos.
- **Columna de soluciones** (equivalente a la lista de servicios): Pregunta a Rimay · Contrasta lo
  oficial · Documenta con huella · Prepara tus papeles · Denuncia bien.
- **Acciones directas**: Preguntar en mi lengua → /rimay · Cómo denunciar → /denunciar · Bajar al
  radar → #tabla-contraste. Se mantiene la frase «Lo que dice la fuente oficial vs. lo que vive la
  comunidad» como subtítulo (continuidad de producto y de pruebas).

## 3. Honestidad aplicada

- No se añadieron cifras: las cuatro de la franja se calculan del seed (y el 100 % lo comprueba
  `tools/verificar-datos.mjs`).
- El crédito fotográfico es visible en la propia portada, no solo en /creditos.
- La metabar es **decorativa** (`aria-hidden`): la información esencial (unidades, registros,
  regla del sistema) está en texto accesible.
- No se presenta la anomalía visual como contaminación ni se alteró ningún texto normativo.

## 4. Cambios técnicos

- `apps/web/src/estilos.css`: bloque `.portada*` completo (foto 21/9 → 16/10 → 4/5, velo, grano,
  meta, titular superpuesto, stats, cuerpo en dos columnas, lista, responsive y reduced-motion) y
  **eliminación de CSS muerto verificado**: `.hero-foto*`, `.stats`, `.stat-num`, `.stat-rotulo`,
  `.stats-regla`, `.credito-vivo` (0 usos tras el cambio, comprobado con grep).
- `apps/web/src/paginas/Radar.tsx`: sustitución del bloque intro+ficha+hero-foto por la portada;
  el titular vive dentro de la foto; import de `Chakana`.
- Sin cambios de API, datos, tokens ni dependencias.

## 5. Verificación real (ejecución nueva)

- `npm test` → **57/57**, exit 0 · `npm run build` → 0,28 s · `build:standalone` → 7,9 MB.
- `npm run test:visual` → exit 0 (8 capturas + `file://`, cero excepciones).
- `node tools/verificar-responsive.mjs` → **35/35 sin desbordes ni excepciones**.
- Móvil 390×844: `scrollWidth 390 = viewport 390` (sin desborde), captura revisada.
- CSS muerto restante: **0 coincidencias** de las clases retiradas.

## 6. Evidencia

- Antes: `docs/evidencia/portada/antes/01-radar.png`
- Después (escritorio): `docs/evidencia/portada/después/01-radar.png`
- Móvil: `docs/evidencia/portada/movil-radar.png`

## 7. Limitaciones y pendientes

- Verificación solo en Chromium; Safari/Firefox sin probar.
- WCAG 2.2 AA completa y Lighthouse siguen pendientes (fases posteriores del protocolo).
- En anchos intermedios la franja de cifras puede ocupar dos líneas (aceptado; sin desborde).
- El recorte 21/9 en pantallas ultra anchas recorta cielo/agua; el sujeto (horizonte) se conserva.

## 8. Dictamen

Portada implementada y verificada: nivel editorial solicitado, identidad intacta, datos reales con
cita y crédito visible. Apto. Sin cambios fuera del alcance.

---

*Disciplinas aplicadas del catálogo: `design-core-rules`, `frontend-design`, `craft-anti-ai-slop`,
`craft-typography`, `craft-animation-discipline`, `design-taste` (lectura del referente y auditoría
anti-plantilla).*
