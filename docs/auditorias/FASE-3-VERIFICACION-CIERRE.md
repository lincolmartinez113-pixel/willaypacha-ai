# FASE 3 — Verificación de cierre · WillayPacha AI

**Fecha:** 21 de octubre de 2026 · **Alcance:** verificación documental y técnica del cierre de la
FASE 3. Sin rediseño, sin funciones nuevas, **sin iniciar FASE 4 ni FASE 5**. Repositorio conservado
sin modificaciones funcionales.

---

## Resumen ejecutivo y dictamen

La FASE 3 (motion design) está **verificada en sus puntos esenciales**: el commit `259c633` contiene
exactamente los tres archivos de producto declarados más artefactos y evidencias autorizadas; las
pruebas se **reprodujeron de nuevo** con código de salida 0 (57/57, datos, build); el mecanismo de
seguridad de 6 s de `/api/salud` es correcto en sus cinco comportamientos (respuesta, respuesta
tardía tras desmontaje, respuesta tardía en pantalla, cuelgue sin respuesta, limpieza al desmontar);
`prefers-reduced-motion` mantiene el contenido visible y detiene las animaciones (medido en
Chromium). **Una desviación documentada:** el commit incluye también `apps/web/standalone/index.html`
regenerado (artefacto de build, no edición manual — detalle que el informe FASE 3 no enumeró
explícitamente). **Dictamen: FASE 3 CERRADA — VERIFICADA.** FASE 4 requiere autorización explícita.

## Identificación exacta del commit auditado

- Rama **`main`** · HEAD **`259c633`** «FASE 3: motion design, transiciones y microinteracciones»
  · árbol de trabajo **limpio** (0 modificados, 0 no versionados) al inicio y al cierre.
- Cadena: `4558c18` (F0) → `843d9cb` (F1) → `853f8a9` (F2) → `d445e28` (auditoría F2) → `259c633` (F3).
- El cierre auditado (`853f8a9`) **existe** en la historia como padre de la auditoría; el único
  cambio posterior documentado y autorizado fue el informe de la auditoría (`d445e28`).

## Archivos y diferencias verificadas (diff de `259c633`)

| Archivo | Estado | Coincide con el informe |
|---|---|---|
| `apps/web/src/estilos.css` | ±27 líneas | ✓ (keyframes `panel-in`, chips-enlace, press, duraciones a tokens, reduced-motion ampliado) |
| `apps/web/src/App.tsx` | ±22 líneas | ✓ (red de 6 s, `useLocation`, efecto online/offline separado) |
| `apps/web/src/paginas/Casos.tsx` | ±8 líneas | ✓ (`.panel-entra` en los 4 paneles) |
| `apps/web/standalone/index.html` | ±4 líneas | **Observación:** regeneración del artefacto de build (hash del bundle); el informe FASE 3 no la enumeró. No es edición manual ni cambio de producto fuente. Corresponde: el usuario abre ese archivo con doble clic |
| `docs/auditorias/FASE-3-MOTION-DESIGN.md` | +134 | ✓ presente y versionado |
| `docs/evidencia/03-documentos.png` | Bin | ✓ evidencia refrescada (ver §Evidencia) |
| `docs/evidencia/fase-3/antes/` (8) · `después/` (8) | +16 | ✓ presentes y versionadas |

**Conclusión:** los cambios de producto se limitan a los tres archivos declarados. La regeneración
del artefacto de build es la única omisión de enumeración, sin riesgo funcional.

## Pruebas realmente ejecutadas en esta auditoría (comando · exit · resultado)

1. `node tools/verificar-datos.mjs` · exit **0** · 8 registros completos; LMP dígito a dígito.
2. `npm test` · exit **0** · `tests 57 · pass 57 · fail 0`.
3. `npm run build` (dist no versionado) · exit **0** · sin errores de tipos.
4. Chromium con `reducedMotion:'reduce'` (solo lectura): `panel-entra` → `animationName: none`,
   `opacity: 1` (contenido visible) · `.surge` → `none` · `.revelar` → `opacity: 1` ·
   `scroll-behavior: auto` · **0 excepciones JS**.

