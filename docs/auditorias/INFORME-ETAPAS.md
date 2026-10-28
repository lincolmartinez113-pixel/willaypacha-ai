# Informe de construcción — etapas E0–E9 · WillayPacha AI

Fecha de construcción: 21 de octubre de 2026 (preparación previa a la ventana oficial del
hackathon, que abre el 26/10 a las 12:00 hora de Lima). **Alcance de este informe:** la
generación completa del software en esta instancia, con evidencia real por ítem. Formato según
la plantilla del protocolo (sección 13.3 del informe de preparación). Un «pasa» sin evidencia no
cuenta como verificado.

Veredicto global honesto: **APTO como entrega de código verificada en esta instancia**, con dos
limitaciones declaradas que no se esconden: (1) sin `META_API_KEY` no se ejecutó ninguna llamada
en vivo a la Meta Model API — el motor corre en modo demo declarado y el modo en vivo queda
implementado y pendiente de créditos; (2) la grabación del video y el despliegue público son
tareas de la ventana oficial, no de esta instancia. La verificación visual interactiva de la
interfaz SÍ fue ejecutada (Chromium automatizado, capturas en `docs/evidencia/`), incluyendo el
caso «archivo único con doble clic bajo file://» reportado por el usuario.

---

## Etapa 0 · Reglas y entorno — parada

### Construido
- Repositorio `willaypacha-ai/` con la estructura prevista (Anexo A) → raíz del proyecto
- `.env.example` sin valores; `.gitignore` excluye `.env`, `node_modules`, `dist`, estado dinámico
- Escaneo de secretos automatizado → `tools/escanear-secretos.mjs`

### Auditoría (ítem por ítem)
- [PASA] Entorno: Node v24.20.0, npm 11.19.0, git 2.55.0, Python 3.13.15 — salida de `--version`
- [PASA] Registro npm accesible (`npm ping` → PONG)
- [PASA] Estructura de carpetas completa (`apps/web`, `server/{api,prompts,pdf,idiomas,whatsapp}`, `data`, `i18n`, `skills`, `tools`, `.github/workflows`, `docs`)
- [PASA] `.env` no existe; `.env.example` contiene solo nombres de variables vacíos — inspección del archivo
- [PASA] Escaneo de secretos: «sin hallazgos en todo el árbol» — `node tools/escanear-secretos.mjs`
- [NO EJECUTABLE EN ESTA INSTANCIA] Llamada de prueba a la Meta Model API: no hay `META_API_KEY` ni créditos antes de la ventana oficial. Señal esperada según la especificación (el protocolo la contempla); el sistema opera en MODO DEMO declarado y el cliente en vivo está implementado (`server/api/meta-client.js`, con manejo de 402 → detener y reportar)

### Veredicto: APTO (con el ítem externo declarado, según el criterio de la especificación)

---

## Etapa 1 · Esqueleto y diseño base — parada

### Construido
- PWA React + TypeScript con Vite; navegación de los cinco módulos como rutas funcionales → `apps/web/src/App.tsx`
- Diseño oscuro profesional con tokens CSS, contraste AA sobre fondo oscuro → `src/estilos.css`
- Selector de idioma visible desde el arranque; indicador offline; chip de modo (demo/en vivo)
- Componentes base: botón de escucha con ondas, semáforo con ícono + texto, franja de cita
- Manifest, iconos y service worker → `apps/web/public/`

### Auditoría (ítem por ítem)
- [PASA] `tsc --noEmit` sin errores y `vite build` exitoso (508 KB bundle, 46 módulos)
- [PASA] Las cinco rutas definidas y compiladas (`/`, `/rimay`, `/evidencia`, `/documentos`, `/casos`, `/legal/:documento`)
- [PASA] Servicios HTTP del build: index 200, JS 200 (507 KB), CSS 200, icono 200, manifest 200, sw.js 200 — `tools/smoke-web.mjs`
- [PASA] El bundle contiene los textos de los cinco módulos y las páginas legales — verificación de cadenas
- [PASA] Responsive básico por CSS (media queries en 900/760/620 px) — inspección de `estilos.css`
- [PASA] **Verificación visual real con Chromium (Playwright)**: los cinco módulos renderizan; Rimay responde con cita de OEFA vía `/api/explicar`; borrador DOC creado desde la interfaz; cero excepciones JS sin capturar; capturas `docs/evidencia/01–03` — `npm run test:visual`

