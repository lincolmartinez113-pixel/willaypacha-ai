# FASE 1 — Sistema de diseño: auditoría y propuesta · WillayPacha AI

**Fecha:** 21 de octubre de 2026 · **Alcance:** análisis del sistema de diseño existente y
propuesta técnica documentada. **Sin cambios en código de producción** (verificación en §3 y §7).

---

## 1. Resumen ejecutivo

El sistema visual actual es reconocible y funcional (papel crema, tinta café, terracota, semáforo
semántico, Fraunces + Instrument Sans + JetBrains Mono), pero está **documentado en la práctica, no
en tokens**: la inspección midió **40 tamaños de fuente distintos, 26 valores de `gap`, 41 de
`padding` y 13 radios** en un solo archivo de 411 reglas. Existen **reglas CSS muertas** (`.autoridad*`,
heredadas del rediseño del directorio), **colores fuera de tokens** (17 apariciones en TSX, incluida la
lámina exportable, que conserva la paleta oscura anterior), y **cinco breakpoints ad-hoc** (640, 700,
760, 860, 940/980) sin escala formal. La accesibilidad estructural es correcta en lo medible
(0 controles sin nombre; 1 campo sin etiqueta ya corregido en FASE 0; 24 usos de `aria-`), con la
evaluación AA completa aún pendiente. La propuesta (§7–§9) formaliza lo existente en tokens con la
misma identidad —no cambia la estética— y define estados, movimiento y criterios de aceptación
verificables para la FASE 2.

## 2. Alcance y metodología de inspección

- **Solo lectura** sobre el árbol real; ninguna herramienta de medición inventada.
- Fuentes: `apps/web/src/estilos.css` (411 reglas), `apps/web/src/**/*.tsx` (21 archivos),
  `index.html`, `manifest.webmanifest`, `sw.js`, `src/img/creditos.json`, capturas Chromium
  escritorio/móvil/tablet de FASE 0 (`docs/evidencia/`, `docs/evidencia/fase-0/`).
- Comandos de inspección: `git rev-parse/status`, `Select-String` sobre selectores y patrones,
  análisis por expresión regular de `font-size`, `gap`, `padding`, `border-radius` y `z-index`.

## 3. Estado real del repositorio (verificado en esta fase)

- Rama `main` · commit `4558c18` **existe y es HEAD** · árbol de trabajo **limpio**.
- Las cifras de FASE 0 siguen vigentes (57/57 pruebas; pesos JS 558 KB, CSS 57 KB, fuentes 202 KB,
  fotos 5,27 MB, archivo único 7,89 MB). Sin discrepancias.
- **Código de producción intacto durante esta fase** (verificación final en §7).

## 4. Inventario de componentes y estilos existentes (con ruta y línea)

**Tokens (`estilos.css` líneas 8–56):** 29 variables — 5 superficies, 2 bordes, 4 textos, 6 acento,
2 oro, 6 semáforo, 1 azul, 3 tipografías, 3 radios, 2 sombras, 1 ancho. Sin tokens de espaciado,
movimiento, foco ni z-index.

**Secciones CSS (línea de inicio):** animación 103 · estructura 116 · cabecera 120 · chips 155 ·
intro 177 · botones 212 · placas 236 · formularios 277 · semáforo 314 · tablas 331 · citas 348 ·
tarjetas 363 · territorios 375 · fotos/galería 392 · gráficos 419 · mapa 432 · línea de tiempo 453 ·
pasos 469 · pestañas 481 · micrófono 492 · evidencia 537 · estados 550 · bitácora 562 · plegables 568 ·
legal 581 · utilidades 602 · pie 609 · símbolos 669 · guía 685 · hoja de ruta/impresión 731+.

**Componentes React (21 archivos):** Icono (32 trazos), Cabecera (marca + nav de 6 + selector),
Pie, Semaforo (píldora con pulso), TarjetaRegistro, Foto (crédito obligatorio), Graficos (Dona/Barras),
Simbolos (Chakana/CintaTextil), useRevelar (IntersectionObserver + red de seguridad 2,5 s); páginas
Radar/Rimay/Evidencia/Documentos/Casos/Denunciar/Legal/Creditos.

**Tipografía medida:** 40 valores de `font-size` distintos (de 0,6 rem a clamp 3,3 rem), 3 familias
empaquetadas (202 KB), 3 pesos de trabajo (400/550-650/700 esporádico).

**Espaciado/radios medidos:** 26 valores de `gap`, 41 de `padding`, 13 de `border-radius`
(7/8/9/10 px + 16 px + 999 px + 50 % + herencias), sombras 2 niveles, z-index {-2, -1, 1, 60, 500}.

