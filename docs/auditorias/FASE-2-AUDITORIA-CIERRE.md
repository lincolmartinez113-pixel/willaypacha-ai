# FASE 2 — Auditoría de cierre · WillayPacha AI

**Fecha:** 21 de octubre de 2026 · **Alcance:** verificación independiente de la FASE 2, sin
modificar producto, estilos, dependencias ni funcionalidades. **Sin iniciar FASE 3.**

---

## 1. Estado del repositorio y commits

- Rama **`main`** · HEAD **`853f8a9`** · árbol limpio al iniciar la auditoría (sin archivos no
  versionados ni cambios pendientes).
- Secuencia verificada: `4558c18` (FASE 0) → `843d9cb` (FASE 1) → `853f8a9` (FASE 2).
- El diff de `853f8a9` coincide con lo descrito: 9 archivos de producto + `tema.ts` nuevo +
  `FASE-2-IMPLEMENTACION.md` + evidencias (antes/después, lámina, responsive, tabla) + 3
  herramientas de verificación + `.gitignore`; retirada del seguimiento de
  `server/data/documentos/DOC-0001-borrador.pdf`.
- **Nota de reproducción:** al re-ejecutar las verificaciones, dos archivos de evidencia
  (`lamina-exportada.png`, `lamina-verificacion.txt`) se regeneraron con marcas de tiempo nuevas
  (bytes casi idénticos). Se versionan junto con este informe; **ningún archivo de producto cambió
  durante la auditoría.**

## 2. Matriz de comandos y resultados reproducidos (ejecución nueva, no histórica)

| # | Comando exacto | Exit | Resultado observado |
|---|---|---|---|
| 1 | `node tools/verificar-datos.mjs` | 0 | 8 registros con fuente/fecha/cita; LMP dígito a dígito; territorio aimara vacío; glosario con estado |
| 2 | `npm test` | 0 | `tests 57 · pass 57 · fail 0` |
| 3 | `npm run build` | 0 | `✓ built` (≈0,34 s) sin errores de tipos |
| 4 | `npm run build:standalone` | 0 | `✓ built` (≈0,70 s) archivo único |
| 5 | `npm run test:visual` | 0 | 13 comprobaciones ✓ (8 capturas: 7 vistas + hoja de ruta + `file://`); **0 excepciones JS** |
| 6 | `node tools/verificar-responsive.mjs` | 0 | «sin desbordes ni excepciones en toda la matriz» (5 anchos × 7 vistas) |
| 7 | `node tools/verificar-lamina.mjs` | 0 | PNG exportado (46 KB) con flujo completo: carga EXIF → delimitación → descarga |
| 8 | Contraste (script WCAG reproducido) | — | 10 pares medidos: **10/10 AA** |
| 9 | `prefers-reduced-motion` en Chromium (`reducedMotion:'reduce'`) | — | `.surge` → `animation-name: none`; `.revelar` → `opacity: 1`; cinta → `none` |

**Limitaciones registradas:** el primer `exit=-1` observado en `npm test` fue un artefacto del
pipe de PowerShell (`Select-String`), no del comando; la repetición con captura correcta dio `exit=0`
y 57/57. Lighthouse/Core Web Vitals **no disponibles** en este entorno (no se simulan). Las teselas
del mapa dependen de red externa: la medición de `alt` en runtime solo es fiable con teselas
cargadas; la comprobación realizada es de código (§5).

## 3. Correspondencia entre el informe y el código real

