# FASE 3 — Motion design, transiciones y microinteracciones · WillayPacha AI

**Fecha:** 21 de octubre de 2026 · **Autorización:** exclusivamente FASE 3 (sin FASE 4/5, sin
dependencias nuevas). **Cierre:** informe entregado y **parada**; FASE 4 requiere autorización.

## 1. Estado inicial y final del repositorio

- **Inicial:** rama `main`, HEAD **`d445e28`** (auditoría de cierre de FASE 2). El commit auditado
  **`853f8a9` existe** en la historia (padre del anterior): diferencia documentada, no sobrescrita.
  Árbol limpio. Informes F0/F1/F2 y auditoría leídos antes de tocar código.
- **Final:** HEAD del commit de esta fase; árbol limpio tras versionar evidencia FASE 3.
  Sin cambios de producto fuera de los tres archivos previstos.

## 2. Inventario de animaciones original (antes de FASE 3)

| Elemento | Implementación | Tipo |
|---|---|---|
| `.surge` (entrada escalonada) | `@keyframes aparecer` transform+filter, 0.5 s, `both` | one-shot |
| `.pagina-entra` | `@keyframes pagina-entra` transform 0.28 s | one-shot por ruta |
| `.revelar` | transición opacity/transform 0.5 s + IntersectionObserver + red 2,5 s | scroll |
| `.semaforo .punto::after` | `@keyframes pulso` 2,2 s infinito | bucle de estado |
| `.micro.escuchando` ondas | `@keyframes ondas` 1,8 s ×2 | bucle condicionado a escucha |
| `.ondas i` barras | `@keyframes onda` 1 s | bucle condicionado |
| `.cinta-textil` | `@keyframes cinta` 12 s, pausa al hover | bucle decorativo de identidad |
| `.chakana-trazada` | `@keyframes trazo` 2,2 s `forwards` | one-shot |
| `details.plegable` flecha | rotación 0.15 s | micro |
| `esqueleto` | `@keyframes brillo` 1,4 s infinito | bucle de carga |
| Hover/press botones, tarjetas, filas, campos | transiciones de 0.12–0.25 s | micro |

## 3. Problemas observados y cambios realizados (por incremento)

1. **Pestañas sin continuidad (P2):** cambiar de pestaña en Casos montaba el panel de golpe →
   clase `.panel-entra` (`panel-in`: opacidad 0,45→1 + 4 px, 200 ms) en los 4 paneles. El contenido
   está visible durante toda la animación (regla del proyecto).
2. **Detalles expandibles sin transición (P1):** `details.plegable` abría instantáneo (solo la
   flecha animaba) → `.plegable[open] > .plegable-cuerpo { animation: panel-in }`. **No** se anima
   altura (evita recalcular layout y el clásico salto al cerrar); el cierre sigue siendo instantáneo
   por decisión documentada.
3. **Clave de transición de ruta frágil (P3):** `key={window.location.hash}` → `useLocation().pathname`
   (determinista con el router; la animación de página ya no depende del hash global).
4. **Chips-enlace sin respuesta (P4):** las redes/portal del directorio son `<a class="chip">` y no
   tenían hover → transición de borde y elevación de 1 px con `--dur-1`.
5. **Duraciones crudas sobrantes (P5):** cinco transiciones usaban valores sueltos
   (0.12/0.15/0.18/0.2/0.25 s) → tokens `--dur-1`/`--dur-2`. `.surge` y `.revelar` pasan a
   `--dur-4`; `.pagina-entra` a `--dur-3`.
6. **Scroll suave con movimiento reducido (P6):** `html { scroll-behavior: smooth }` no se
   desactivaba → `scroll-behavior: auto` dentro de `prefers-reduced-motion`.
7. **Riesgo de esqueleto infinito (P7):** si `/api/salud` cuelga, el chip de la cabecera podía
   brillar indefinidamente → red de seguridad de **6 s** que resuelve a «sin backend» (estado
   honesto). Incluye limpieza de temporizador y bandera de montaje.
8. **Hoja de ruta aparece de golpe (P8):** al marcar la primera situación, el bloque nacía sin
   transición → `panel-in` (200 ms).
9. **Botón de consulta sin feedback de pulsación (P9):** `.consulta-rapida:active` baja 1 px.

**Deliberadamente NO cambiado:** pulso del semáforo (señal de estado, no decoración; se detiene con
movimiento reducido), cinta textil (identidad; 12 s con pausa al hover — bucle aceptado y
documentado), brillo del esqueleto (acotado ahora por la red de 6 s), trazo de la chakana (one-shot).

## 4. Archivos modificados y justificación

- `apps/web/src/estilos.css` — keyframes `panel-in`, clases de panel/plegable/hoja, hover de
  `chip[href]`, press de consulta rápida, homogeneización de duraciones a tokens, reglas
  `prefers-reduced-motion` ampliadas (panel/plegable/hoja y scroll-behavior).
