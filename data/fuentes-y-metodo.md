# Fuentes y método de curaduría de datos

Este proyecto **no raspa masivamente y no genera datos con el modelo**. Los datos de la
demostración se curan a mano desde fuentes primarias, siguiendo el procedimiento fijado
en la especificación (informe del proyecto, sección 4.4):

1. Abrir la fuente primaria (PIFA de OEFA, repositorio institucional de OEFA,
   plataforma EVA de SENACE, Observatorio del Agua de la ANA, resoluciones en gob.pe).
2. Extraer únicamente: hecho, fecha, cuerpo de agua o componente, parámetro y estándar
   involucrado, y la conclusión textual del organismo.
3. Guardar la cita literal con su página y el hash SHA-256 del documento.
4. Redactar un resumen en español simple de máximo 60 palabras, sin adjetivos.
5. Asignar el semáforo según reglas explícitas:
   - **rojo**: hallazgo oficial vigente que supera un estándar, o medida/sanción firme.
   - **ámbar**: procedimiento en curso, atribución dudosa o información desactualizada.
   - **verde**: evaluación oficial sin hallazgo negativo o compromiso verificado como cumplido.
6. Someter cada registro a una segunda verificación contra la fuente antes de mostrarse.

## Campos obligatorios de todo registro

`fuente.organismo`, `fuente.documento`, `fuente.url`, `fecha`, `citaLiteral`,
`semaforo`, `confianza`, `fechaConsulta`. El script `tools/verificar-datos.mjs`
(ejecutado por CI y por `npm test`) **hace fallar la construcción** si falta uno.

## Estado de esta instancia (honestidad sobre vacíos)

- Los registros incluidos provienen del informe de preparación del proyecto (20/10/2026),
  que verificó los hallazgos en el repositorio institucional de OEFA y en gob.pe.
- `citaPagina` y `hashDocumento` quedan **pendientes** hasta adjuntar los PDF primarios
  al repositorio; el sistema los declara como pendientes en lugar de fabricarlos.
- Las coordenadas de unidades y componentes están marcadas como **aproximadas** en los
  datos y en la interfaz; se reemplazarán por las oficiales del instrumento de gestión.
- El **Territorio C (altiplano aimara)** se presenta sin datos y con su leyenda de
  preparación: declarar un vacío es más fuerte que disimularlo.

## Fuentes institucionales usadas

- OEFA — repositorio institucional y PIFA: https://www.gob.pe/institucion/oefa/
- SENACE — plataforma EVA y consulta ciudadana: https://www.gob.pe/institucion/senace/
- ANA — Observatorio del Agua: https://www.gob.pe/institucion/ana/
- Normas — D.S. N.° 004-2017-MINAM y D.S. N.° 010-2010-MINAM (El Peruano / gob.pe)

La interfaz siempre muestra el enlace institucional junto con el término de búsqueda
exacto del documento, de modo que cualquier persona —incluida la empresa aludida—
pueda contrastar el registro en el acto. La fuente primaria prevalece sobre este
sistema (ver Aviso Legal).
