# PROMPT_MAESTRO — WillayPacha AI

> Especificación técnica autocontenida del sistema, versionada en el repositorio.
> Este archivo gobierna la construcción; sus reglas se aplican también al propio repositorio.
> Versión 1.0 · derivada del informe de preparación del 20/10/2026 (50 pp.).

## 0. Regla de oro (inviolable)

1. Ningún dato se muestra sin **fuente, fecha y cita**.
2. Ningún texto generado llega a la interfaz sin pasar por el **verificador P6**.
3. Ningún documento sale sin **revisión experta**; el PDF final requiere nombre y colegiatura (CIP/CAL).
4. Ninguna capacidad no disponible se **simula**: se declara.
5. Ninguna etapa se da por terminada sin **auditoría registrada con evidencia**.

## 1. Alcance cerrado

- **Unidad A — Nueva Acumulación Quenamari · San Rafael (Minsur S.A.)**: estaño, Antauta (Melgar, Puno), 4 500–5 200 m s. n. m., comunidad de Queracucho, cuenca del Ramis. Base documental: Evaluación ambiental de causalidad de OEFA (agua superficial, subterránea, sedimentos, comunidades hidrobiológicas) + trámite de modificación del EIA ante SENACE (EVA).
- **Unidad B — San Vicente (SIMSA)**: zinc-plomo, Vitoc (Chanchamayo, Junín), ceja de selva, contexto asháninka del Perené. Base documental: cadena procesal OEFA 2024–2025 (Res. 0190-2024-OEFA/DSEM; Res. 00157-2025-OEFA/DSEM; Res. 578-2025-OEFA/TFA-SE).
- **Territorio C — Altiplano Sur (aimara)**: presente en interfaz y glosario, **sin datos**, con leyenda «Territorio en preparación: datos en carga y validación». No se inventan casos.

## 2. Arquitectura

- PWA React + TypeScript (`apps/web`), modo oscuro profesional, offline-first (service worker + datos semilla empaquetados).
- Backend Node/Express (`server/`): único poseedor de la clave de API; rutas `/api/*`; generación de PDF (`server/pdf`); capa de idiomas (`server/idiomas`); persistencia JSON con bitácora (`server/db.js`).
- Datos curados a mano (`data/datos-semilla.json`), verificados por `tools/verificar-datos.mjs` (falla la construcción si falta un campo obligatorio o si un valor LMP no coincide dígito a dígito).
- Cadena de prompts versionada (`server/prompts/P1…P6`), con hash de versión expuesto en el Registro de Generación.

## 3. Los cinco módulos

### A · Radar de Transparencia
Selector de territorio (A, B, C-en-preparación) → mapa Leaflet con unidad, componentes (bocaminas, relaveras, puntos de vertimiento), cuerpos de agua y comunidad; tabla de contraste con cita literal, fuente enlazada, semáforo con **ícono + texto**; línea de tiempo de fiscalización; normas ECA/LMP correctamente distinguidas (un efluente contra LMP; el cuerpo receptor contra ECA, en la categoría y norma que la fuente citó); bitácora pública por registro y canal de rectificación para terceros.

Criterio de aceptación: 100 % de los registros visibles con fuente, fecha, cita, semáforo y confianza; toda fila abre su fuente primaria; Territorio C sin datos y con leyenda; coordenadas marcadas como aproximadas.

### B · Asistente de voz «Rimay»
Micrófono con visualizador de ondas, selector de lengua (es/qu/ay/ash), consultas rápidas, respuesta bilingüe con estado de traducción visible. Se presenta como IA al abrir la sesión; declara alcances y límites; no da asesoría legal ni diagnósticos; deriva a las instancias competentes. Entrada de voz: Web Speech API como respaldo declarado (Muse Voice/Omnilingual cuando el servidor tenga clave). Salida de voz: MMS en servidor o declaración de indisponibilidad; cada audio se etiqueta «voz sintética — modelo MMS de Meta».

### C · Laboratorio de Evidencia
Carga de foto → SHA-256 en el cliente (visible en ficha) → metadatos EXIF (fecha, cámara, GPS) con opción de ocultarlos en vistas públicas → delimitación de área visual anómala (SAM 3.1 si hay clave; si no, heurística local **declarada**) → porcentaje del área → **Lámina de Apoyo Visual** exportable con imagen original, máscara, porcentaje, fecha, hash y leyenda obligatoria. Prohibido en toda la interfaz: «contaminación detectada».

