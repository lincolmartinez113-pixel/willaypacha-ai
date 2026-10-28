---
name: verificar-fuente
description: Usar antes de mostrar cualquier afirmación sobre una empresa, persona, unidad o hecho ambiental en WillayPacha AI: ninguna afirmación entra sin URL, fecha y cita literal comprobadas contra la fuente.
---

# Skill: verificar-fuente

## Cuándo usarla
Al incorporar cualquier registro a `data/datos-semilla.json`, al responder
una consulta del asistente o al redactar cualquier documento.

## Procedimiento
1. Abrir la fuente primaria (PIFA, repositorio OEFA, EVA de SENACE,
   Observatorio ANA, resoluciones en gob.pe). No valen resúmenes de
   terceros ni memoria.
2. Extraer SOLO: hecho, fecha, cuerpo de agua o componente, parámetro y
   estándar involucrado, y la conclusión textual del organismo.
3. Guardar la cita literal con su página y el hash SHA-256 del documento.
   Si la página o el hash aún no se tienen, se declaran «pendientes»:
   **no se fabrican**.
4. Asignar el semáforo por reglas explícitas:
   - rojo: hallazgo oficial vigente que supera un estándar o medida/sanción firme;
   - ámbar: procedimiento en curso, atribución dudosa o información desactualizada;
   - verde: evaluación oficial sin hallazgo negativo o compromiso verificado como cumplido.
5. Segunda verificación contra la fuente antes de mostrar el registro.
6. Correr `npm run verificar-datos`: la construcción falla si falta
   fuente.organismo, fuente.documento, fuente.url, fecha, citaLiteral,
   semáforo, confianza o fechaConsulta.

## Prohibiciones
- Inferir causas, responsables o consecuencias de salud que la fuente no escriba.
- Usar vocabulario de acusación («contaminó», «culpable», «delito») si la fuente no lo usa.
- Presentar una medida preventiva como sanción, una reconsideración parcial como absolución.
- Generalizar de una quebrada a una cuenca entera.
