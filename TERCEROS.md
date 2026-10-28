# TERCEROS — librerías, datos, modelos e imágenes

Declaración de uso de software y datos de terceros, conforme a las reglas del evento y a la
disciplina del proyecto: **todo lo que no es propio se declara aquí con su licencia y su uso.**

## 1. Modelos de IA (ecosistema Meta)

| Modelo | Uso en el proyecto | Licencia | Notas |
|---|---|---|---|
| Muse Spark (Meta Model API, `https://api.meta.ai/v1`, SDK compatible con OpenAI) | Motor técnico-legal, multilingüe y redactor de borradores (P2/P3/P5), bajo verificación P6 | Términos de la Meta Model API | Requiere `META_API_KEY`. Sin clave, el sistema corre en modo demo declarado. Prohibido sustituir el proveedor (regla del evento) |
| Muse Voice (Meta Model API) | Transcripción de audios y consultas habladas | Términos de la Meta Model API | Adapter en `server/api/rutas-core.js`; no disponible sin clave (declarado) |
| SAM 3.1 (Meta Model API) | Segmentación de fotografías de campo | Términos de la Meta Model API | Sin clave: heurística local **declarada**, que no es SAM 3.1 |
| Muse Image (Meta Model API) | Infografías educativas para asambleas (previsto) | Términos de la Meta Model API | No usado en esta instancia; se declara como previsto |
| MMS — `facebook/mms-tts-quz` (quechua Cusco), `facebook/mms-tts-ayr` (aimara central), `facebook/mms-tts-cni` (asháninka) | Síntesis de voz en lenguas originarias, solo en servidor | **CC-BY-NC 4.0** (no comercial) | Checkpoints verificados en Hugging Face; variedades declaradas en la interfaz |
| Omnilingual ASR (Meta AI, 2025) | Transcripción preferida en lenguas originarias | **Apache 2.0** | Código de la lengua a confirmar en la lista oficial antes de usar |
| `facebook/mms-1b-all` + adaptadores | Transcripción de respaldo | CC-BY-NC 4.0 | — |
| NLLB-200 (`quy_Latn`, `ayr_Latn`) | Traducción de texto quechua/aimara como borrador | CC-BY-NC 4.0 | **No cubre asháninka**: esa lengua va por glosario + P3 + P6 |
| SeamlessM4T v2 | **Descartado** | — | Su lista oficial (101 lenguas de entrada de voz) no incluye quechua, aimara ni asháninka |

> Licencias CC-BY-NC 4.0: aptas para este proyecto sin fines de lucro y de investigación. Un
> despliegue comercial futuro exigiría otra ruta o licencia. Omnilingual ASR (Apache 2.0) no
> tiene esa restricción.

## 2. Librerías de software

| Paquete | Uso | Licencia |
|---|---|---|
| React, React DOM | Interfaz | MIT |
| react-router-dom | Rutas de los cinco módulos y páginas legales | MIT |
| Leaflet | Mapa de unidades y componentes | BSD-2-Clause |
| Vite, @vitejs/plugin-react | Construcción del frontend | MIT |
| TypeScript | Tipado del frontend | Apache 2.0 |
| Express | Servidor HTTP | MIT |
| cors | CORS del API | MIT |
| multer | Carga de evidencias | MIT |
| PDFKit | Generación de PDF con franja de borrador | MIT |
| vite-plugin-singlefile (dev) | Build de archivo único (`apps/web/standalone/index.html`) que funciona con doble clic bajo `file://` | MIT |
| Playwright + Chromium (dev) | Verificación visual automatizada de la interfaz (`npm run test:visual`) | Apache-2.0 |
| supertest (dev) | Pruebas HTTP | MIT |
| node:test, node:crypto, node:fs | Pruebas, hash SHA-256, archivos | Node.js (MIT) |

## 3. Datos y fuentes institucionales

| Fuente | Uso | Condición |
|---|---|---|
| OEFA — repositorio institucional y PIFA | Registros de la evaluación de causalidad de San Rafael; resoluciones de San Vicente | Información pública; se cita documento y se enlaza el portal con término de búsqueda. El documento primario prevalece |
| SENACE — plataforma EVA | Estado del trámite de modificación del EIA (San Rafael) | Información pública |
| ANA — Observatorio del Agua | Marco institucional hídrico; terminología asháninka de la Ley de Recursos Hídricos traducida por la ANA | Información pública; la terminología se reutiliza citándola |
| El Peruano / gob.pe | D.S. N.° 004-2017-MINAM (ECA Agua); D.S. N.° 010-2010-MINAM (LMP efluentes minero-metalúrgicos) | Normas públicas; valores LMP verificados dígito a dígito por script |
| Ministerio de Cultura — Base de Datos de Pueblos Indígenas | Referencia institucional para validación de intérpretes | Uso referencial |
| Cuentas oficiales en X/Facebook de OEFA, ANA, SENACE, Defensoría, Cultura, Ministerio Público y MINSA | Directorio de canales de la guía de denuncia | Enlaces verificados por búsqueda el 21/10/2026 sobre perfiles con identificación institucional; el portal oficial prevalece |
| OpenStreetMap | Teselas del mapa | © OpenStreetMap contributors, ODbL; atribución visible en el mapa |
| CARTO (retirado) | Se evaluó como teselas; su servicio pasó a exigir clave de API y mostró marca de agua | **Ya no se usa**: el mapa emplea OpenStreetMap estándar (sin clave) y el tema noche aplica un filtro CSS local |

## 4. Imágenes y contenido

- **Fotografías**: provienen de **Wikimedia Commons** con licencias Creative Commons o dominio
  público, descargadas con metadatos de autoría y licencia (`tools/descargar-fotos.mjs`,
  `tools/sincronizar-fotos.mjs`). El manifest completo —autor, licencia y enlace de origen exacto
  por cada archivo— está publicado en la aplicación en **/creditos** y versionado en
  `apps/web/src/img/creditos.json`. Todas se presentan como **imágenes referenciales** del
  territorio y las actividades, no como fotodocumento de los puntos exactos de monitoreo.
- **Iconos PWA y gráficos**: generados por el propio proyecto (Pillow para los íconos; los
  gráficos son SVG propios calculados desde `data/datos-semilla.json`).
- Las fotografías de campo que se suban en la demo deben ser propias o autorizadas; el sistema conserva su hash y su licencia de uso comunal (ver Términos).

## 5. Lo que este proyecto NO usa (y por qué)

- **Ningún proveedor de LLM distinto de Meta**: sustituir el modelo rompería la regla central del evento. Ante un error 402 de créditos, el protocolo ordena detenerse y reportar.
- **Ninguna librería de mapas propietaria**: Leaflet + OSM.
- **Ningún servicio comercial de voz para lenguas originarias**: no existe cobertura confiable; se usa MMS/Omnilingual con sus límites declarados o se declara la indisponibilidad.
