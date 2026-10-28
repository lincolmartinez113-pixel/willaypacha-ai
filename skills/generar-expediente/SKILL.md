---
name: generar-expediente
description: Usar para armar los documentos borrador del Módulo D (acta bilingüe, informe técnico, denuncia/solicitud) desde fichas validadas, con su franja de borrador y su Registro de Generación.
---

# Skill: generar-expediente

## Cuándo usarla
Al generar cualquiera de los tres documentos del Módulo D, o al modificar
las plantillas en `server/pdf/generador.js`.

## Procedimiento
1. Partir SOLO de fichas verificadas y registros citados (nunca de
   memoria ni de texto libre del modelo).
2. Encabezado de BORRADOR obligatorio en cada página: «Borrador generado
   con asistencia de IA — requiere revisión de un especialista — no
   presentar».
3. Datos del solicitante como marcadores `[COMPLETAR: …]`. Nunca inventar
   nombres, DNI ni domicilios.
4. Hechos redactados como observación («el registro indica», «según el
   documento citado»), con cita literal, organismo, documento y fecha.
5. Pedido concreto a la entidad competente en forma de solicitud.
6. Lista de anexos al final.
7. Pie de página con el Registro de Generación: modelo, prompt y versión,
   fuentes citadas con su hash (o «pendiente»), fecha, estado de revisión.
8. El PDF «final» solo se genera tras aprobación de un experto con nombre
   y colegiatura (CIP o CAL); el sistema no firma por nadie, no fecha
   presentaciones y no envía nada.

## Prohibiciones
- Afirmar delitos o calificar a personas o empresas.
- Prometer resultados ante la autoridad.
- Omitir la franja de borrador en cualquier página.
- Convertir una medida preventiva en sanción, o una reconsideración parcial en absolución.

## Auditoría de la etapa
Generar los tres documentos con datos semilla y verificar: franja en todas
las páginas; PDF final bloqueado sin aprobación; ausencia de firmas y
fechas de presentación; pie con modelo, prompt, fuentes y hash; flujo de
estados con bitácora (borrador → revisión → aprobado/observado).