- `apps/web/src/App.tsx` — clave de transición con `useLocation`, red de seguridad de 6 s para
  `/api/salud`, listeners online/offline separados en su propio efecto.
- `apps/web/src/paginas/Casos.tsx` — `.panel-entra` en los cuatro paneles de pestaña.
- Evidencia: `docs/evidencia/fase-3/{antes,después}/` (8 + 8 capturas).

## 5. Duraciones y curvas utilizadas

| Token | Valor | Uso en esta fase |
|---|---|---|
| `--dur-1` | 120 ms | hover de chips, filas de tabla, press |
| `--dur-2` | 200 ms | entrada de paneles, detalles expandidos, hoja de ruta |
| `--dur-3` | 300 ms | transición de página (`.pagina-entra`) |
| `--dur-4` | 450 ms | entrada escalonada (`.surge`) y revelado (`.revelar`) |
| `--curva` | `cubic-bezier(0.22, 0.9, 0.3, 1)` | todas las animaciones y transiciones nuevas |

Bucles existentes sin cambios: pulso 2,2 s · ondas 1,8 s · barras 1 s · esqueleto 1,4 s · cinta 12 s ·
trazo de chakana 2,2 s (one-shot). No se añadió ningún bucle nuevo.

## 6. Matriz de movimiento normal y reducido (medición real en Chromium)

| Comprobación | Normal | `reducedMotion:'reduce'` |
|---|---|---|
| Panel de pestaña (`.panel-entra`) | `animationName: panel-in` | `none` |
| Cuerpo de `details[open]` | `panel-in` | `none` |
| Transición de `chip[href]` | `0.12s, 0.12s` | `0s` |
| `.surge` (auditoría F2, re-verificado en F3) | `aparecer` | `none` |
| `.revelar` con reduce | — | `opacity: 1` (contenido visible) |
| Cinta textil con reduce | `cinta` | `none` |
| `scroll-behavior` con reduce | `smooth` | `auto` (regla añadida) |

## 7. Capturas comparativas

`docs/evidencia/fase-3/antes/` (8) y `docs/evidencia/fase-3/después/` (8), tomadas con
`animations: 'disabled'` para que el diff mida **layout**, no movimiento. Resultado: 7 capturas
**idénticas byte a byte**; solo `03-documentos.png` difiere por la marca de tiempo del documento
creado en cada corrida del test (no es cambio visual).

## 8. Resultados reales de pruebas, build y matriz responsive

- `npm test` → **57/57**, exit 0 · `verificar-datos` ✓ · `npm run build` ✓ 0,26 s ·
  `build:standalone` ✓ 0,63 s.
- `npm run test:visual` → exit 0, 13 comprobaciones ✓, **0 excepciones JS**.
- `node tools/verificar-responsive.mjs` → **35/35 sin desbordes ni excepciones** (320/390/768/1024/1440 × 7 vistas).
- Verificación de movimiento (§6) ejecutada dos veces: normal y reducido.

## 9. Riesgos y limitaciones pendientes

1. `details` no anima altura: apertura con fundido, cierre instantáneo — decisión por rendimiento y
   accesibilidad (documentada; si se quisiera simetría total habría que usar JS o `grid-template-rows`,
   fuera de alcance).
2. Verificación real solo en **Chromium**; Safari/Firefox no probados (no se declara compatibilidad).
3. WCAG 2.2 AA completa sigue **pendiente** (FASE 4). Esta fase no declara conformidad.
4. La captura `03-documentos.png` cambia por timestamps del documento de prueba (evidencia, no UI).
5. `--dur-3` y `--dur-4` ya existían; se usan ahora en las entradas (sin cambios de tokens globales).

## 10. Dictamen de criterios de aceptación

| Criterio | Dictamen |
|---|---|
| Reutiliza tokens existentes, sin dependencias nuevas | **Cumplido** |
| Continuidad en pestañas y navegación sin bloquear | **Cumplido** (medido) |
| Expansión de `details` sin romper semántica/accesibilidad | **Cumplido** (CSS puro, sin JS) |
| Microinteracciones homogéneas (hover/foco/activo) | **Cumplido** (chips, press; foco intacto) |
| Sin animar datos, cifras, semáforos ni resultados | **Cumplido** |
| Movimiento reducido: contenido visible, bucles detenidos | **Cumplido** (medido) |
| Estados distinguibles sin depender solo del color/movimiento | **Cumplido** |
| Pruebas, build, visual y matriz responsive | **Cumplido** (57/57; 13 ✓; 35/35) |
| Sin regresiones de layout | **Cumplido** (capturas deterministas idénticas) |
| Informe con evidencia y parada | **Cumplido** (este documento) |

**FASE 3 CERRADA.** No se inicia FASE 4 sin autorización explícita.