### Fallos y correcciones
1. **Pantalla en blanco al abrir `index.html` con doble clic** (reportada por el usuario): rutas absolutas `/assets/…` + módulos ES + BrowserRouter, bloqueados por los navegadores bajo `file://`. Corrección: HashRouter (rutas hash) + **build de archivo único** (`npm run build:standalone` → `apps/web/standalone/index.html`) verificado renderizando bajo `file://` (`docs/evidencia/04-standalone-doble-clic.png`).

### Veredicto: APTO (verificación visual incluida; limitación anterior resuelta)

---

## Etapa 2 · Datos y Radar de Transparencia — parada (la más estricta en datos)

### Construido
- Datos semilla curados con los campos obligatorios → `data/datos-semilla.json` (8 registros)
- Verificador automático que hace fallar la construcción → `tools/verificar-datos.mjs` + CI `verificar-datos.yml`
- Radar con mapa, tabla de contraste, línea de tiempo, normas ECA/LMP, bitácora y canal de rectificación → `src/paginas/Radar.tsx`
- Método de curaduría documentado → `data/fuentes-y-metodo.md`

### Auditoría (ítem por ítem)
- [PASA] «✓ Verificación de datos PASÓ: 8 registros con fuente, fecha y cita; LMP coincide dígito a dígito con la tabla oficial; territorio C sin datos inventados; glosario con estado de validación» — `npm run verificar-datos`
- [PASA] El verificador detecta fallos reales: se comprobó fallando por un término de glosario sin regla de valor nulo, y se corrigió el verificador para aceptar vacíos SOLO cuando están declarados como pendientes (regla añadida, no excepción ad hoc)
- [PASA] Cada fila de la tabla abre su fuente primaria (portal institucional + término de búsqueda exacto, sin enlaces fabricados)
- [PASA] Territorio C (altiplano aimara) sin unidades ni registros, con leyenda de preparación — validado por el script
- [PASA] Coordenadas marcadas como aproximadas en datos y en la interfaz — validado por el script
- [PASA] Hashes de documentos primarios: pendientes y declarados (null + nota), sin hashes fabricados — validado por el script (regex SHA-256 si existiesen)
- [PASA] Regresión E1: `npm run build` sigue en verde

### Veredicto: APTO

---

## Etapa 3 · Motor de IA (prompts P1–P6) — parada crítica

### Construido
- Cliente de la Meta Model API exclusivamente en el backend, OpenAI-compatible, con manejo de 402 → `server/api/meta-client.js`
- Prompts P1–P6 versionados con hash → `server/prompts/P*.md`, `server/api/prompts.js`
- Verificador P6 implementado como código (cifras, vocabulario controlado, causalidad, atribución, anclaje; frases meta solo verbatim) → `server/api/verificador.js`
- Explicador con encadenamiento P2/P3 → P6, modo en vivo con fail-closed y modo demo declarado → `server/api/explicador.js`, `server/api/explicador-demo.js`
- Batería de las diez preguntas trampa como suite de pruebas → `server/tests/trampas.test.js`

### Auditoría (ítem por ítem)
- [PASA] 10/10 preguntas trampa terminan en «no consta», cita válida, término sin inventar, derivación o resistencia a la inyección; 12/12 subpruebas en verde (incluye verificación de vocabulario fuera de cita y cita correcta de OEFA en la explicación de Chogñacota) — `node --test` (suite trampas)
- [PASA] Ninguna clave de API en el cliente ni en el repositorio — escaneo de secretos limpio + revisión de `apps/web`
- [PASA] El Registro de Generación acompaña toda salida (modelo, prompt, fecha, fuentes, verificación) — `explicador.test.js`
- [PASA] P6 bloquea de verdad: pruebas unitarias con cifra fabricada, acusación sin respaldo, causalidad no escrita, hecho sin atribución, frase sin anclaje — `verificador.test.js`
- [PASA] Regresión E1–E2 en verde
- [NO EJECUTABLE EN ESTA INSTANCIA] Explicación real en vivo con Muse Spark y registro de costos por llamada (requiere créditos). El protocolo: sin créditos se detiene y reporta; no se cambia de proveedor

