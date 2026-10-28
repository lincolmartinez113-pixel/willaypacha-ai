---
name: auditar-demo
description: Usar en cada parada de auditoría del protocolo (E0–E9): batería de preguntas trampa, verificación de datos, escaneo de secretos, prueba adversarial de casos y ARCO, y verificación de la entrega.
---

# Skill: auditar-demo

## Cuándo usarla
Al final de cada etapa del protocolo de construcción, y antes de cualquier
entrega o demostración.

## Batería de auditoría

### 1. Verificación de datos (transversal, SIEMPRE)
- `npm run verificar-datos` — la construcción falla si a un registro le
  falta fuente, fecha, cita, semáforo, confianza o fecha de consulta; si
  un valor LMP no coincide dígito a dígito; si el Territorio C tiene datos
  o el glosario registra términos sin estado.

### 2. Batería de diez preguntas trampa (crítica en E3, regresión después)
Ejecutar `node --test` (suite `trampas.test.js`). Las diez deben terminar
en «no consta», cita válida, término sin inventar, derivación al experto o
resistencia a la inyección. La corrida completa se guarda como evidencia
del informe de etapa.

### 3. Secretos
- `git ls-files` + búsqueda de patrones de claves en todo el árbol.
- Confirmar que `.env` está ignorado y `.env.example` no tiene valores.

### 4. Prueba adversarial de casos (E7)
- Acceso a un caso sin rol → debe ser imposible (403).
- Duplicar la misma fotografía → no debe crear un segundo caso (409).
- Caso con menores identificables → bloqueado en la revisión.
- Retiro del caso → ficha, evidencia y transcripciones desaparecen de los datos.
- Publicación con la leyenda de alcance exacta.

### 5. Derechos ARCO (E8)
Un usuario de prueba accede a sus datos, los rectifica y los borra por
completo (`arco.test.js`).

### 6. Interfaz honesta (transversal)
- Ninguna segmentación se denomina «contaminación detectada».
- Ningún audio simulado: indisponibilidad declarada.
- Estados de borrador visibles en toda salida en lengua originaria.
- El asistente se presenta como IA.

### 7. Entrega (E9)
- Demo completa corrida tres veces, una con red lenta simulada.
- Modo sin conexión mostrando los dos casos precargados.
- Ninguna afirmación del README o del video contradice un informe de auditoría.

## Formato del informe de etapa
`# Informe Etapa N — <nombre> · <fecha y hora, Lima>` con secciones
Construido / Auditoría (ítem por ítem, PASA|FALLA + evidencia) / Regresión
/ Fallos y correcciones / Consumo / Veredicto: APTO | NO APTO | BLOQUEADO.
Un «pasa» sin evidencia no cuenta como verificado.
