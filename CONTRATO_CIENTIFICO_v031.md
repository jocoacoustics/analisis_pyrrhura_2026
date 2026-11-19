# E6 v0.3.1 · Análisis científico Pyrrhura

- Fuente: misma SQLite maestra, Parquet previamente inferidos por E5, auditorías E2 y mapas E3/E4.
- Cohorte ecológica: solamente estaciones con WAV y score de la especie correspondiente.
- Denominador de screening: SOLO días con una salida explícita de score de clase; días faltantes no son negativos.
- Selección del modelo: desempeño condicionado a referencia experta por estación, no el modelo Único por defecto.
- GAM binomial: probabilidad de superar un umbral empírico de score, NO presencia ni ocupación.
- Validación espacial: bloques 0.04°; reportar Brier y cantidad de bloques/folds; no es extrapolación externa.
- Curvas: efecto marginal condicionado a otros predictores en mediana y modelo de IA seleccionado, bandas Wald aproximadas.
- MapBiomas: cambio forestal 1985–2025 calculado también dentro de polígonos ORIGINALES de las 3 unidades, sin buffer de contexto.
- MapBiomas 2025: clasificación de cobertura, no medición causal de pérdida ni respuesta biológica histórica.
- Escenarios de ocupación: fpr fija [0, .01, .05, .10], cierre trimestral y muestreo selectivo son supuestos;
  las salidas NO son ocupación verdadera identificada ni justifican mapas de presencia.
- Ninguna nueva estación, anotación, WAV o descarga de raster fue necesaria.
- Bibliografía final en `references.bib`. Datos completos y firma de ejecución en `RESULTADOS_REPRODUCIBLES_v031.json`.