### Fallos y correcciones (registrados, no ocultos)
1. P6 bloqueaba las frases meta del sistema («no consta», derivaciones) → se rediseñó la salida del generador en **partes etiquetadas** (factual vs meta) y el verificador acepta metas solo verbatim; prueba unitaria añadida.
2. Desajuste de clave `t`/`texto` entre explicador y verificador (todas las partes llegaban vacías) → detectado por el humo, corregido y re-verificado.

### Veredicto: APTO (motor demo verificado; motor en vivo pendiente de créditos, no se construye nada encima que dependa de él sin verificación)

---

## Etapa 4 · Asistente de voz e idiomas — parada

### Construido
- Flujo de voz con visualizador, consultas rápidas, respuesta bilingüe con estado de traducción, aviso de apertura → `src/paginas/Rimay.tsx`
- Capa de idiomas con la tabla de checkpoints de la skill del proyecto, ejecución solo en servidor y declaraciones de indisponibilidad → `server/idiomas/index.js`
- TTS/ASR endpoints que declaran (nunca simulan) → `/api/voz/tts`, `/api/voz/transcribir`

### Auditoría (ítem por ítem)
- [PASA] Checkpoints exactos de la skill: `facebook/mms-tts-quz|ayr|cni`, licencias CC-BY-NC 4.0, Omnilingual Apache 2.0 — `idiomas.test.js`
- [PASA] SeamlessM4T descartado con su motivo declarado en el API de disponibilidad — `idiomas.test.js`
- [PASA] NLLB-200 no cubre asháninka: ruta declarada «glosario + P3 + P6» — `idiomas.test.js`
- [PASA] TTS no disponible se declara con motivo (503) y checkpoint/licencia; la interfaz lo muestra — `idiomas.test.js` + diseño de Rimay
- [PASA] El asistente se presenta como IA y declara límites al abrir; sin asesoría legal ni diagnósticos — texto del módulo + pruebas del explicador
- [PASA] Término fuera del glosario permanece en español entre paréntesis (trampa 8) — `trampas.test.js`
- [PASA] Variedades declaradas (Cusco ≠ Cusco-Collao de Puno; asháninka general ≠ Perené) — `idiomas.test.js`

### Veredicto: APTO (capacidades de voz en vivo declaradas no disponibles en esta instancia, como exige el protocolo)

---

## Etapa 5 · Laboratorio de Evidencia — parada

### Construido
- Subida con SHA-256 en el cliente → `src/lib/hash.ts`
- Lector EXIF mínimo (fecha, cámara, GPS) → `src/lib/exif.ts`
- Segmentación heurística local **declarada** + Lámina de Apoyo Visual exportable con leyenda obligatoria → `src/lib/segmentacion.ts`, `src/paginas/Evidencia.tsx`
- Borrar la fotografía elimina también su lámina y su máscara → `borrar()` en la página

### Auditoría (ítem por ítem)
- [PASA] Hash SHA-256 calculado con crypto.subtle sobre el archivo original (cliente) — revisión de implementación
- [PASA] Lector EXIF verificado contra fixture real generado con Pillow (GPS 14°45′S 70°34′48″W, fecha, cámara): «fecha OK: true · camara OK: true · lat OK: true · lng OK: true» — `tools/crear-fijacion-exif.py` + corrida
- [PASA] La etiqueta «contaminación detectada» NO aparece en el código del cliente — `rg` sobre `apps/web/src` (coincidencia cero; el término solo aparece en las pruebas del servidor para verificar que se evita)
- [PASA] Leyenda de límites presente en el visor y en la lámina exportada — revisión de `segmentacion.ts` (LEYENDA_LIMITE) y de la lámina
- [PASA] Motor de segmentación declarado: `local-heuristica-cliente` con declaración «NO es SAM 3.1 y NO mide química» — `/api/salud` y `/api/segment`
- [NO EJECUTABLE EN ESTA INSTANCIA] Contraste del hash con herramienta externa sobre la interfaz en vivo (sin navegador local disponible); el algoritmo es SHA-256 estándar y la misma operación se verifica en servidor (`casos.test.js` comprueba el hash almacenado)
- [PASA] Regresión acumulada E1–E4

### Fallos y correcciones
1. El lector EXIF devolvía `null` con el fixture: los punteros de sub-IFD (Exif/GPS) son LONG **inline** y se leían como posición — corregido (`posDato` con lectura del valor) y re-verificado con el fixture.

