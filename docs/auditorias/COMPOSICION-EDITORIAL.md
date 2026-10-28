# Composición editorial — menos texto, menos cajas · WillayPacha AI

**Fecha:** 26 de octubre de 2026 · **Encargo:** «mucho texto, muchas cajas, puros indicios de IA».
Se reestructuró el Radar con criterio editorial y se corrigió un fallo real de las teselas del mapa.

## 1. Qué cambió

### A. Fuera cajas: secciones planas
- Nuevo sistema `.banda`: secciones separadas por **una línea de 1 px y espacio**, sin tarjeta,
  sin sombra y sin vidrio. Las seis secciones informativas del Radar (expediente, cifras, contraste,
  línea de fiscalización, estudios, galería, normas, canales) usan este formato.
- Las tarjetas quedan reservadas a lo que **sí es una tarjeta**: resultados de búsqueda de normativa
  dentro de los desplegables, formularios y hojas de ruta. El directorio de canales pasó de
  **7 tarjetas a una lista a dos columnas** con líneas y enlaces en línea.
- Las cifras dejaron de ser una placa con cuatro recuadros: ahora son **números grandes en mono**
  sobre el fondo, con una dona pequeña sin caja.

### B. Fuera texto: copia reducida
- La portada pasó de un párrafo largo + lista de cinco servicios a **una frase de acción** y tres
  botones.
- La ficha técnica del expediente (empresa, actividad, ubicación, comunidad, cuenca, lengua,
  motivo y certificación) se movió a un **desplegable** «Ficha técnica»: misma información, sin
  párrafo permanente.
- La leyenda del mapa, la nota de privacidad y la de rectificación se acortaron; las advertencias
  legales irrenunciables se mantienen visibles.
- Tabla de contraste: se fusionó «fuente» y «fecha» en una sola celda para eliminar una columna.

### C. Corrección real de las teselas (hallazgo durante la revisión)
- Las teselas de **CARTO comenzaron a exigir clave de API** y mostraban «API KEY REQUIRED» sobre el
  mapa (visible en la captura de revisión). Se sustituyeron por **OpenStreetMap estándar** (sin
  clave) y el tema noche se resuelve con un **filtro CSS local** sobre la capa de teselas.
- `TERCEROS.md` documenta el retiro de CARTO y el uso de OSM con su atribución.

## 2. Verificación real

| Comprobación | Resultado |
|---|---|
| `npm test` | **57/57** |
| `npm run build` / `build:standalone` | ✓ · 4,67 MB |
| `npm run test:visual` | exit 0 · 13 ✓ · 0 excepciones |
| `verificar-responsive` | **35/35** (320–1440) |
| `verificar-tema` | tesela **openstreetmap ✓** · filtro noche **aplicado ✓** · contraste noche 8/8 AA · 0 excepciones |
| Evidencia | `docs/evidencia/editorial/{radar-editorial, radar-mapa, radar-tabla, radar-canales}.png` + `tema-noche/` |

## 3. Archivos

`apps/web/src/paginas/Radar.tsx` (reestructuración completa) · `apps/web/src/estilos.css`
(bloque «Composición editorial»: `.banda`, `.cifras`, `.definiciones`, `.galeria-libre`,
`.lista-canales`, `.nota-tecnica`, `.tabla-limpia`) · `apps/web/src/tema.ts` (OSM) ·
`tools/verificar-tema.mjs` (comprueba OSM y filtro) · `TERCEROS.md` (CARTO retirado).

## 4. Límites

- Verificación en Chromium; Safari/Firefox pendientes.
- Las teselas de OSM dependen de su política de uso (atribución incluida); para producción con
  tráfico alto habría que evaluar un proveedor con clave propia.
- AA completa y Lighthouse siguen pendientes.
- Ningún dato, cita, advertencia ni función cambió: la reestructuración es de composición.