**Deliberadamente no re-ejecutadas** para conservar el árbol sin cambios de evidencia versionada:
`npm run build:standalone`, `npm run test:visual`, `node tools/verificar-responsive.mjs`,
`node tools/verificar-lamina.mjs`. Sus resultados permanecen como **declarados en el informe**
(exit 0 registrados en el commit `259c633`), no como verificación nueva de esta auditoría.

## Revisión del temporizador y listeners de `/api/salud` (`App.tsx:25–47`)

| Comportamiento | Código | Dictamen |
|---|---|---|
| Respuesta normal | `.then` → `clearTimeout` + estado | **VERIFICADO** |
| Cuelgue sin respuesta | `setTimeout` 6 s → `salud=null`, `cargandoSalud=false` («sin backend») | **VERIFICADO** (código; cronómetro simulado no ejecutado) |
| Respuesta tardía tras el timeout (componente montado) | `.then` igualmente actualiza al valor real | **VERIFICADO** (coherente: converge a la verdad más reciente) |
| Respuesta tardía tras desmontaje | guardia `if (!vivo) return` | **VERIFICADO** |
| Desmontaje | limpieza de temporizador; listeners online/offline en efecto propio con su limpieza | **VERIFICADO** |
| Error de red | `api.salud()` captura y devuelve `null` → «sin backend» | **VERIFICADO** |
| Indicador de carga | `aria-busy` + `role="status"` + esqueleto | **VERIFICADO** (FASE 2) |

## Estado de la evidencia visual

- `fase-3/antes/` y `fase-3/después/`: **8 + 8 capturas**, versionadas en `259c633`.
- Comparación visual de `03-documentos.png` (la única que difiere, 286 210 → 285 541 bytes):
  **inspeccionadas ambas**. Diferencias: contador de documentos de prueba (DOC-0001 → DOC-0002,
  bandeja 1 → 2). **Misma interfaz y disposición: sin regresión visual.** Las otras 7 parejas son
  idénticas byte a byte.
- La lámina exportable no forma parte de las capturas de esta fase (se verificó en FASE 2).

## Defectos, limitaciones y riesgos pendientes

1. El informe FASE 3 no enumeró la regeneración de `standalone/index.html` en el diff (omisión
   documental, sin impacto). **Registrado aquí como corrección.**
2. WCAG 2.2 AA completa: **no evaluada** (FASE 4). No se declara conformidad.
3. Lighthouse/Core Web Vitals: no ejecutables en este entorno (FASE 5).
4. Safari/Firefox: no probados (solo Chromium).
5. Micrófono real: no probado con hardware (solo estados y declaraciones).
6. Paddings sin consolidar y peso del archivo único: pendientes declarados (FASE 4/5).

## Diferencias entre lo declarado y lo comprobado

| Afirmación del informe FASE 3 | Clasificación |
|---|---|
| «57/57, exit 0» | **VERIFICADA** (re-ejecutada en esta auditoría) |
| «13 comprobaciones visuales ✓, 0 excepciones» | **DECLARADA EN EL INFORME** (no re-ejecutada aquí para no alterar evidencias versionadas; mecanismo revisado por código) |
| «Matriz responsive 35/35» | **DECLARADA EN EL INFORME** (ídem) |
| «Movimiento normal/reducido medido» | **VERIFICADA** (re-medido en Chromium: `panel-in`/`none`; chips `0.12s`/`0s`) |
| «prefers-reduced-motion mantiene contenido visible» | **VERIFICADA** |
| «Cambios limitados a 3 archivos de producto» | **VERIFICADA CON OBSERVACIÓN** (más el artefacto `standalone` regenerado) |
| «7 capturas idénticas; 03 difiere por timestamp» | **VERIFICADA** (inspección visual de ambas imágenes) |
| Compatibilidad Safari/Firefox y WCAG AA | **NO VERIFICADA** (declarado) |
| Ningún producto bloqueado | **No aplica BLOQUEADA** |

## Recomendación para la siguiente fase

Apto para planificar la **FASE 4 (móvil/tablet y accesibilidad completa)** con esta base. Al
autorizarla, incluir como ítems de entrada: la evaluación WCAG 2.2 AA con lectores de pantalla, la
consolidación de breakpoints/paddings diferida, el `alt`/resumen textual del mapa ya parcialmente
resuelto y las limitaciones de entorno aquí registradas. **Parada: no se inicia FASE 4 sin
autorización explícita.**
