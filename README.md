# WillayPacha AI

## Declaración obligatoria: preparación previa vs. trabajo del hackathon

El kit, el PROMPT y los datos son preparación previa; solo el código con commits del 27 de octubre al 4 de noviembre es trabajo del hackathon.

---

# ESPAÑOL

## 1. Qué hace WillayPacha AI

WillayPacha AI acerca información ambiental oficial del Perú (OEFA, SENACE) a comunidades junto a unidades mineras: ordena documentos públicos por unidad minera, distingue ECA de LMP, explica por texto y voz en español con fuente, fecha y cita literal, y genera una ficha PDF en borrador por registro verificado. Ningún texto generado se muestra sin pasar por el verificador P6; ningún documento vale sin revisión experta.

## 2. Unidades demo

Dos unidades reales con datos semilla públicos curados (`data/datos-semilla.json`):

- **San Rafael — Minsur S.A.** (Puno). Unidad `san-rafael`: Nueva Acumulación Quenamari – San Rafael.
- **San Vicente — SIMSA** (Junín). Unidad `san-vicente`: Compañía Minera San Ignacio de Morococha S.A.A. (SIMSA).

## 3. Cómo correrlo en local

Comandos reales de `package.json` (no hay otros; no usar `npm start` ni `npm run dev`, que no existen):

```bash
npm install
npm test                 # node tools/verificar-datos.mjs && node --test --test-concurrency=1 "server/tests/*.test.js"
npm run verificar-datos  # node tools/verificar-datos.mjs
npm run dev:server       # node server/index.js (backend en :8787 según PORT)
npm run dev:web          # vite --config apps/web/vite.config.ts (Vite muestra la URL al arrancar)
npm run build            # tsc --noEmit -p apps/web && vite build --config apps/web/vite.config.ts
npm run build:standalone # vite build --config apps/web/vite.config.standalone.ts
npm run test:visual      # node tools/verificar-visual.mjs
```

Sin `META_API_KEY` en `.env` (ver `.env.example`) el sistema corre en modo demo declarado: respuestas ancladas a los datos semilla, sin llamadas en vivo. Con la clave, usa la Meta Model API bajo el mismo verificador P6.

## 4. Estado verificado

- **Rimay en vivo con `muse-spark-1.3` y verificación P6.** La ruta en vivo (`server/api/explicador.js`) llama al modelo configurado en `META_MODEL` (por defecto `muse-spark-1.3`) y verifica el texto con P6 en código antes de mostrarlo; lo bloqueado no se muestra (se responde con el explicador demo declarado).
- **Voz del navegador solo en español; lenguas originarias declaradas no disponibles sin MMS.** La app usa Web Speech API (`apps/web/src/paginas/Rimay.tsx`, reconocimiento `es-PE`); si el navegador no trae voz de la lengua o la síntesis MMS del servidor no está habilitada (`IDIOMAS_TTS_HABILITADO=false` por defecto, sin checkpoints en `server/idiomas/`), la interfaz lo declara y no simula audio.
- **Ficha PDF por registro verificado, con revisión experta PENDIENTE.** Cada ficha (`server/pdf/ficha-registro.js`) resume un solo registro y pasa por P6 antes de entrar al PDF: si P6 bloquea, no hay PDF (422 declarado); si el registro no existe, 404 declarado. El bloque de revisión experta va vacío y pendiente: sin firma, sin nombre, sin colegiatura, sin fecha de revisión inventada.
- **SAM 3.1 en vivo.** El endpoint de prueba (`server/api/sam-prueba.js`) llama `POST {META_API_BASE}/responses` con modelo `sam-3.1`, imagen y prompt fijados del proyecto; sin `META_API_KEY` responde 503 declarado y nunca inventa geometría.
- **WhatsApp no implementado.** No disponible en esta demo; no se presenta como hecho.

---

# ENGLISH

## Mandatory declaration: prior preparation vs. hackathon work

The kit, the PROMPT, and the data are prior preparation; only code with commits from October 27 to November 4 is hackathon work.

## 1. What WillayPacha AI does

WillayPacha AI brings official Peruvian environmental information (OEFA, SENACE) to communities next to mining units: it organizes public documents per mining unit, distinguishes ECA from LMP, explains by text and Spanish voice with source, date, and literal citation, and generates one draft PDF fiche per verified record. No generated text is shown without passing the P6 verifier; no document is valid without expert review.

## 2. Demo units

Two real units with curated public seed data (`data/datos-semilla.json`):

- **San Rafael — Minsur S.A.** (Puno). Unit `san-rafael`: Nueva Acumulación Quenamari – San Rafael.
- **San Vicente — SIMSA** (Junín). Unit `san-vicente`: Compañía Minera San Ignacio de Morococha S.A.A. (SIMSA).

## 3. How to run it locally

Real commands from `package.json` (there are no others; do not use `npm start` or `npm run dev`, which do not exist):

```bash
npm install
npm test                 # node tools/verificar-datos.mjs && node --test --test-concurrency=1 "server/tests/*.test.js"
npm run verificar-datos  # node tools/verificar-datos.mjs
npm run dev:server       # node server/index.js (backend on :8787 per PORT)
npm run dev:web          # vite --config apps/web/vite.config.ts (Vite prints the URL on start)
npm run build            # tsc --noEmit -p apps/web && vite build --config apps/web/vite.config.ts
npm run build:standalone # vite build --config apps/web/vite.config.standalone.ts
npm run test:visual      # node tools/verificar-visual.mjs
```

Without `META_API_KEY` in `.env` (see `.env.example`) the system runs in declared demo mode: answers anchored to the seed data, no live calls. With the key, it uses the Meta Model API under the same P6 verifier.

## 4. Verified status

- **Rimay live with `muse-spark-1.3` and P6 verification.** The live path (`server/api/explicador.js`) calls the model from `META_MODEL` (default `muse-spark-1.3`) and verifies the text with P6 in code before showing it; blocked text is never shown (a declared demo-explainer answer is returned instead).
- **Browser voice in Spanish only; indigenous languages declared unavailable without MMS.** The app uses the Web Speech API (`apps/web/src/paginas/Rimay.tsx`, recognition `es-PE`); if the browser has no voice for the language or server MMS synthesis is not enabled (`IDIOMAS_TTS_HABILITADO=false` by default, no checkpoints in `server/idiomas/`), the UI declares it and never fakes audio.
- **PDF fiche per verified record, with expert review PENDING.** Each fiche (`server/pdf/ficha-registro.js`) summarizes a single record and passes P6 before entering the PDF: if P6 blocks, no PDF is produced (declared 422); if the record does not exist, declared 404. The expert-review block is empty and pending: no signature, no name, no license number, no invented review date.
- **SAM 3.1 live.** The test endpoint (`server/api/sam-prueba.js`) calls `POST {META_API_BASE}/responses` with model `sam-3.1`, fixed project image and prompt; without `META_API_KEY` it returns a declared 503 and never invents geometry.
- **WhatsApp not implemented.** Not available in this demo; not presented as done.
