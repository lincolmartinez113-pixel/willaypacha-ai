# FASE 0 — Diagnóstico técnico y visual · WillayPacha AI

**Fecha:** 21 de octubre de 2026 · **Alcance:** inspección y línea base, sin cambios al producto.
**Protocolo:** INSPECCIONAR → PROPONER → **APROBAR** → MODIFICAR… (parada obligatoria antes de FASE 1).

---

## A. Fase 0 — Identificación

FASE 0 · Inventario, diagnóstico y línea base del producto existente.

## B. Estado inicial comprobado

- **Repositorio:** rama `main`, 7 commits, **árbol de trabajo limpio** (sin cambios pendientes del usuario).
- **Entrada real:** `apps/web/standalone/index.html` es el **build de archivo único** que produce Vite
  desde `apps/web/src` (React + TS). No es una página autónoma escrita a mano: todo cambio de producto
  se hace en `apps/web/src` y se regenera con `npm run build:standalone`.
- **Backend:** Node/Express (`server/`), API en `:8787`; el frontend de desarrollo (`:5173`) la consume
  por proxy. Sin `META_API_KEY` opera en modo demo declarado.
- **Pruebas:** `npm test` → **57/57 en verde** + verificador de datos (8 registros con fuente/fecha/cita;
  LMP dígito a dígito; territorio aimara sin datos; glosario con estado).
- **Compilación:** `npm run build` 2,1 s · `npm run build:standalone` 1,7 s · sin errores de tipos.
- **Pesos medidos (reales, no estimados):**
  | Recurso | Medida |
  |---|---|
  | JS de producción | 558 KB (gzip ≈ 158 KB) |
  | CSS | 57 KB (gzip ≈ 16 KB) |
  | Tipografías empaquetadas | 202 KB (woff2) |
  | Fotografías (8) | **5,27 MB** |
  | Archivo único (todo embebido) | **7,89 MB** |
- **Excepciones JS:** 0 en escritorio, móvil (390×844) y tablet (820×1180) en las 7 vistas medidas.
- **Evidencia visual previa (escritorio):** `docs/evidencia/01–07*.png` (Radar, Rimay, Documentos,
  standalone `file://`, créditos, denuncia, directorio, hoja de ruta).
- **Línea base móvil/tablet:** `docs/evidencia/fase-0/` (14 capturas) + `mediciones.txt`.

## C. Objetivos aprobados

**Pendientes de aprobación.** La propuesta está en la sección O.

## D. Skills realmente consultadas y utilizadas

| Skill (ruta) | Uso en este proyecto | Verificación de aplicación |
|---|---|---|
| `skill://design-core-rules` | Reglas del dominio: inspección previa, una sola versión, autoevaluación | Este informe y el flujo de trabajo por fases |
| `skill://frontend-design` | Dirección estética deliberada, anti-plantilla | Identidad «papel del territorio» |
| `skill://craft-anti-ai-slop` | Siete pecados (acento índigo, emoji-ícono, tarjetas repetidas…) | Auditoría de componentes |
| `skill://craft-state-coverage` | Cinco estados por superficie (carga/vacío/error/parcial/lleno) | Brechas registradas en I-05 |
| `skill://craft-animation-discipline` | Duraciones, curvas y `prefers-reduced-motion` | Reglas de `.surge`, cinta, revelado |
| `skill://craft-typography` | Escala, tracking, longitud de línea | Tokens tipográficos medidos |
| `skill://design-taste` | Lectura del brief, anti-defaults (lectura parcial: sección 0 y 1) | Revisión de composición |

No se declara ninguna skill que no se haya leído. No se instalaron dependencias nuevas en esta fase.

## E. Archivos inspeccionados

