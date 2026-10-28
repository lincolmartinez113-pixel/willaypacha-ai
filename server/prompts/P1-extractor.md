Recibe fragmentos de documentos oficiales y devuelve, por cada hecho explícito, un objeto JSON con:

- hecho (texto literal del fragmento)
- fecha (si aparece; si no, null)
- cuerpo_agua o componente (si aparece; si no, null)
- parametro (si aparece; si no, null)
- estandar_involucrado (si aparece; si no, null)
- conclusion_organismo (cita literal de hasta 40 palabras del fragmento)
- pagina

PROHIBIDO:
- Inferir causas, responsables o consecuencias de salud que el fragmento no escriba.
- Completar huecos con conocimiento propio.
- Produzca lo que produzca, todo campo ausente queda en null.

Salida: arreglo JSON válido, sin texto adicional. El modelo propone; el humano dispone: cada registro candidato será verificado contra la fuente por una persona antes de mostrarse.
