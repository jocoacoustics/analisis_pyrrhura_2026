# GitHub Pages · Pyrrhura 2026 v0.3.1

https://jocoacoustics.github.io/analisis_pyrrhura_2026/

**Versión 0.3.1:** el sitio sigue una estructura única de informe científico; no es un atlas con paper anexo. Consulte README_v0.3.1.md en el directorio raíz para metodología e interpretación de modelos E6.

Sitio estático con **la UX editorial v0.1.5.7** y el contrato SIG Scytalopus. Usa `datos/observatorio.js`, que se llena con datos reales mediante `scripts/v0158/24_EXPORTAR_GITHUBPAGES_V0158.py` en el servidor Linux.

## Ejecutar en jocotoco1: SOLO LO NUEVO

Ya tienes 20 GeoTIFF completos de E3/E4 v0.1.7: **no repitas Earth Engine ni la descarga**. Extrae este ZIP sobre tu proyecto activo de Drive, conservando el archivo `secrets.env` fuera del proyecto. Desde el directorio habitual:

```bash
# 1. Solo una vez si no tienes SciPy: 
python3 -m pip install -r requirements-eco.txt

# 2. Comprobación de integridad de las 41 bandas y grilla común: SOLO LECTURA.
env -u PROJ_LIB -u PROJ_DATA -u GDAL_DATA \
  python3 -u analisis_pyrrhura_2026.py --preflight-ecologico

# 3. Ejecuta el análisis territorial nuevo, amplía SQLite y reconstruye GitHub Pages.
set -o pipefail
env -u PROJ_LIB -u PROJ_DATA -u GDAL_DATA \
  python3 -u analisis_pyrrhura_2026.py --solo-ecologico \
  2>&1 | tee -a ejecucion_E4_v020.log
```

**No se autentica de nuevo Earth Engine, no se vuelve a importar PostGIS, no se recalculan 312 millones de scores.** `--solo-ecologico` utiliza los **20 TIFF reales** ya descargados en `/home/jocotoco1/.local/share/analisis_pyrrhura_2026/data/processed/geo_ambiental/v0.1.7/rasters/` (deriva la ruta de `--db`). Guarda en esa misma jerarquía `derived_v020/` para ambos paisajes. Guarda las estadísticas nuevas en la **misma** `maestra_territorial.sqlite`. Regenera `githubpages/index.html`, JS y vistas PNG georreferenciadas para Leaflet. La web está lista para copiar/subir al repositorio; no realiza push a github.com.

## Qué incorpora v0.2.0 (E3/E4 descriptivo)

Se reutiliza todo el sistema E2/UX E3/E4 de v0.1.7.1: cuatro capas PostGIS, 372 coordenadas exactas, 287 estaciones con WAV, 20 TIFF de DEM/MapBiomas de dos paisajes, 2.976 estadísticos por punto y 4 estadísticas territoriales. **Nada de eso se inventa, se recalcula o se duplica.**

**Nuevos cálculos sobre MapBiomas Ecuador Colección 4 (1985–2025):**

1. **41 años de bosque:** mapa de número de años clasificados como bosque, y condición de bosque en los 41 mapas completos.
2. **Transiciones 1985→2025:** clasificado como bosque en ambas fechas, bosque→otra cobertura, otra cobertura→bosque y otra cobertura en ambas fechas. No se interpreta directamente como tala, regeneración causal o edad del bosque.
3. **Serie anual comparable:** superficie forestal anual, proporción entre píxeles válidos cada año y proporción de bosque sobre el mismo conjunto de píxeles válido los **41 años** (82 registros, dos paisajes).
4. **Fragmentación 2025:** número y tamaño de parches de bosque por conectividad de 8 vecinos; superficie del mayor parche; tamaño mediano; superficie de núcleo forestal a 90 m de bordes; distancia firmada al borde (+ bosque, − no bosque).
5. **Presión de cobertura antrópica 2025:** distancias a clases agropecuarias/construidas de MapBiomas y superficie clasificada (no una medición directa de amenazas).
6. **Aislamiento geométrico de parches:** distancia entre centroides de parches más próximos, **solo un proxy geométrico**; no equivale a separación de bordes ni conectividad funcional.
7. **Representatividad del muestreo:** histograma por franjas de 500 m de altitud que contrasta estaciones (con y sin WAV, una vez por punto) frente a píxeles del paisaje (muestra sistemática hasta 1 millón de celdas). No atribuye presencia de aves por el sensor.

**Códigos forestales exactos** `3,4,5,6`: bosque, bosque abierto, manglar, bosque inundable. Excluidos del denominador 0, 27 (no observado) y NoData. **Códigos antrópicos utilizados** `9,21,24,25,30,74` (silvicultura, mosaico agropecuario, infraestructura urbana, otra superficie antrópica, minería y banano). Conservar leyenda/mapa de clases originales para auditoría por bioma.

**Resolución:** 30×30 m, EPSG:32717; alineación de mosaicos verificada estrictamente. Los píxeles fuera de la geometría o no observados se mantienen como NoData. El perímetro del área de extracción puede cortar parches y distancias, por lo que los indicadores de borde se interpretan con prudencia.

**No está resuelto aún:** validación independiente de clasificadores, ocupación/detectabilidad corregidas, modelos de distribución, conectividad funcional, resistencia de paisaje, teledetección Sentinel-2/NDVI/NDMI o series climáticas si no están descargadas. No presentar ninguna capa de cobertura como mapa de presencia de *Pyrrhura*.

## Productos y estructura

```
analisis_pyrrhura_2026/
├── analisis_pyrrhura_2026.py        # ÚNICO ejecutor maestro
├── scripts/
│   ├── e3_ambiental.py             # PostGIS + Earth Engine + 20 GeoTIFF (heredado)
│   └── e4_ecologia_territorial.py  # NUEVO: 41 años, fragmentación, QA, incremental
├── templates/githubpages/          # plantillas originales y secciones v0.2.0
├── githubpages/                    # se genera al ejecutar en jocotoco1
├── tests/                          # suite E2, E3/E4 y nueva v0.2.0
├── requirements-geo.txt
├── requirements-eco.txt
└── docs/releases/v0.2.0.md
```

En SQLite aparecen `py020_runs`, `py020_area`, `py020_annual`, `py020_rasters`, `py020_representativeness` y `py020_point`. Los **12 nuevos TIFF** (6 por área) se guardan en `geo_ambiental/v0.1.7/rasters/<área>/derived_v020/`. En GitHub Pages se generan las **8 vistas PNG** de 4 superficies × 2 paisajes, con LayerControl nativo, sin mover coordenadas, además de gráficas de cobertura anual, transiciones y representatividad, tabla y metodología.

**Incremental:** el maestro compara firmas del código, códigos de cobertura, SHA registrados de fuentes y metadatos de los 20 TIFF. Si una ejecución anterior coincide y los derivados siguen presentes, no recalcula los rasters. `--forzar-ecologico` rehace solo los derivados; no modifica los 20 originales.

**Resguardo:** la SQLite no se reconstruye ni se mueve a Drive; se amplía transaccionalmente. Antes de incorporar una nueva versión a producción mantener el respaldo existente y verificar espacio suficiente. El programa no toca WAV, Parquet, JD, Railway ni PostGIS.

**Pruebas sintéticas locales** validan transformación de códigos, coherencia de los 41 años, ausencia de invención de puntos, escritura a SQLite, reanudación, vistas web y ejecución histórica. **La corrida real de v0.2.0 aún debe hacerse en `jocotoco1`**; ningún valor satelital real está embebido en el ZIP.