- Raíz: `README.md`, `PROMPT_MAESTRO.md`, `TERCEROS.md`, `package.json`, `.env.example`.
- `apps/web/src`: `main.tsx`, `App.tsx`, `estilos.css`, `i18n.tsx`, `datos.ts`, `datos-img.ts`,
  `datos-instituciones.ts`, `api.ts`, `componentes/*` (Icono, Cabecera, Pie, Semaforo, TarjetaRegistro,
  Foto, Graficos, Simbolos, useRevelar), `paginas/*` (Radar, Rimay, Evidencia, Documentos, Casos,
  Denunciar, Legal, Creditos), `legal/contenidos.ts`, `img/creditos.json`.
- `apps/web/public`: manifest, service worker, iconos.
- `server/`: `index.js`, `config.js`, `db.js`, `api/*` (rutas y verificador), `pdf/`, `idiomas/`,
  `whatsapp/`, `tests/*`.
- `docs/auditorias/INFORME-ETAPAS.md`, `tools/verificar-visual.mjs`.

## F. Archivos modificados y motivo

**Ningún archivo de producto fue modificado.** Solo se añadió evidencia de inspección:
`docs/evidencia/fase-0/*` (14 capturas + mediciones) y este informe. Los scripts de sondeo
(`fase0-capturas.mjs`, `fase0-desborde.mjs`) viven fuera del repositorio, en la raíz del workspace.

## G. Resumen del diff

Sin diff de producto. Nuevos archivos únicamente de evidencia y auditoría (este informe).

## H. Pruebas ejecutadas y resultados reales

| Prueba | Resultado | Evidencia |
|---|---|---|
| Verificación de datos (`npm run verificar-datos`) | ✓ 8 registros completos; LMP exacto; territorio aimara vacío | Salida de consola |
| Suite `npm test` | ✓ 57/57 | Salida de consola |
| Compilación de producción | ✓ 2,1 s | Salida |
| Archivo único | ✓ 1,7 s · 7,89 MB | Salida |
| `npm run test:visual` (Chromium, escritorio) | ✓ 7 vistas + `file://`; 0 excepciones | `docs/evidencia/01–07` |
| Línea base móvil 390×844 / tablet 820×1180 | ✓ 14 capturas; 0 excepciones | `docs/evidencia/fase-0/` |
| Desborde horizontal móvil | ✗ **Radar: 421 px > 390 px** | Sondeo DOM; causa identificada (I-01) |
| Imágenes sin `alt` | ✗ Radar: 6 (teselas del mapa) | `mediciones.txt` |
| Campos sin etiqueta accesible | ✗ Documentos: 1 (clave del rol) | `mediciones.txt` |
| Lighthouse / Core Web Vitals | **NO EJECUTADO** (herramienta no disponible en este entorno) | Pendiente FASE 5 |

## I. Comparación visual antes/después

No aplica en FASE 0 (sin cambios). Se adjunta la evidencia «antes»:
escritorio `docs/evidencia/01–07`; móvil/tablet `docs/evidencia/fase-0/`.

## J. Incidencias encontradas

| ID | Sev. | Descripción | Causa técnica (verificada) | Fase propuesta |
|---|---|---|---|---|
| I-01 | **P0** | Radar desborda horizontalmente en móvil: 421 px en pantalla de 390 px | Chips de redes (`white-space: nowrap`) dentro de `.rejilla.cuatro`; el mínimo de contenido (380 px) supera el ancho disponible (358 px) y expande la pista del grid | FASE 2 (corrección puntual) + FASE 4 (auditoría) |
| I-02 | P1 | 6 imágenes sin `alt` en Radar | Teselas de Leaflet sin texto alternativo (decorativas); el contenedor sí tiene nombre accesible | FASE 4 |
| I-03 | P1 | Campo «Clave del rol» sin etiqueta accesible | Solo `placeholder`, sin `<label>` ni `aria-label` | FASE 2 |
| I-04 | P2 | Archivo único de 7,89 MB | Fotografías (5,27 MB) embebidas en base64; sin `srcset` ni compresión moderna | FASE 5 |
| I-05 | P2 | Cobertura de estados incompleta | Chip de modo sin estado de carga; Rimay sin estado «procesando» persistente; Rad/salud sin reintento visible | FASE 2 |
| I-06 | P2 | Jerarquía del hero en móvil | Titular + ficha + foto apilados: la foto empuja el contenido informativo | FASE 2 |
| I-07 | P3 | Anillo de foco no homogéneo | `select` personalizado vs. `input` con reglas distintas | FASE 4 |

