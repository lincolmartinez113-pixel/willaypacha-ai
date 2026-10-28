# WillayPacha AI
## Declaración de trabajo previo y trabajo en ventana

Preparación previa (antes del 27 de octubre de 2026):
kit de preparación, PROMPT_MAESTRO, datos semilla curados de fuentes
públicas de OEFA y SENACE, y código base generado el 21 de octubre de 2026.

Trabajo en ventana (27 de octubre al 4 de noviembre de 2026):
correcciones del verificador P6 y del explicador-demo, incluidas las
trampas 7 y 8, la consulta general y la reparación de codificación,
con regresión verificada el 27 de octubre de 2026: npm test 61/61
y build correcto. Las integraciones en vivo con Meta, SAM y voz,
y el video demo, se registran en CHANGELOG-VENTANA.md a medida que
se completan, y no se afirman antes de probarse.

**Community environmental monitoring and indigenous justice in Peru** — Meta Global AI Developer Hackathon · Indie track · *Build for Your World*

> **What this is.** WillayPacha AI makes official Peruvian environmental information — today scattered across technical portals, written in legal Spanish, buried in hundred-page PDFs — actually accessible to Quechua, Aymara and Asháninka communities living next to mining units. Every fact shown carries **source, date and literal citation**; every generated text passes a **verifier (P6)** that blocks unsupported claims; every legal document is a **draft** until a licensed professional approves it. The platform never presents a complaint on anyone's behalf: the community decides, the expert answers, the machine prepares.

> **What is real, what is demo, what is validated.** This instance runs in **declared DEMO mode** (no `META_API_KEY`): AI answers are anchored to curated seed data (`data/datos-seed.json`) instead of live Muse Spark calls, and every unavailable capability (live SAM 3.1 segmentation, MMS speech synthesis, Muse Voice transcription) is **declared, never simulated**. The two demo territories are **real, publicly sourced units** (San Rafael/Minsur, Puno — OEFA causality evaluation; San Vicente/SIMSA, Junín — full OEFA procedural chain 2024–2025). Interface text is **Spanish** (complete); Quechua, Aymara and Asháninka packages are **marked as drafts** pending validation by registered speakers/interpreters. The Aymara territory ships **empty with a visible "in preparation" notice** — declaring a gap is stronger than faking one.

**Stack:** React 18 + TypeScript PWA (Vite, offline-first with service worker) · Node/Express backend (the only holder of the API key) · PDFKit documents · Leaflet map · node:test suite including the mandated **10 trap-questions battery** · Meta ecosystem adapters: Muse Spark (chat/completions, OpenAI-compatible), SAM 3.1 (segmentation endpoint), Muse Voice (transcription), MMS / NLLB-200 / Omnilingual ASR for indigenous-language voice (server-side only).

**Run it:**

> **Si al abrir `index.html` con doble clic sale en blanco** — es un límite de los navegadores con `file://`, no del proyecto. Usa la **Opción 1** (archivo único, diseñado exactamente para eso) o la **Opción 2**.

**Opción 1 · Doble clic (sin instalar nada):** abre `apps/web/standalone/index.html` — un único archivo HTML con toda la app embebida y rutas hash, verificado renderizando bajo `file://` (`npm run test:visual`, capturas en `docs/evidencia/`). Sin backend, el Radar y las páginas legales funcionan completos; el asistente declara que el servidor no responde.

**Opción 2 · Desarrollo completo (recomendada):**

```bash
npm install
npm test              # data verifier (fails build on missing source/date/citation) + 57 tests
npm run dev:server    # backend on :8787 (demo mode without META_API_KEY)
npm run dev:web       # frontend on :5173 (proxies /api)
```

**Opción 3 · Build de producción:** `npm run build` + `npx vite preview --config apps/web/vite.config.ts` (o `npm run build:standalone` para regenerar el archivo único).

Set `META_API_KEY` in `.env` (see `.env.example`) to switch the engine to live Meta Model API calls under the same verifier. The build agent this project was generated for, and its full construction protocol (10 staged audits, E0–E9), are documented in [`PROMPT_MAESTRO.md`](PROMPT_MAESTRO.md) and [`docs/auditorias/INFORME-ETAPAS.md`](docs/auditorias/INFORME-ETAPAS.md).

---

# WillayPacha AI (español)

**Monitoreo ambiental comunitario y justicia indígena en el Perú.** WillayPacha AI pone la información ambiental oficial del Estado peruano —hoy dispersa en portales técnicos, en español jurídico y en PDFs de cientos de páginas— al alcance real de las comunidades campesinas y nativas que viven junto a las unidades mineras. Toma los documentos públicos de OEFA, SENACE y ANA, los ordena por unidad minera y cuerpo de agua, los contrasta con la normativa (ECA y LMP, correctamente distinguidas), los explica por voz y texto en español, quechua, aimara y asháninka, recibe los casos de las comunidades con evidencia verificada, y genera documentos técnico-legales en borrador que solo valen cuando un experto colegiado los revisa y aprueba.