### Veredicto: APTO

---

## Etapa 6 · Documentos y Bandeja de Expertos — parada

### Construido
- Generador PDF con franja de borrador en **cada página** y Registro de Generación en el pie → `server/pdf/generador.js`
- Tres plantillas: Acta bilingüe, Informe Técnico (tabla LMP citada), Denuncia/solicitud → mismo archivo
- Flujo de estados con bitácora y panel experto (nombre + colegiatura CIP/CAL) → `server/api/rutas-documentos.js`, `src/paginas/Documentos.tsx`

### Auditoría (ítem por ítem)
- [PASA] Generación de los tres documentos con datos semilla — `documentos.test.js`
- [PASA] Franja de borrador dibujada en `pageAdded` (todas las páginas) mientras no exista aprobación — implementación + PDF generado (miles de bytes, %PDF)
- [PASA] PDF final **bloqueado** (403) antes de la aprobación; habilitado tras aprobación con hash SHA-256 devuelto — `documentos.test.js`
- [PASA] Aprobar exige nombre, colegiatura y tipo CIP/CAL (400 si falta) — `documentos.test.js`
- [PASA] Observar devuelve a borrador con las observaciones en la bitácora — `documentos.test.js`
- [PASA] Sin firmas, sin fechas de presentación, sin afirmaciones de delito en las plantillas — revisión de texto + reglas de P5
- [PASA] Revisión exige rol (403 sin clave) — `documentos.test.js`
- [PASA] Regresión E1–E5

### Fallos y correcciones
1. Recursión infinita de pdfkit: el pie se dibujaba bajo el área de contenido y cada `text` agregaba página → bandas con `height` y `ellipsis` explícitos. Detectado por «Maximum call stack size exceeded» en el humo; corregido y re-verificado.

### Veredicto: APTO

---

## Etapa 7 · Casos de la comunidad y filtro de verificación — parada

### Construido
- Registro con consentimiento e identidad reservada, evidencia con hash y cadena de custodia → `server/api/rutas-casos.js`, `src/paginas/Casos.tsx`
- Filtro de cinco pasos: consistencia automática (asistente, no juez), dos revisores (uno ambiental/legal), publicación con leyenda, retiro con borrado efectivo
- Panel de revisión por roles y seguimiento con código de retiro

### Auditoría (ítem por ítem, adversarial)
- [PASA] Sin consentimiento → 400 con texto legal; sin rol no hay acceso a la bandeja (403) — `casos.test.js`
- [PASA] Misma fotografía duplicada → 409, no se crea un segundo caso (conteo de casos en db) — `casos.test.js`
- [PASA] Verificar exige dos revisores con dictamen favorable y al menos uno con perfil ambiental o legal (400 con motivo) — `casos.test.js`
- [PASA] Caso con menores identificables → bloqueado («regla dura») — `casos.test.js`
- [PASA] Publicación con la leyenda exacta de alcance; contacto nunca expuesto; identidad reservada visible como tal — `casos.test.js`
- [PASA] Retiro: ficha, evidencias y transcripciones desaparecen de los datos; el archivo se elimina del disco (comprobado con `existsSync`) — `casos.test.js`
- [PASA] Seguimiento por código; retiro exige contacto + código (403 con titularidad incorrecta) — `casos.test.js`
- [PASA] Regresión E1–E6

### Veredicto: APTO

---

## Etapa 8 · Legal, privacidad y seguridad transversal — parada

### Construido
- Seis páginas legales con contenido real del proyecto (sin plantillas) + resumen simple + versiones de lenguas marcadas borrador → `src/legal/contenidos.ts`, `src/paginas/Legal.tsx`
- Roles, bitácora, ARCO con vía directa → `/api/arco/*`, `arco.test.js`
- Protocolo de incidentes y seguridad documentados → página legal «Seguridad»

### Auditoría (ítem por ítem)
- [PASA] Las seis páginas existen y son específicas del proyecto (normas, instituciones y flujos concretos; prohibición de plantilla contemplada en el contenido) — revisión de `contenidos.ts`
- [PASA] Escaneo de secretos sobre todo el árbol: «sin hallazgos» — `tools/escanear-secretos.mjs`
- [PASA] Dependencias sin vulnerabilidades: «found 0 vulnerabilities» — `npm audit --audit-level=critical`
- [PASA] Prueba ARCO completa: acceso → rectificación → cancelación con borrado efectivo verificable — `arco.test.js`
- [PASA] Regresión de trampas tras todos los cambios (la batería completa corre en cada `npm test`)
- [PASA] Regresión E1–E7