### D · Generador Legal y Bandeja de Expertos
Tres documentos: Acta de Asamblea Comunal bilingüe; Informe Técnico Preliminar de contraste ECA/LMP (tabla LMP citada); Denuncia Ambiental SINADA/OEFA o solicitud de verificación ANA. Franja de borrador en **cada página**; sin firma; sin fecha de presentación; sin afirmaciones de delito; marcadores `[COMPLETAR: …]`. Flujo: Borrador IA → En revisión → Aprobado (exige nombre + colegiatura CIP/CAL) / Observado (vuelve a borrador con observaciones). Bitácora por transición. PDF final bloqueado hasta aprobación. Registro de Generación impreso en el pie.

### E · Casos de la Comunidad
Registro con consentimiento informado (Ley N.° 29733 y D.S. N.° 016-2024-JUS), identidad reservada opcional, evidencia con hash y cadena de custodia versionada, consistencia automática como asistente del filtro (nunca juez), dos revisores humanos (uno ambiental o legal), publicación con leyenda:

> «La plataforma verificó la autenticidad e integridad de la evidencia. Esto no afirma que hubo contaminación: eso lo determina OEFA o un laboratorio acreditado.»

Reglas duras: sin menores identificables; sin ubicación exacta de viviendas; sin datos individuales de salud; retiro permanente con borrado efectivo (ficha + evidencias + transcripciones).

### Guía de denuncia (contenido informativo, no un sexto módulo)
Página `/denunciar`: ruta práctica desde la observación hasta la denuncia presentada — documentación requerida, autoridad competente según el hecho (OEFA/SINADA, ANA, FEMA, Defensoría, Ministerio de Cultura, salud, gobiernos locales), presentación por canales oficiales, seguimiento y mediación, y vulnerabilidades/protección (identidad reservada, intérprete registrado Ley N.° 29735, datos personales). Incluye un triage de gravedad y versiones en lengua originaria en estado **borrador** (glosario + regla P3). La plataforma no presenta denuncias: prepara antecedentes y borradores.

## 4. Ingeniería de prompts

| Prompt | Trabajo | Prohibiciones |
|---|---|---|
| P1 extractor | Documento → registros candidatos JSON (hecho, fecha, cuerpo, parámetro, estándar, cita ≤40 palabras, página) | Inferir causas, responsables o salud; rellenar huecos |
| P2 explicador ES | Registro verificado → español simple ≤90 palabras con fuente al cierre | Cifras fuera del registro; diagnósticos; asesoría legal |
| P3 explicador lengua | Explicación → qu/ay/ash con glosario aprobado | Inventar equivalencias; afirmar variedad local exacta; ocultar estado borrador |
| P4 estructurador | Audio/reporte → ficha de observación ciudadana | Evaluar veracidad; introducir «contaminación»; inventar coordenadas |
| P5 generador | Fichas → documentos borrador | Firmar; fechar presentaciones; afirmar delitos |
| P6 verificador | Texto + fuentes → afirmación por afirmación (soportada/parcial/no soportada) | Dejar pasar una sola afirmación no soportada |

**Encadenamiento inviolable:** P1 → (humano verifica) → P2/P3 → **P6** → interfaz; P5 → **P6** → documento. El verificador está implementado también como código (`server/api/verificador.js`) y corre en toda salida, incluso en modo demo.

## 5. Lenguas (capa Meta)

- TTS: `facebook/mms-tts-quz` (quechua Cusco), `-ayr` (aimara central), `-cni` (asháninka general) — CC-BY-NC 4.0, **solo servidor**, etiqueta obligatoria de voz sintética.
- ASR: Omnilingual ASR (Apache 2.0; confirmar código de la lengua en su lista oficial) o `facebook/mms-1b-all` + adaptador; respaldo Web Speech API declarado.
- Traducción: NLLB-200 `quy_Latn` (Ayacucho) y `ayr_Latn` — CC-BY-NC 4.0. **Asháninka no está cubierto**: ruta glosario + P3 + P6.
- SeamlessM4T: **descartado** (su lista oficial no incluye estas lenguas).
- Glosario (`i18n/glosario.json`): solo términos con valor, estado (`borrador|validado`) y quién los respalda. Nada fuera del glosario se traduce: permanece en español entre paréntesis.

## 6. Blindaje legal

