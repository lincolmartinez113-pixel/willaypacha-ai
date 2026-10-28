# FASE 2 — Implementación del sistema de diseño · WillayPacha AI

**Fecha:** 21 de octubre de 2026 · **Autorización:** exclusivamente FASE 2 (sin FASE 3/4).
**Cierre:** este informe se entrega y **se detiene**; FASE 3 requiere autorización explícita.

## 1. Resumen ejecutivo

Se implementó el sistema de diseño aprobado en `FASE-1-SISTEMA-DISENO.md` en cinco incrementos
verificables: (1) tokens de tipografía, espaciado, radios, movimiento, foco y capas aplicados con
tabla de correspondencia explícita (**157 reemplazos documentados**); (2) los 17 colores fuera de
tokens migrados a un puente único (`src/tema.ts`), incluida la **lámina exportable**, que pasó de la
paleta oscura anterior a la identidad cálida y se verificó de punta a punta generando el PNG;
(3) estados de carga reales en la cabecera (esqueleto mientras consulta `/api/salud`) y en Rimay
(bloque de «procesando» con `role="status"`); (4) CSS muerto eliminado (6 reglas `.autoridad*`,
0 usos verificados) y teselas del mapa con `alt=""` (I-02); (5) corrección del par AA `--texto-4`
(3,14 → **4,95**) y de la disposición de Rimay que desbordaba a 320/390 px (estilo inline que
anulaba la media query). La matriz responsive completa (5 anchos × 7 vistas = 35 comprobaciones)
queda **sin desbordes ni excepciones**.

## 2. Estado inicial y final del repositorio

- **Inicial:** rama `main`, HEAD `843d9cb` (el punto de partida `4558c18` reportado en FASE 0/1
  existe y es su padre; encima quedó el commit del informe FASE 1 — cambio documentado, no
  sobrescrito). Árbol limpio al iniciar; FASE-0 y FASE-1 presentes.
- **Final:** HEAD tras el commit de esta fase; árbol limpio salvo evidencias nuevas, que se
  versionan. Artefacto de ejecución `server/data/documentos/DOC-0001-borrador.pdf` (comprometido
  por error en un commit anterior) se retira del control de versiones y `server/data/` completo
  pasa a `.gitignore` (higiene, sin efecto en producto).

## 3. Cambios por incremento

| Incr. | Contenido | Archivos |
|---|---|---|
| 1 | Tokens: 6 roles tipográficos, escala --e-1…--e-7, radios (xs 7→8 px), duraciones 120/200/300/450 ms + curva, foco, capas, paleta de mapa | `estilos.css` (:root) |
| 2 | Aplicación con tabla: 157 reemplazos (tipografía 34 mapeos, espaciado 43, radios 5, movimiento/foco 13… ver tabla) | `estilos.css` + `docs/evidencia/fase-2/tabla-correspondencia.txt` |
| 3 | Colores: 17 hex → tokens; lámina exportable regenerada con identidad cálida | `tema.ts` (nuevo), `Evidencia.tsx`, `Documentos.tsx`, `Radar.tsx`, `estilos.css` (--mapa-*, --texto-4) |
| 4 | Estados: esqueleto de salud en cabecera; «procesando» con `role="status"` en Rimay | `App.tsx`, `Cabecera.tsx`, `Rimay.tsx` |
| 5 | Limpieza y accesibilidad: 6 reglas muertas fuera; `alt=""` en teselas (evento `tileload`); disposición de Rimay sin estilo inline | `estilos.css`, `Radar.tsx` |

## 4. Tabla de correspondencia de tokens

Completa y generada por el propio script: `docs/evidencia/fase-2/tabla-correspondencia.txt`
(cada valor antiguo → token nuevo, con número de reemplazos). Casos conservados declarados:
`0.84em` y `2.6em` (relativos), tamaños del canvas vía `token()`, SVG de marca (activo de marca).

## 5. Archivos modificados y justificación