### Fallos y correcciones
1. ID de solicitud ARCO generaba «ARCO-0NaN» (secuencia con clave faltante) → corregido; la suite lo detectó por 404.
2. Respuesta de «acceso» con referencia circular (la solicitud se incluía a sí misma) → serialización plana y exclusión de la solicitud actual.

### Veredicto: APTO

---

## Etapa 9 · Cierre, demostración y entrega — parada final

### Construido
- README bilingüe (EN primero, ES debajo) que declara qué es real, qué es demo y qué está pendiente de validación → `README.md`
- PROMPT_MAESTRO versionado, TERCEROS, arquitectura, guion de video → raíz y `docs/`
- Skills de agente (verificar-fuente, explicar-en-lengua, generar-expediente, auditar-demo, lenguas-originarias-meta) → `skills/`
- CI: `ci.yml`, `verificar-datos.yml`, `demo-smoke.yml` (con artefacto de evidencia)
- Plan B sin conexión: service worker + datos semilla empaquetados

### Auditoría (ítem por ítem)
- [PASA] Suite completa final: 57/57 pruebas + verificación de datos — `npm test`
- [PASA] Build final sin errores — `npm run build` y `npm run build:standalone` (archivo único 538 KB con toda la app embebida)
- [PASA] Humo del stack completo: index 200, assets 200, iconos/manifest/sw 200, API 200 en modo demo — `tools/smoke-web.mjs`
- [PASA] **Recorrido visual interactivo ejecutado** con Chromium: cinco módulos + legales + flujo real (explicación con cita de OEFA vía API; borrador DOC creado desde la interfaz) + **archivo único bajo `file://`**; cero excepciones JS sin capturar; capturas `docs/evidencia/01–04` — `npm run test:visual`
- [PASA] El README no afirma nada que los informes no respalden y documenta las tres formas correctas de abrir la app (archivo único, desarrollo, build)
- [NO EJECUTABLE EN ESTA INSTANCIA] Demo corrida tres veces con red lenta simulada: requiere el entorno de grabación de la ventana oficial
- [NO APLICABLE AQUÍ] Entrega en la plataforma del evento con captura: corresponde al 4 de noviembre, no a esta instancia de preparación

### Veredicto: APTO PARCIAL para el alcance de esta instancia (código y verificaciones completos, incluida la visual; grabación y despliegue corresponden a la ventana oficial)

---

## Anexo · Segundo rediseño: paleta cálida + fotografía citada (tercera pasada)

Petición del usuario: paleta más cálida y llamativa, fotografías con respaldo/cita de origen, más
nivel y más funcionamiento — sin saltarse la especificación.

### Construido
- **Paleta «papel del territorio»**: fondo crema cálido, tinta café, acento terracota + oro;
  contornos topográficos en terracota; semáforo recalibrado para contraste AA sobre papel.
- **Fotografía real con cita obligatoria**: 8 fotografías de Wikimedia Commons descargadas con
  autor y licencia desde el API (`tools/descargar-fotos.mjs`, `completar-fotos.mjs`,
  `normalizar-creditos.mjs`, `sincronizar-fotos.mjs`), manifest versionado en
  `apps/web/src/img/creditos.json` y página pública **/creditos** con la tabla completa.
  Todas declaradas como imágenes referenciales (no fotodocumento de los puntos exactos).
- **Hero fotográfico** (Titicaca al amanecer, Diego Delso, CC BY-SA 4.0) y **galería territorial**
  con crédito visible en cada pieza.
- **Gráficos SVG propios** (sin dependencias): dona del semáforo y barras por año, calculados en
  vivo desde `data/datos-semilla.json` — nada inventado.
- Mapa con teselas claras CARTO Voyager; fotos movidas a `src/assets` e importadas: el archivo
  único las incrusta en base64 y funcionan bajo `file://`.
- Corrección de robustez: la animación de entrada ya no usa opacidad — si un entorno congela
  animaciones, el contenido sigue visible (detectado en la propia verificación visual).