**Breakpoints:** 640, 700, 760, 860, 940, 980 px + `prefers-reduced-motion` (8 reglas) + `print` (1).

**Interacción/accesibilidad medida:** `:focus-visible` global (línea 99); 24 atributos `aria-`;
0 botones/enlaces sin nombre accesible en las 7 vistas; 0 excepciones JS en 3 tamaños; labels
correctos salvo la incidencia I-03 ya corregida (aria-label añadido en Documentos/Casos).

## 5. Auditoría de skills disponibles

| Skill (mecanismo: `skill://nombre`) | Propósito | Aplicabilidad FASE 1–2 | Estado |
|---|---|---|---|
| design-core-rules | Reglas del dominio de diseño | Regir el flujo por fases | **Leída y aplicada** |
| frontend-design | Dirección estética deliberada | Base de la identidad vigente | **Leída y aplicada** |
| craft-anti-ai-slop | Siete pecados visuales | Checklist de esta propuesta | **Leída y aplicada** |
| craft-state-coverage | Cinco estados obligatorios | Matriz de estados (§8) | **Leída y aplicada** |
| craft-animation-discipline | Duraciones/curvas/motion reduced | Tokens de movimiento (§9) | **Leída y aplicada** |
| craft-typography | Escala/tracking/línea | Escala tipográfica (§7) | **Leída y aplicada** |
| design-taste | Anti-defaults, lectura de brief | Lectura parcial (§0–1); completar en FASE 2 si procede | **Leída parcial** |
| craft-color, craft-accessibility-baseline, craft-form-validation, aesthetic-preset-library, saas-landing, web-prototype, dashboard, mobile-app, infinite-canvas-output, html-ppt-pitch-deck | Localizadas en el índice del dominio | Orientadas a entregables HTML de un solo archivo o fases no actuales; **no aplicadas** | No utilizadas (registro, no invención) |

**Limitación:** no existe en el entorno una skill de auditoría automatizada WCAG ni de métricas web;
esa verificación será manual + Chromium en FASE 4/5 (registrado como pendiente, no simulado).
**No se instalaron dependencias** (regla §5.1 del protocolo).

## 6. Diagnóstico de consistencia visual, responsive y accesibilidad

**H — Hechos verificados · P — Propuestas (no implementadas).**

- **H1 · Escala tipográfica informal:** 40 tamaños (p. ej., 0,72/0,73/0,74/0,75/0,76 rem casi
  idénticos). Riesgo de jerarquía difusa. `estilos.css` pasim.
