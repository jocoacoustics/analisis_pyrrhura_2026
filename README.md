# GitHub Pages · Pyrrhura 2026 v0.1.6

Sitio estático con **la UX editorial v0.1.5.7** y el contrato SIG Scytalopus. Usa `datos/observatorio.js`, que se llena con datos reales mediante `scripts/v0158/24_EXPORTAR_GITHUBPAGES_V0158.py` en el servidor Linux.

El ZIP de instalación incluye una plantilla sin puntos, deliberadamente: **no se muestran los 60 puntos sintéticos de la maqueta** ni los 287 puntos generalizados como si fueran exactos. Para ver 287 ubicaciones reales debe ejecutarse el exportador con SQLite local, JD y el CSV de coordenadas cotejadas, y pasar todos los controles de integridad. No se puede rellenar con la base remota automáticamente desde GitHub Pages.

- SIG Leaflet nativo, capas de cohortes de inicio (hasta contar con campaña formal), iconografía JD / Railway y cuatro bases Esri/OSM/Topo. Sin jitter ni coordenadas redondeadas. En coordenadas compartidas agrupa IDs en una misma ubicación.
- Plotly y MathJax distribuidos en `vendor`. Leaflet y las imágenes de los mapas requieren Internet. Se mantiene un respaldo SVG cuando Leaflet/teselas no están disponibles.
- Vista diaria real solo para esfuerzo registrado, evidencia por fuente y candidatos IA del atlas E2; **no extrapolar estos indicadores a ocupación**.
- GitHub Pages es público por defecto; el administrador decide qué repositorio publicar. El maestro no introduce bloqueos ni cambia las coordenadas.

Instrucciones de ejecución y fuentes: `../README.md`.