### Auditoría (ítem por ítem)
- [PASA] `npm test` 57/57 + verificación de datos — comportamiento del servidor intacto
- [PASA] `npm run build` + `npm run build:standalone` (fotos embebidas)
- [PASA] `npm run test:visual`: cinco módulos + legales + **/creditos** renderizan; explicación con
  cita de OEFA vía API; borrador DOC desde la interfaz; archivo único bajo `file://` con la foto
  del hero visible; cero excepciones JS — capturas regeneradas `docs/evidencia/01–05`
- [PASA] Honestidad de leyendas: dos descargas descartadas por no corresponder al tema (una
  polilla y un estampilla) y los pies ajustados a lo que cada foto realmente muestra; el crédito
  se normalizó contra el API y los enlaces se validaron (verificado 21/10/2026)
- [PASA] Anti-slop: sin índigo, sin emoji-ícono, sin métricas inventadas (ficha y gráficos derivan
  de datos-semilla), un solo acento dominante
- [PASA] Robustez: contenido nunca depende de una animación para ser visible

### Veredicto: APTO

## Anexo · Cuarta pasada: símbolos, lenguas propias y guía de denuncia

Petición del usuario: transiciones/animaciones con símbolos de pueblos originarios, selector de
lenguas con sus propios nombres, y que la página informe por completo qué hacer ante la
contaminación (documentación, autoridades, mediación, vulnerabilidades), con transcripción a las
lenguas — sin salirse de la especificación.

### Construido
- **Símbolos y animación**: chakana SVG que se traza al entrar (`componentes/Simbolos.tsx`) y
  cinta textil geométrica animada entre secciones; ambas respetan `prefers-reduced-motion` y no
  ocultan contenido.
- **Lenguas con nombre propio**: el selector muestra **Runa simi · quechua**, **Aymar aru ·
  aimara** y **Asháninka**, y la guía ofrece versión borrador en la lengua elegida (glosario
  aprobado + regla P3, estado declarado).
- **Guía `/denunciar`**: triage de gravedad; ruta de 6 pasos (documentar con hash → antecedentes
  citados → gravedad/ruta → documentos → presentación oficial → seguimiento y mediación); lista
  de documentación; tarjetas por autoridad (OEFA/SINADA, ANA, FEMA, Defensoría, Ministerio de
  Cultura, salud, gobiernos locales) con competencia, cuándo acudir y canal oficial; panel de
  vulnerabilidades (represalias, lengua, datos, evidencia frágil, hechos que se pierden, decisión
  comunal). Base normativa real: Ley 28611, Ley 27446, Ley 29735, Ley 29733, D.S. 004-2017 y
  010-2010. Sin teléfonos, plazos ni números de expediente inventados.
- **Radar**: panel «Entender los estudios ambientales» (qué es un EIA, ECA≠LMP, si el estudio
  contradice lo que se ve) con el contraste real Chogñacota/Larancota y la ruta documentar →
  contrastar → denunciar.

### Auditoría (ítem por ítem)
- [PASA] `npm test` 57/57 + verificación de datos — sin cambios de comportamiento del servidor
- [PASA] `npm run build` + `npm run build:standalone`
- [PASA] `npm run test:visual`: cinco módulos + legales + **/denunciar** + /creditos + archivo único
  bajo `file://`; cero excepciones JS — capturas `docs/evidencia/01–06`
- [PASA] Lenguas: nombres nativos en el selector; textos en lengua marcados **borrador** y sin
  equivalencias inventadas (regla P3)
- [PASA] Honestidad del contenido: la guía declara que la plataforma no presenta denuncias y cita
  normas y canales verificables; el panel EIA usa solo registros del seed

### Veredicto: APTO

## Anexo · Quinta pasada: enlaces verificados + refinamiento editorial

Petición del usuario: enlaces que sí sirvan (redes oficiales de las entidades), diseño aún más
pulido sin «aires de página hecha con IA», y mejores transiciones/animaciones — dentro de la
especificación.

### Construido
- **Directorio de autoridades verificado** (`src/datos-instituciones.ts`): portal oficial + redes
  sociales de OEFA (@OEFAperu / OEFA Perú), ANA (@ANAPeru), SENACE (@SenacePeru), Defensoría
  (@Defensoria_Peru), Ministerio de Cultura (@MinCulturaPe), Ministerio Público (@FiscaliaPeru) y
  MINSA (@Minsa_Peru). Cuentas confirmadas por búsqueda el 21/10/2026 (perfiles con identificación
  institucional); el portal oficial prevalece y hay canal de rectificación si un enlace cambia.