- **H2 · Espaciado sin escala:** 26 gaps y 41 paddings ad-hoc. `estilos.css` pasim.
- **H3 · Radios inconsistentes:** 13 valores (7, 8, 9, 10 px conviven para roles similares).
- **H4 · Colores fuera de tokens (17):** `Evidencia.tsx:107–137` (lámina exportable con la paleta
  **oscura anterior**: fondo #060a10, acento teal #38d9b0 — desalineada de la identidad cálida),
  `Documentos.tsx:240` (#7fdfab), `Radar.tsx:17–21,68` (paleta del mapa con teal y blanco #e9f0f7,
  poco visible sobre teselas claras).
- **H5 · CSS muerto:** `.autoridad`, `.autoridad-cabecera`, `.autoridad .sigla` (estilos.css §guía)
  quedaron sin uso tras convertir el directorio a tabla. Riesgo bajo, limpieza en FASE 2.
- **H6 · Breakpoints ad-hoc:** 6 valores (640/700/760/860/940/980) con lógica por componente.
- **H7 · Desborde móvil del Radar:** corregido en FASE 0 (I-01); `.rejilla > * { min-width: 0 }` es
  la regla que debe conservarse como ley del sistema.
- **H8 · Estados cubiertos:** vacío (`vacio`), carga (`esqueleto`), error (`aviso rojo`), éxito
  (`aviso exito`), offline (chip). Parciales: carga de `/api/salud` en cabecera (parpadeo) y
  «procesando» de Rimay (I-05 de FASE 0).
- **H9 · Accesibilidad:** foco visible global, landmarks correctos, 0 controles sin nombre medidos;
  teselas de mapa sin `alt` (I-02, FASE 4); evaluación AA completa pendiente.
- **H10 · Movimiento:** reglas respetadas (sin opacidad inicial bloqueante; reduced-motion en 8
  bloques); cinta textil 12 s con pausa al hover.
- **H11 · Sin `any`/`@ts-ignore`** en producción (0 coincidencias).

**Preservar (identidad/función):** paleta papel/tinta/terracota; Fraunces para display; semáforo
como lenguaje con texto; crédito fotográfico visible; chakana y cinta textil; placas con esquinas;
franja de borrador impresa; separación oficial/comunitario en todas las vistas.

## 7. Propuesta de tokens y reglas (PARA APROBAR — no implementada)

**P1 · Escala tipográfica (6 roles, de 40 tamaños actuales):**
display `clamp(2.1rem, 4.2vw, 3.3rem)` · h2 `1.62rem` · h3 `1.06rem` · cuerpo `0.9375rem` (15px) ·
pequeña `0.8125rem` (13px) · micro `0.6875rem` (11px, mono con tracking ≥0,06em en mayúsculas).
Los valores intermedios se mapean al rol más cercano (tabla de mapeo 1:1 en FASE 2).

**P2 · Escala de espaciado (4 px):** `--e-1: 4px · --e-2: 8px · --e-3: 12px · --e-4: 16px ·
--e-5: 24px · --e-6: 32px · --e-7: 48px`. Mapeo de los 26 gaps/41 paddings actuales al valor
más cercano (diferencia máxima 2 px; cambio visual imperceptible, diff auditable).

**P3 · Radios (3):** `--radio 16px · --radio-sm 10px · --radio-xs 8px` + `999px` píldoras y `50%`
avatares/puntos. Los 13 valores actuales convergen aquí.

**P4 · Movimiento (tokens):** `--dur-1: 120ms` (hover/pulse-off) · `--dur-2: 200ms` (estado) ·
`--dur-3: 300ms` (entradas) · `--dur-4: 450ms` (cross-view, solo `.pagina-entra` y `.surge`) ·
curva única `cubic-bezier(0.22, 0.9, 0.3, 1)`. Bucle decorativo único permitido: cinta textil
(12 s, pausa al hover, estática con reduced-motion). Se eliminan bucles que no cumplan WCAG 2.2.2.

**P5 · Foco y elevación:** `--foco: 0 0 0 3px rgba(193,79,36,0.18)` homogéneo en input/select/
textarea/botones; `--z-cabecera 60 · --z-mapa 500` documentados (los demás z-index se eliminan).

**P6 · Color semántico:** los 29 tokens actuales se mantienen (identidad intacta) y se documentan
pares AA obligatorios: texto-3 sobre panel ≥ 4,5:1 (el valor actual #7f6a52 se verifica en FASE 2;
si falla en cuerpos pequeños, sube a #6d5940). El semáforo siempre con etiqueta textual (ya así).

**P7 · Reglas del sistema:** `.rejilla > * { min-width: 0 }` asciende a ley; sin hex fuera de
tokens (los 17 casos de H4 se migran a tokens/constantes compartidas); sin `white-space: nowrap`
en contenido que pueda crecer; `srcset`/formato moderno para fotos (con FASE 5).

## 8. Propuesta de componentes y estados visuales (PARA APROBAR)

Matriz de estados por componente (craft-state-coverage): botón (reposo/hover/focus/activo/deshabilitado
/cargando), campo (reposo/foco/error/deshabilitado), tarjeta, tabla (fila hover + vacío), pestañas,
plegables, hoja de ruta. Componentes nuevos propuestos (sin implementar): `Campo` (label+error+ayuda
accesible), `Esqueleto` formal, `Aviso` unificado (info/éxito/alerta/error con icono+texto),
`ChipEstado`. Los existentes se refactorizan sobre los tokens; **ningún contrato funcional cambia**.

## 9. Estrategia preliminar de transiciones y microinteracciones (PARA APROBAR)

Mantener: entrada de página (transform-only), revelado con red de seguridad, pulso del semáforo,
ondas solo en escucha real, cinta con pausa. Añadir en FASE 3 (si se aprueba): transición de
expansión de `details` (150 ms), confirmación de pestañas (150 ms), hover de filas (120 ms).
Prohibido: animar valores de datos, parpadeo de alertas, bucles nuevos. Todo con
`prefers-reduced-motion`.

## 10. Riesgos de regresión y medidas preventivas

| Riesgo | Medida |
|---|---|
| El mapeo de 40 tamaños altera jerarquías percibidas | Tabla de mapeo revisada + capturas antes/después por vista |
| `min-width: 0` global puede contraer textos que hoy fuerzan ancho | Ya validado en FASE 0 (sondeo) + test visual 7 vistas |
| Consolidación de breakpoints cambia cortes visibles | Mantener cortes actuales en FASE 2; consolidar solo en FASE 4 con matriz de tamaños |
| Lámina exportable cambia de paleta | Migrar colores a constantes compartidas con el tema; verificar PNG exportado |
| Limpieza de CSS muerto toca reglas vivas por error | Borrar solo selectores con 0 usos verificados por grep y recompilar |

## 11. Matriz de hallazgos (evidencia, severidad, prioridad)

| ID | Hallazgo | Evidencia (ruta:línea) | Sev. | Prioridad FASE 2 |
|---|---|---|---|---|
| H1 | 40 tamaños de fuente | estilos.css pasim (medición) | Media | Alta |
| H2 | 26 gaps / 41 paddings | estilos.css pasim (medición) | Media | Alta |
| H3 | 13 radios | estilos.css (medición) | Baja | Media |
| H4 | 17 hex fuera de tokens; lámina con paleta oscura anterior | Evidencia.tsx:107–137; Documentos.tsx:240; Radar.tsx:17–21 | **Alta** | **Alta** |
| H5 | CSS muerto .autoridad* | estilos.css §guía (685+) | Baja | Baja |
| H6 | 6 breakpoints ad-hoc | estilos.css líneas 179–637 | Media | Media (FASE 4) |
| H7 | Ley `min-width:0` | estilos.css `.rejilla` | — | Conservar |
| H8 | Estados parciales (salud/rimay) | Cabecera.tsx; Rimay.tsx | Media | Alta |
| H9 | AA completa pendiente; teselas sin alt | mediciones FASE 0 | Media | FASE 4 |
| H10 | Movimiento conforme | estilos.css 103, 669+ | — | Conservar |
| H11 | Sin `any`/`@ts-ignore` | grep 0 coincidencias | — | Conservar |

## 12. Criterios de aceptación verificables para la FASE 2

1. `npm test` 57/57 y `verificar-datos` en verde tras los cambios.
2. Cero desbordes horizontales en 320/390/768/1024/1440 px para las 7 vistas (sondeo DOM reproducible).
3. Los 17 hex de TSX migrados a tokens/constantes compartidas (grep: 0 hex en *.tsx salvo SVG de marca).
4. Tabla de mapeo tipográfico/espaciado aplicada; capturas antes/después de las 7 vistas.
5. Selectores con reglas muertas eliminados; build sin CSS de `.autoridad*`.
6. Estados de carga de `/api/salud` (cabecera) y «procesando» de Rimay implementados con esqueleto/estado.
7. `prefers-reduced-motion` verificado en las 5 animaciones existentes.
8. Lámina exportable regenerada con la paleta cálida (captura del PNG).
9. Sin cambios de contratos de API ni de textos normativos; verificador de datos intacto.
10. Informe FASE 2 con diff, capturas y pruebas (formato §13 del protocolo).

## 13. Decisiones pendientes de aprobación

1. **Aprobar la escala tipográfica y de espaciado propuestas** (P1, P2) con mapeo por cercanía.
2. **Aprobar la migración de los 17 colores fuera de tokens** (H4), incluida la lámina exportable.
3. **Aprobar la eliminación del CSS muerto** (.autoridad*) y la consolidación de radios (H3, P3).
4. **Confirmar** que la consolidación de breakpoints se pospone a FASE 4 (H6).
5. **Confirmar** si FASE 2 incluye también la corrección I-02 (alt de teselas) o se deja para FASE 4.

## 14. Referencias reales inspeccionadas

`estilos.css` (411 reglas; líneas citadas en §4) · `App.tsx` · `main.tsx` · `i18n.tsx` · `datos.ts` ·
`datos-img.ts` · `datos-instituciones.ts` · `componentes/`: Icono, Cabecera, Pie, Semaforo,
TarjetaRegistro, Foto, Graficos, Simbolos, useRevelar · `paginas/`: Radar, Rimay, Evidencia,
Documentos, Casos, Denunciar, Legal, Creditos · `legal/contenidos.ts` · `img/creditos.json` ·
`index.html` · `manifest.webmanifest` · `sw.js` · evidencia: `docs/evidencia/01–07`,
`docs/evidencia/fase-0/*`, `docs/auditorias/FASE-0-DIAGNOSTICO.md`.

---

**Verificación de cierre (§7 del protocolo):** el código de producción permanece intacto
(únicamente este informe se añade al repositorio); no se ejecutaron pruebas de comportamiento
porque no hubo cambios que probar; limitación registrada: evaluación WCAG AA completa y métricas
web siguen pendientes para fases posteriores. **FASE 1 CERRADA. Se espera autorización explícita
para FASE 2.**