1. **Atribución obligatoria** («según…», «mediante Resolución…»): un hecho sin atribución es bloqueado por P6.
2. **Vocabulario controlado**: prohibido «contaminó», «culpable», «delito», «corrupto» si la fuente no lo usa; se usa el lenguaje de los actos (hallazgo, superación reportada, medida preventiva, procedimiento en curso) y se muestra el **estado procesal con fecha**.
3. **El semáforo evalúa documentos, no empresas**; sin notas ni rankings.
4. **Rectificación y simetría**: canal para terceros, bitácora pública por registro, actualización con la misma visibilidad.
5. **Documentos limitados**: borrador con franja, sin firma, sin fecha de presentación, aprobación experta identificada, nunca envío por la plataforma.

## 7. Privacidad

Seis páginas legales reales (`apps/web/src/legal/contenidos.ts`): Privacidad, Términos, Aviso Legal, Contenido y Moderación, Seguridad, Transparencia de IA — con resumen en lenguaje simple y versiones en lenguas originarias marcadas como borrador. Derechos ARCO con vía directa (`/api/arco/*`) y prueba de borrado efectivo en la suite. Reporte de incidentes: autoridad y afectados, en principio dentro de 48 horas.

## 8. Protocolo de construcción por etapas (E0–E9)

Cada etapa: construir → **parar** → auditar (lista propia + regresión + transversales) → informe con evidencia por ítem → bucle de corrección (máx. 3 ciclos) → veredicto APTO / NO APTO / BLOQUEADO.

| Etapa | Foco | Auditoría clave |
|---|---|---|
| E0 | Reglas, créditos, repositorio, entorno | Sin secretos; `.env` ignorado; llamada de prueba o 402 reportado |
| E1 | Esqueleto y diseño base | 5 rutas sin pantallas en blanco; contraste; responsive |
| E2 | Datos y Radar | 100 % fuente/fecha/cita por script; LMP dígito a dígito; C sin datos |
| E3 | Motor IA y prompts P1–P6 | 10 trampas en negativa correcta, incluida inyección; clave solo en servidor |
| E4 | Voz e idiomas | Se presenta como IA; estados de borrador visibles; sin voz simulada |
| E5 | Evidencia | Hash coincide con herramienta externa; leyenda en lámina; prohibido «contaminación detectada» |
| E6 | Documentos y expertos | Franja en toda página; PDF final bloqueado; sin firmas |
| E7 | Casos y filtro | Adversarial: sin rol, duplicados, menores, retiro con borrado |
| E8 | Legal, privacidad, seguridad | Sin texto de plantilla; ARCO probado; secretos escaneados |
| E9 | Cierre y entrega | Demo 3 veces; offline; entregables verificados con margen |

El informe de cada etapa se escribe en `docs/auditorias/` con el formato fijo: Construido / Auditoría ítem por ítem / Regresión / Fallos y correcciones / Consumo / Veredicto.

## 9. Estructura del repositorio

```
willaypacha-ai/
├─ README.md               (EN primero, ES debajo; qué es real y qué es demo)
├─ PROMPT_MAESTRO.md       (esta especificación, versionada)
├─ TERCEROS.md             (librerías, datos, modelos: origen y licencia)
├─ .env.example            (sin valores)
├─ apps/web/               (PWA React + TypeScript)
├─ server/                 (api, prompts, pdf, idiomas, whatsapp; único con la clave)
├─ data/                   (datos-semilla.json + método de curaduría)
├─ i18n/                   (es/qu/ay/ash + glosario)
├─ skills/                 (verificar-fuente, explicar-en-lengua, generar-expediente,
│                           auditar-demo, lenguas-originarias-meta)
├─ tools/                  (verificación de datos, humo, fixtures)
├─ .github/workflows/      (ci.yml, verificar-datos.yml, demo-smoke.yml)
└─ docs/                   (arquitectura, guion de video, auditorías)
```

## 10. Criterios de terminado (definición de «hecho»)

- `npm test` en verde: verificador de datos + 10/10 trampas + flujos de documentos, casos, ARCO e idiomas.
- `npm run build` sin errores de tipos ni de empaquetado.
- Cero secretos en el repositorio; `.env` fuera de control de versiones.
- Toda capacidad no disponible, declarada en `/api/salud` y en la interfaz.
- Informe de auditoría con evidencia por ítem y veredicto honesto (APTO / NO APTO / BLOQUEADO).
