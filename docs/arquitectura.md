# Arquitectura — WillayPacha AI

## Principio rector

Cada capacidad del ecosistema de Meta tiene un trabajo real dentro del sistema, y ninguna
capacidad crítica depende de un proveedor ajeno. El navegador **nunca** conoce la clave de API:
el backend es su único poseedor.

## Piezas de Meta y su trabajo exacto

| Pieza | Trabajo | Dónde vive |
|---|---|---|
| Muse Spark | Motor técnico-legal (contraste ECA/LMP), multilingüe y redactor de borradores — siempre encadenado al verificador P6 | `server/api/meta-client.js` (OpenAI-compatible: `POST {apiBase}/chat/completions`) |
| Muse Voice | Transcripción de reportes y consultas habladas | Adapter en servidor; respaldo Web Speech API declarado |
| SAM 3.1 | Segmentación de fotografías de campo | `POST /api/segment`; sin clave: heurística local declarada en el cliente |
| Muse Image | Infografías educativas (previsto) | — |
| MMS / Omnilingual ASR / NLLB-200 | Capa de lenguas (TTS/ASR/traducción), solo servidor | `server/idiomas/` + `skills/lenguas-originarias-meta` |

## Flujo de información de punta a punta

```
Documento oficial ──curaduría humana──▶ datos-semilla.json (cita + hash pendiente)
        │                                       │
        ▼                                       ▼
   P1 extractor  ──candidatos──▶ humano verifica (semáforo, confianza)
                                        │
        ┌───────────────────────────────┤
        ▼                               ▼
   P2/P3 explicadores            Radar / Documentos (P5)
        │                               │
        └──────────▶ P6 verificador ◀───┘
                        │
              una afirmación no soportada = bloqueo de la salida completa

Observación ciudadana (web/WhatsApp) ──▶ P4 ──▶ filtro de 5 pasos ──▶ publicación con leyenda
```

## Decisiones deliberadas

1. **Backend como único poseedor de la clave**: protege créditos y evita exposición en el cliente.
2. **Offline-first**: la PWA empaqueta los datos semilla y un service worker; los dos casos
   precargados funcionan sin red (la demo rural y la demo del jurado comparten restricción).
3. **Modo demo declarado**: sin `META_API_KEY`, el explicador compone respuestas desde los
   registros verificados y pasa igualmente por el verificador P6. Ante un 402 en vivo, el
   protocolo ordena detenerse y reportar (nunca cambiar de proveedor).
4. **Verificador doble**: el prompt P6 (en vivo) y su implementación en código
   (`server/api/verificador.js`) con reglas idénticas: cifras, vocabulario controlado,
   causalidad, atribución y anclaje textual. Las frases meta del sistema se declaran y se
   aceptan solo verbatim; todo lo demás pasa por los controles estrictos.
5. **Persistencia simple y auditable**: `server/db.json` (bitácora, estados) + evidencias
   nombradas por su hash SHA-256; borrado efectivo = eliminación de ficha, archivos y
   transcripciones con evento anónimo en la bitácora global.
6. **PDF con franja por página**: `doc.on('pageAdded')` dibuja la franja y el Registro de
   Generación en cada página; el texto de banda usa altura explícita para no inducir páginas.

## Módulos ↔ archivos

| Módulo | Frontend | Backend |
|---|---|---|
| A Radar | `src/paginas/Radar.tsx` | `data/datos-semilla.json`, `/api/registros`, `/api/bitacora/:id`, `/api/rectificaciones` |
| B Rimay | `src/paginas/Rimay.tsx` | `/api/explicar` (P2/P3→P6), `/api/voz/*`, `/api/idiomas/*` |
| C Evidencia | `src/paginas/Evidencia.tsx` + `src/lib/{hash,exif,segmentacion}.ts` | `/api/segment` |
| D Documentos | `src/paginas/Documentos.tsx` | `/api/documentos*`, `server/pdf/generador.js` (P5) |
| E Casos | `src/paginas/Casos.tsx` | `/api/casos*`, `server/db.js` |
| Legal | `src/paginas/Legal.tsx` + `src/legal/contenidos.ts` | — |
| ARCO | (vía seguimiento/retiro + endpoint) | `/api/arco/*` |
| WhatsApp | — | `server/whatsapp/index.js` (deshabilitado sin credenciales) |