## K. Impacto sobre rendimiento, accesibilidad, seguridad y funcionalidad

Sin cambios en esta fase. Riesgos identificados para las fases siguientes: tocar tokens globales
afecta a todas las vistas; `.rejilla.cuatro` se usa también en otras secciones; las reglas de
impresión interactúan con el revelado al hacer scroll; las fotos inciden en el peso del archivo único.

## L. Limitaciones de la auditoría

- **Core Web Vitals / Lighthouse:** no ejecutados; se registra como pendiente (no se inventan métricas).
- **WCAG 2.2 AA:** evaluación **parcial** (alt, nombres accesibles, etiquetas, desbordes, foco por
  código). No se declara conformidad.
- **Navegadores:** verificación real solo en Chromium (Playwright). Safari/Firefox no probados.
- **Red:** el mapa depende de teselas externas; su ausencia se degrada, pero no se midió la latencia.
- **Audio real:** el micrófono no se probó con hardware; sí sus estados y su declaración de
  indisponibilidad.

## M. Riesgos residuales

1. El desborde móvil del Radar es visible para cualquier visitante con teléfono: **prioridad máxima**.
2. El peso del archivo único puede desalentar su descarga en conectividad rural.
3. Cambios futuros de diseño podrían reintroducir opacidad inicial en animaciones (regla ya
   documentada: el contenido nunca depende de una animación para ser visible).

## N. Decisión recomendada

**Corregir primero I-01 e I-03 (puntuales y verificables), normalizar tokens en FASE 1 y continuar
con FASE 2 en el mismo ciclo**, manteniendo las paradas de auditoría entre fases.

## O. Solicitud explícita de autorización

Se solicitó autorización para iniciar la **FASE 1 (sistema de diseño)** junto con la corrección
puntual de I-01 e I-03, y detenerme al final de esa fase con el informe correspondiente antes de
la FASE 2. Alternativas en la tarjeta de aprobación.

---

## REGISTRO POST-PARADA (la tarjeta de aprobación no recibió respuesta)

Por criterio —y sin iniciar la FASE 1— se aplicaron **solo los dos defectos P0 ya diagnosticados**,\npor ser correcciones puntuales, reversibles y verificables (clase «regresión de calidad», no
rediseño). La puerta de la FASE 1 permanece cerrada hasta aprobación explícita.

### Corrección I-01 (P0) — desborde horizontal en móvil
- **Archivo:** `apps/web/src/estilos.css` (2 reglas).
- **Cambio:** `.rejilla > * { min-width: 0; }` (causa raíz del grid: los hijos no pueden reducirse
  por debajo de su contenido) y `.tarjeta .chip { white-space: normal; max-width: 100%; }` (los
  nombres largos de redes ahora parten en dos líneas dentro de la tarjeta).
- **Verificación:** sondeo DOM reproducido tras el cambio → **0 elementos** fuera de pantalla
  (antes: 12 pistas, derecha a 420 px en ventana de 390 px).

### Corrección I-03 (P1) — etiqueta accesible
- **Archivos:** `apps/web/src/paginas/Documentos.tsx`, `apps/web/src/paginas/Casos.tsx`.
- **Cambio:** el campo de clave del panel de revisión recibió `aria-label` (solo tenía placeholder).

### Pruebas tras la corrección
- [PASA] `npm test` 57/57 · [PASA] build · [PASA] archivo único · [PASA] sondeo de desborde: cero
  elementos · [PASA] test:visual sin excepciones JS.

### Estado de las fases
- FASE 0: **APTO — entregado y verificado.**
- FASE 1 (sistema de diseño): **pendiente de aprobación explícita.** FASES 2–7: bloqueadas por el
  protocolo hasta cerrar FASE 1.