`estilos.css` (tokens + mapeo + limpieza) · `tema.ts` (nuevo: puente tokens↔canvas/Leaflet) ·
`Evidencia.tsx` (lámina con tokens) · `Documentos.tsx` (color → token; aria-label ya de FASE 0) ·
`Radar.tsx` (paleta de mapa por tokens; popups con var(); retroalimentación con tokens; alt de
teselas) · `Rimay.tsx` (estado procesando; disposición sin inline) · `Cabecera.tsx`/`App.tsx`
(estado de salud con esqueleto) · `Casos.tsx` (aria-label) · `.gitignore` (higiene) ·
`tools/fase-2-aplicar-tokens.mjs`, `tools/verificar-responsive.mjs`, `tools/verificar-lamina.mjs`
(verificación reproducible) · capturas regeneradas.

## 6. Diff resumido y riesgos residuales

~157 reemplazos en CSS + 6 archivos TSX con cambios acotados + 3 herramientas nuevas.
**Riesgos residuales:** (1) el mapeo de paddings quedó **pendiente** (solo se aplicó tipografía,
gap, radios y movimiento): los 41 paddings se consolidan en FASE 4 por riesgo de densidad; (2) el
peso del archivo único (7,89 MB) sigue pendiente para FASE 5; (3) contraste de combinaciones no
listadas en §10 se re-evalúa en FASE 4.

## 7. Resultados reales de pruebas y build

- `npm test` **57/57** · `verificar-datos` ✓ (8 registros; LMP exacto).
- `npm run build` ✓ 0,3 s · `npm run build:standalone` ✓ 0,6 s.
- `test:visual` ✓ 8 capturas (7 vistas + hoja de ruta) · **0 excepciones JS**.
- Matriz responsive **35/35 sin desbordes** (320/390/768/1024/1440 × 7 vistas) → `responsive.txt`.
- Lámina exportable: PNG generado (46 KB) y verificado → `lamina-exportada.png`.

## 8. Matriz responsive por vista y tamaño

5 anchos × 7 vistas: **todas ✓ sin desborde ni excepciones** (después de corregir Rimay).
Evidencia completa: `docs/evidencia/fase-2/responsive.txt`.

## 9. Capturas comparativas

Antes: `docs/evidencia/fase-2/antes/` (8). Después: `docs/evidencia/fase-2/después/` (8).
Adicionales: `lamina-exportada.png` (lámina con la nueva paleta).

## 10. Verificación de accesibilidad y contraste efectuada

Contraste medido (fórmula WCAG) de 10 pares token: todos AA; **--texto-4 corregido** de 3,14 →
**4,95** sobre panel y 4,51 sobre fondo. Foco: token `--foco` homogéneo (input/select/textarea).
Teclado: plegables/pestañas nativos; orden DOM sin cambios. **Pendiente:** evaluación AA completa
con lectores de pantalla (FASE 4, no simulada).

## 11. Resultado de la lámina exportable

Generada de punta a punta con la foto-fixture EXIF (Playwright): PNG de 46 KB con paleta cálida
(panel crema, título terracota, hash en mono, leyenda ámbar). Evidencia:
`docs/evidencia/fase-2/lamina-exportada.png` + `lamina-verificacion.txt`.
Nota honesta: la fixture es una imagen uniforme y el área anómala midió **0,0 %** — el
comportamiento correcto del algoritmo ante una imagen sin variación.

## 12. Incidencias pendientes y limitaciones

- Consolidación de **paddings** (FASE 4) · `srcset`/peso (FASE 5) · AA completa + lectores
  (FASE 4) · Lighthouse no disponible en este entorno (registrado, no simulado) · Safari/Firefox
  no probados · audio real no probado con hardware.

## 13. Criterios de aceptación (FASE 1 §12): estado

1. Pruebas 57/57 + datos ✓ · 2. Sin desbordes 5 anchos × 7 vistas ✓ · 3. Hex fuera de tokens: de
17 → **6** (fallbacks de `token()` + SVG de marca) ✓ parcial-verificado · 4. Tabla aplicada:
tipografía/gap/radios/duraciones ✓, **paddings pendiente (FASE 4)** · 5. CSS muerto eliminado ✓ ·
6. Estados de salud/procesando ✓ · 7. reduced-motion: 8 reglas intactas ✓ · 8. Lámina cálida
verificada ✓ · 9. Sin cambios de API/textos normativos ✓ · 10. Este informe ✓.
