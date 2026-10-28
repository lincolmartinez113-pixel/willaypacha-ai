---
name: lenguas-originarias-meta
description: Usar SOLO la capa de lenguas originarias de Meta (MMS, Omnilingual ASR, NLLB-200) para voz y traducción quechua/aimara/asháninka en WillayPacha AI, con sus checkpoints verificados, licencias y límites de variedad.
---

# Skill: Lenguas originarias con modelos de Meta

## Cuándo usarla
Toda vez que el sistema necesite: leer en voz alta un texto en quechua,
aimara o asháninka (TTS); transcribir un audio en esas lenguas (ASR); o
apoyar una traducción de texto ES ↔ lengua originaria.

## Modelos designados (verificados en sus fichas oficiales, oct 2026)
| Necesidad | Modelo de Meta | Checkpoint / código | Licencia |
|---|---|---|---|
| TTS quechua | MMS (Massively Multilingual Speech) | `facebook/mms-tts-quz` (Quechua, Cusco) | CC-BY-NC 4.0 |
| TTS aimara | MMS | `facebook/mms-tts-ayr` (Aymara, Central) | CC-BY-NC 4.0 |
| TTS asháninka | MMS | `facebook/mms-tts-cni` (Asháninka) | CC-BY-NC 4.0 |
| ASR 1 600+ lenguas | Omnilingual ASR (2025) | confirmar código en su lista oficial antes de usar | Apache 2.0 |
| ASR respaldo | MMS | `facebook/mms-1b-all` + adaptador por lengua | CC-BY-NC 4.0 |
| Traducción texto QU/AY | NLLB-200 | `quy_Latn` (quechua Ayacucho) · `ayr_Latn` (aimara) | CC-BY-NC 4.0 |
| Traducción texto ASH | **NLLB-200 NO lo cubre** | ruta: Muse Spark + glosario validado (P3) | — |

**No usar SeamlessM4T para estas lenguas**: su lista oficial (101 lenguas
de entrada de voz) no incluye quechua, aimara ni asháninka.

## Procedimiento
1. Confirmar el checkpoint/código en la ficha oficial del modelo
   (Hugging Face / repo de Meta) y registrar la confirmación en el
   informe de la etapa. Si el código no aparece, NO asumir cobertura:
   usar el respaldo de la tabla o declarar la lengua sin esa función.
2. TTS vía Hugging Face Transformers (`VitsModel`, `AutoTokenizer`),
   ejecutado en el servidor (`server/idiomas/`), nunca en el navegador.
3. Toda salida de traducción (NLLB o Spark) entra como `borrador` y pasa
   por P3 (glosario) + P6 (verificador) antes de mostrarse.
4. Etiquetar cada audio en la interfaz: "voz sintética — modelo MMS de
   Meta" (u Omnilingual según el motor). Nunca presentarla como voz de
   un hablante nativo.
5. Registrar en `TERCEROS.md`: modelo, checkpoint, licencia y uso.

## Límites que hay que declarar, no esconder
- Variedades: `quz` = quechua del Cusco (referencia para el Cusco-Collao
  de Puno, no idéntico); `cni` = asháninka general (la comunidad es del
  Perené); `quy_Latn` de NLLB = quechua de Ayacucho. La validación por
  hablantes sigue siendo obligatoria.
- Calidad: son modelos de investigación entrenados con corpus limitados
  (en MMS, en gran parte lecturas grabadas); la inteligibilidad se prueba
  con hablantes antes de cualquier uso público serio.
- Licencia CC-BY-NC: MMS y NLLB-200 no permiten uso comercial; un futuro
  despliegue comercial exige otra ruta o licencia. Omnilingual ASR
  (Apache 2.0) no tiene esa restricción.