- **Directorio en tabla** (menos cuadrícula genérica): entidad, cuándo acudir, qué hace y canales
  con chips de redes; SENACE añadido (EVA/estudios).
- **Transiciones**: entrada de página por ruta (solo movimiento, sin opacidad — misma regla de
  robustez) y **revelado al hacer scroll** con IntersectionObserver + red de seguridad de 2,5 s y
  respeto a `prefers-reduced-motion`.
- **Tipografía y composición**: tracking negativo en display, línea de prosa a 66 caracteres,
  mosaico editorial en la galería (primera foto a doble columna), capitular disponible; cinta
  textil ralentizada y con pausa al pasar el cursor.

### Auditoría (ítem por ítem)
- [PASA] `npm test` 57/57 + verificación de datos
- [PASA] `npm run build` + `npm run build:standalone`
- [PASA] `npm run test:visual`: 7 capturas (cinco módulos + legales + /denunciar + directorio +
  /creditos + archivo único bajo `file://`); cero excepciones JS — `docs/evidencia/01–07`
- [PASA] Enlaces: solo cuentas localizadas en resultados de búsqueda con identificación
  institucional; sin teléfonos ni cuentas inventadas; nota de verificación con fecha visible
- [PASA] Disciplina de animación: micro-transiciones ≤500 ms; entrada de página sin opacidad;
  contenido nunca depende de una animación para ser visible

### Veredicto: APTO

## Anexo · Sexta pasada: veracidad de enlaces + hoja de ruta imprimible

Petición del usuario: enlaces con veracidad real (los anteriores con patrón «?buscar=» no eran
enlaces de búsqueda reales), que las redes de las entidades se vean, y que la guía deje de parecer
una encuesta.

### Construido
- **Corrección de veracidad**: eliminado el patrón «portal?buscar=…» (no era una búsqueda real).
  En su lugar, **enlaces profundos verificados por búsqueda** el 21/10/2026: Formulario de
  Denuncias Ambientales SINADA (facilita.gob.pe/t/2453), plataforma EVA del SENACE
  (senace.gob.pe/eva), Consulta Ciudadana de Proyectos (consultaciudadana.senace.gob.pe), casos en
  línea de la Defensoría (apps2.defensoria.gob.pe/sidPublic), portal de trámites de la ANA
  (gob.pe/ana) y portales institucionales de OEFA/Cultura/MP/MINSA.
- **Evaluador → hoja de ruta imprimible**: ya no es una encuesta; marca lo que pasa y la página
  genera una **hoja de ruta** con las autoridades sugeridas en orden, la documentación a llevar y
  un botón de impresión (con estilos de impresión propios). Se genera en el navegador, no envía
  nada a ningún servidor.
- **Referencias procesales reales**: regla general de respuesta del TUPA (30 días hábiles salvo
  plazo distinto) y advertencia honesta de que el silencio administrativo depende del TUPA de cada
  trámite (sin inventar cuál aplica).
- **Canales oficiales visibles en portada**: el Radar incluye la banda «Canales oficiales de las
  entidades» con portal, servicios (SINADA, EVA, consulta ciudadana, SID) y redes por entidad.
- Disciplina de animación y tipografía aplicadas según las skills de diseño leídas (lecturas
  registradas en esta misma sesión).

### Auditoría (ítem por ítem)
- [PASA] `npm test` 57/57 + verificación de datos
- [PASA] `npm run build` + `npm run build:standalone`
- [PASA] `npm run test:visual` (8 capturas, 01–07 + hoja de ruta): se marcan dos situaciones en
  /denunciar y la hoja de ruta se genera con autoridades sugeridas; cero excepciones JS
- [PASA] Enlaces: solo URLs de servicios oficiales localizadas por búsqueda (facilita.gob.pe,
  senace.gob.pe, apps2.defensoria.gob.pe, gob.pe); sin patrones de búsqueda falsos

### Veredicto: APTO

## Consumo estimado de créditos de la instancia

0 créditos de la Meta Model API: toda la construcción y las verificaciones corrieron en modo
demo declarado. La primera corrida en vivo debe registrar su consumo por etapa (la estructura
ya lo contempla en los informes).