| Afirmación del informe | Verificación | Dictamen |
|---|---|---|
| «157 reemplazos» con tabla | `tabla-correspondencia.txt` → `TOTAL 157`; CSS actual: 78 usos `var(--t-*)` y 60 `var(--e-*)` (+ radios/duraciones/foco) | **Verificado** |
| «17 hex migrados; quedan 6» | Real: **19 líneas con hex** (7 fallbacks `token()` en `Evidencia.tsx`; 6 del SVG de marca en `Cabecera.tsx`; 6 fallbacks en `tema.ts`). **La cifra «6» del informe era inexacta** | **Corregido en esta auditoría** (§4) |
| «CSS muerto .autoridad* eliminado (6 reglas)» | `estilos.css`: solo queda el comentario de retirada; 0 selectores | **Verificado** |
| «Estados: esqueleto de salud y procesando en Rimay» | `App.tsx:20,25,37` (`cargandoSalud`), `Cabecera.tsx:43,70-71` (`aria-busy`), `Rimay.tsx:160` (`role="status" aria-live="polite"`) | **Verificado** |
| «Teselas con alt (I-02)» | `Radar.tsx:43-45`: evento `tileload` → `setAttribute('alt','')` | **Verificado en código** (medición runtime limitada por red) |
| «Desborde de Rimay corregido» | Matriz responsive 35/35 sin desbordes | **Verificado** |
| «Lámina con paleta cálida» | PNG regenerado y revisado: fondo panel, título terracota, leyenda ámbar; motor declarado; 0,0 % en fixture uniforme (correcto) | **Verificado** |

## 4. Revisión de los colores hexadecimales restantes (enumeración completa)

Ninguno se usa como color de renderizado directo fuera de su propósito:

| Archivo:línea | Valor | Finalidad | Justificación |
|---|---|---|---|
| `Evidencia.tsx:108,110,113,129,132,135,138` | `#fffaf1`, `#c14f24`, `#5d4834`, `#2b1c10`, `#7f6a52`, `#b97a06`, `#82694d` | **Fallbacks** del 2.º argumento de `token('--x', fallback)` para el canvas de la lámina | El valor real llega del token CSS; el fallback evita `undefined` si el token no existiera. Duplicación controlada y documentada |
| `Cabecera.tsx:27,28,32,36,37,38` | `#fff3df`, `#f0dcc0`, `#c14f24`, `#a87518`, `#2e8f5a` | **Activo de marca**: degradado del logotipo y sus tres puntos (semáforo) | El SVG de marca es un recurso gráfico; sus colores son la identidad del logotipo, no estilos de interfaz. Centralizarlos en tokens no aporta y complica el activo |
| `tema.ts:4,21-25` | `#000000` (default) y `#2f5f8f`, `#9c3f66`, `#b97a06`, `#3d7ea6`, `#5d4834` | **Fallbacks** de `token()` para los marcadores de Leaflet | Mismo patrón que Evidencia; los valores efectivos provienen de `--mapa-*` |

**Colores semánticos:** el semáforo conserva sus tokens (`--rojo/--ambar/--verde` + velos) y su
etiqueta textual; el rojo/verde de retroalimentación de formularios se migró a `var(--rojo)` /
`var(--verde)` (Radar). La distinción oficial/comunitario no se tocó.

## 5. Contraste y accesibilidad comprobados

- **Contraste reproducido** (fórmula WCAG, ejecución nueva): texto/panel 15,82 · texto-2 8,27 ·
  texto-3 4,94 (panel) y 4,50 (fondo) · **texto-4 4,95/4,51** (corregido en FASE 2; antes 3,14) ·
  acento-intenso 5,96 · rojo 6,57 · ámbar 5,17 · verde 6,08 — **10/10 AA**.
- **Movimiento reducido reproducido en Chromium** con `reducedMotion:'reduce'`: sin animación en
  entrada, revelado visible con opacidad 1, cinta detenida. Las 8 reglas `prefers-reduced-motion`
  siguen presentes en el CSS.
- **Roles y anuncios:** Rimay anuncia el procesamiento con `role="status"` + `aria-live="polite"`
  y esqueleto no anunciado como contenido; la cabecera usa `aria-busy` + `role="status"` mientras
  consulta `/api/salud`, y cae a «sin backend» cuando la respuesta es nula (error de red incluido).