**La regla de oro:** ningún dato se muestra sin fuente, fecha y cita; ningún texto generado se publica sin pasar por el verificador; ningún documento sale sin revisión experta; ninguna etapa se da por terminada sin auditoría registrada. En un dominio donde una afirmación falsa puede dañar a una comunidad, la trazabilidad no es un adorno: es el producto.

## Qué es real, qué es demo, qué está validado

- **Datos reales:** los dos territorios de la demo usan hallazgos públicos verificados — San Rafael (Minsur): Quebrada Chogñacota con superación de ECA atribuida al efluente P-4, Microcuenca Larancota sin hallazgo, sedimentos de origen natural, comunidades hidrobiológicas variables; San Vicente (SIMSA): las tres resoluciones de OEFA 2024–2025 (medidas preventivas → reconsideración parcial → tribunal). Valores LMP dígito a dígito del D.S. N.° 010-2010-MINAM, comprobados por script.
- **Declarado como demo:** sin `META_API_KEY`, las respuestas de IA provienen del explicador demo anclado a los registros (pasando igual por el verificador P6); la segmentación es una heurística local de color declarada (NO es SAM 3.1); la voz sintética y la transcripción en vivo se declaran no disponibles (nunca se simulan).
- **Pendiente de validación (y así se etiqueta):** los paquetes quechua/aimara/asháninka y el glosario (`i18n/glosario.json`) están en estado borrador hasta validación por hablantes o intérpretes registrados. El asháninka de NLLB-200 **no existe**: su ruta es glosario + P3 + P6. El territorio aimara (Altiplano Sur) se muestra vacío con su leyenda «en preparación».
- **Pendiente de adjuntar:** páginas exactas de citas y hashes SHA-256 de los documentos primarios; el sistema los declara pendientes en vez de fabricarlos.

## Los cinco módulos

| Módulo | Qué hace | Verificación |
|---|---|---|
| **A · Radar de Transparencia** | Mapa de las unidades, tabla «lo que dice la fuente vs. lo que vive la comunidad» con semáforo (ícono + texto, nunca solo color), línea de tiempo de fiscalización, normas ECA/LMP, bitácora y canal de rectificación | Cada fila abre su fuente primaria; script exige fuente+fecha+cita en el 100 % |
| **B · Asistente Rimay** | Voz y texto en 4 lenguas; respuestas bilingües con estado de traducción; se presenta como IA; sin asesoría legal ni diagnósticos | Batería de 10 preguntas trampa en negativa correcta; glosario sin inventar equivalencias |
| **C · Laboratorio de Evidencia** | Huella SHA-256 en el dispositivo, metadatos EXIF con opción de ocultarlos, delimitación de área visual anómala, Lámina exportable con leyenda obligatoria | Hash verificable; prohibido decir «contaminación detectada»; borrar la foto borra la lámina |
| **D · Documentos y Expertos** | Acta bilingüe, Informe Técnico (tabla LMP citada), Denuncia SINADA/solicitud ANA; franja de borrador en cada página; flujo con bitácora; PDF final bloqueado hasta aprobación con colegiatura CIP/CAL | Transiciones de estado probadas; sin firmas ni fechas de presentación; Registro de Generación en el pie |
| **E · Casos de la Comunidad** | Registro con consentimiento (Ley 29733) e identidad reservada; evidencia con cadena de custodia; filtro de cinco pasos; publicación con leyenda de alcance; retiro con borrado efectivo | Pruebas adversariales: duplicados, menores, dos revisores, retiro verificado, acceso denegado sin rol |
| **Denunciar · Guía práctica** | Ruta completa: qué documentar, qué documentos se piden, ante qué autoridad según el hecho (OEFA/SINADA, ANA, FEMA, Defensoría, Cultura, salud), cómo presentar, seguir y mediar; vulnerabilidades y protección; triage de gravedad; versión borrador en lengua originaria | Contenido con base normativa citada (Ley 28611, 27446, 29735, 29733, D.S. 004-2017/010-2010); canales oficiales verificables; sin teléfonos ni plazos inventados |

## Verificación (protocolo del proyecto)

```bash
npm test                 # verificador de datos + 57 pruebas node:test
npm run verificar-datos  # falla si falta fuente/fecha/cita/confianza; LMP dígito a dígito
node tools/smoke.mjs     # prueba de humo del motor (explicar + trampas)
node tools/smoke-web.mjs # prueba HTTP de la app construida y del API
```

Los informes de auditoría por etapa (E0–E9, con evidencia y veredicto ítem por ítem) están en
`docs/auditorias/INFORME-ETAPAS.md`. La estructura del repositorio, las skills de agente y las
automatizaciones de CI están documentadas en `PROMPT_MAESTRO.md` (Anexos).

## Licencias y terceros

Modelos de Meta usados en la capa de lenguas: MMS (`facebook/mms-tts-quz|ayr|cni`, CC-BY-NC 4.0), NLLB-200 (CC-BY-NC 4.0, solo quy/ayr), Omnilingual ASR (Apache 2.0). SeamlessM4T queda **descartado** (su lista oficial no incluye estas lenguas). Detalle completo en [`TERCEROS.md`](TERCEROS.md).

---

*WillayPacha AI — «willay» (informar, en quechua) + «pacha» (tiempo/territorio). Informar el territorio, con fuente.*