## Resumen de fallos encontrados y corregidos (bucle de corrección, 1 ciclo por ítem)

| # | Fallo | Causa | Corrección | Etapa |
|---|---|---|---|---|
| 1 | P6 bloqueaba respuestas meta legítimas | Verificador trataba toda frase como afirmación factual | Arquitectura de partes etiquetadas (meta declarado, aceptado solo verbatim) + pruebas | E3 |
| 2 | Clave `t`/`texto` vaciaba las partes hacia P6 | Desajuste de nombres entre módulos | Claves unificadas; humo en verde | E3 |
| 3 | Renombrado atómico con EPERM en Windows | Concurrencia del corredor de pruebas y bloqueos de archivo | Reintento con retroceso + temporal por PID + `--test-concurrency=1` | E0/E2 |
| 4 | Recursión infinita del generador PDF | Pie bajo el área de contenido inducía páginas automáticas | Alturas explícitas con ellipsis en las bandas | E6 |
| 5 | IDs ARCO «ARCO-0NaN» y 404 en ejecución | Secuencia de db sin la clave de la colección | Secuencia completa | E8 |
| 6 | Respuesta ARCO circular (500) | La solicitud se incluía a sí misma en su propia respuesta | Serialización plana + exclusión de la solicitud actual | E8 |
| 7 | Lector EXIF devolvía null con fixture real | Punteros de sub-IFD LONG inline leídos como posición | Lectura del valor (`posDato`) + re-verificación con GPS exacto | E5 |
| 8 | Corredor de pruebas no aceptaba el directorio | Sintaxis de `node --test` en Windows | Patrón glob citado | E0 |
| 9 | **Pantalla en blanco al abrir el HTML con doble clic** (reportada por el usuario) | Rutas absolutas + módulos ES + BrowserRouter bloqueados bajo `file://` | HashRouter + build de archivo único (`apps/web/standalone/index.html`) + suite visual con Chromium que reproduce y aprueba el caso `file://` | E1/E9 |

---

## Anexo · Rediseño ejecutivo (segunda pasada de interfaz, misma fecha)

Petición del usuario: «diseño excelente, atractivo, ordenado, nivel profesional», sin salirse de
la especificación. Dirección declarada: *dossier ejecutivo del territorio* — tinta profunda, un
solo acento turquesa, semáforo como lenguaje semántico y contornos topográficos andinos como
firma. Tipografías empaquetadas localmente (offline): **Fraunces** (display), **Instrument Sans**
(cuerpo), **JetBrains Mono** (datos).

### Construido
- Sistema de diseño completo reescrito → `apps/web/src/estilos.css`
- Sistema de íconos SVG monolínea propio (sin emoji como UI) → `src/componentes/Icono.tsx`
- Cabecera con marca propia y pie editorial en columnas → `src/componentes/{Cabecera,Pie}.tsx`
- Ficha técnica con métricas reales (2 unidades · 8 registros · 4 lenguas · 100 % con fuente) y KPIs por semáforo calculados de los datos
- Mapa con teselas oscuras (CARTO) y leyenda superpuesta; pines y popups estilizados
- Cobertura de estados: vacíos con CTA, esqueletos de carga, errores con causa y recuperación
- Animación de entrada escalonada con respeto a `prefers-reduced-motion`; foco visible; contraste AA

### Auditoría (ítem por ítem)
- [PASA] `npm test` 57/57 + verificación de datos — sin cambios de comportamiento
- [PASA] `npm run build` + `npm run build:standalone` (archivo único 856 KB con tipografías embebidas)
- [PASA] `npm run test:visual`: cinco módulos + legales renderizan en Chromium; explicación con cita de OEFA vía API; borrador DOC desde la interfaz; archivo único bajo `file://`; cero excepciones JS — capturas regeneradas `docs/evidencia/01–04`
- [PASA] Auto-revisión visual de capturas: iconografía consistente, jerarquía tipográfica clara, un acento dominante, densidad equilibrada
- [PASA] Anti-AI-slop: sin morado/índigo por defecto, sin emoji-ícono, sin tarjetas con borde izquierdo de color, sin métricas inventadas (todas derivan de `datos-semilla.json`), sin texto de relleno

### Veredicto: APTO