- **Teselas:** se marcan `alt=""` (decorativas/repetitivas); la información relevante del mapa vive
  en popups con texto y en la tabla de contraste (alternativa accesible existente). **Pendiente:**
  un resumen textual del mapa por unidad (propuesta para FASE 4).
- **No realizado / no reproducible aquí:** evaluación AA completa con lector de pantalla, auditoría
  de teclado exhaustiva y Lighthouse. Registrado como pendiente, sin declarar conformidad.

## 6. Revisión de `server/data/` y `.gitignore`

- `.gitignore` pasa de tres exclusiones puntuales a `server/data/` completo (línea 12; verificado
  con `git check-ignore -v`).
- Contenido actual tras las pruebas: `db.json` y `documentos/DOC-0001-borrador.pdf` — **regenerados
  por la propia reproducción de las pruebas**, lo que demuestra que son **artefactos de ejecución**
  y no recursos del producto ni de las pruebas (las pruebas crean su propio estado y lo limpian).
- La retirada fue **de seguimiento, no física** (el archivo existe en disco); el producto arranca
  sin esos archivos (crea directorios al vuelo) y las pruebas no los requieren.
- Sin secretos ni datos personales en los archivos revisados (db.json contiene únicamente los
  registros creados por las pruebas).

## 7. Incidencias, riesgos y pruebas pendientes

| ID | Tipo | Descripción | Impacto |
|---|---|---|---|
| A-01 | Incidencia documental | El informe FASE 2 decía «quedan 6 hex»; el recuento real es 19 líneas, todas con justificación (fallbacks y marca) | Bajo: el estado técnico es correcto; corregido en §4 |
| A-02 | Pendiente declarado | Consolidación de paddings (41 valores) | Diferido a FASE 4 |
| A-03 | Pendiente declarado | AA completa (lector de pantalla, teclado exhaustivo) y Lighthouse | FASE 4/5 |
| A-04 | Limitación | Medición runtime de `alt` en teselas depende de red externa | Comprobación de código realizada |
| A-05 | Riesgo residual | Evidencias regeneradas por la auditoría (2 archivos, solo docs) | Se versionan con este informe |

## 8. Dictamen por criterio

| Criterio | Dictamen |
|---|---|
| Estado del repositorio y commits | **Verificado** |
| Reproducción de pruebas, datos, builds y verificadores (1–7) | **Verificado** (todos exit 0, ejecución nueva) |
| Correspondencia informe ↔ código | **Parcialmente verificado** (una cifra inexacta, corregida en §4; resto correcto) |
| Migración de colores y semántica | **Verificado** (con excepciones justificadas) |
| CSS muerto | **Verificado** |
| Estados de carga/procesamiento | **Verificado** (código + prueba visual) |
| Contraste | **Verificado** (10/10 AA reproducido) |
| `prefers-reduced-motion` | **Verificado** (Chromium real) |
| Lámina exportable | **Verificado** (flujo completo + PNG revisado) |
| Higiene de `server/data` | **Verificado** |
| Accesibilidad AA completa | **No reproducido** (pendiente FASE 4, declarado) |
| Paddings consolidados | **Fallido por diseño** (diferido; declarado en el informe) |

## 9. Recomendación sobre la preparación para FASE 3

**Recomendación: apto para FASE 3 con condiciones.** La base está verificada de forma independiente
(9 reproducciones, 0 fallos reales; una inexactitud documental corregida). Condiciones:

1. FASE 3 debe **reutilizar los tokens existentes** (`--dur-*`, `--curva`) y no introducir nuevas
   dependencias ni animar datos.
2. Mantener las reglas ya verificadas: contenido nunca oculto por animación; `prefers-reduced-motion`
   con cobertura equivalente; nada de bucles decorativos nuevos.
3. Los pendientes A-02/A-03 son de FASE 4/5 y **no bloquean** FASE 3 (movimiento), pero deben
   permanecer visibles en el registro.

**Dictamen global: FASE 2 CERRADA — VERIFICADA CON UNA CORRECCIÓN DOCUMENTAL.**
