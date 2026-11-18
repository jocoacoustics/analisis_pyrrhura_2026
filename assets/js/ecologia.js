/* v0.2.0. Descriptivo ambiental; jamás muestra scores como presencia u ocupación. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const data=window.PYRRHURA_ECOLOGIA||{};
const esNumber=(n,unit='',fraction=1)=>n==null||!Number.isFinite(+n)?'Sin dato':new Intl.NumberFormat('es-EC',{maximumFractionDigits:2}).format(+n*fraction)+(unit?' '+unit:'');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const areaName=id=>id==='buenaventura'?'Buenaventura':'Palanda–Tapichalaca';
const colors=['#3f805a','#b58a45'];
function plot(id,series,layout){const e=$(id);if(!e)return;if(!window.Plotly){e.textContent='Visualización Plotly no disponible. Consulta la tabla y los valores de la base.';return;}
 window.Plotly.newPlot(e,series,{paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'rgba(0,0,0,0)',margin:{l:62,r:18,t:25,b:58},font:{family:'Inter, Arial, sans-serif',size:11,color:'#394c40'},autosize:true,...layout},{responsive:true,displaylogo:false,displayModeBar:true});}
function init(){
 const areas=data.areas||[], annual=data.annual||[], coverage=data.coverage||[];
 if(!areas.length){$('ecoStatus').textContent='Análisis territorial v0.2.0 todavía no ejecutado en el servidor; no se muestran datos sintéticos.';return;}
 $('ecoStatus').textContent='Resultados E3–E4 derivados de GeoTIFF reales y guardados en la SQLite maestra · MapBiomas 1985–2025 · 30 m · análisis descriptivo';
 $('ecoSummary').innerHTML=areas.map(a=>{
  const delta=a.forest_gain_km2-a.forest_loss_km2;
  return `<article><h3>${esc(areaName(a.area_id))}</h3><p><strong>Soporte válido 41 años:</strong> ${esNumber(a.common_km2,'km²')}</p><p><strong>Bosque 2025:</strong> ${esNumber(a.forest_2025_km2,'km²')} · <strong>balance de transición 1985–2025:</strong> ${esNumber(delta,'km²')}</p><p><strong>Bosque clasificado 41 años:</strong> ${esNumber(a.continuous_forest_km2,'km²')}</p><p><strong>Parches de bosque 2025:</strong> ${esNumber(a.forest_patches_2025)} (8 vecinos) · <strong>aislamiento por centroides:</strong> ${esNumber(a.median_patch_centroid_isolation_m,'m')}</p></article>`;
 }).join('');
 const ids=areas.map(a=>a.area_id);
 plot('ecoAnnualPlot',ids.map((id,i)=>({type:'scatter',mode:'lines+markers',name:areaName(id),x:annual.filter(r=>r.area_id===id).map(r=>r.year),y:annual.filter(r=>r.area_id===id).map(r=>r.pct_forest_common==null?null:r.pct_forest_common*100),line:{color:colors[i%colors.length],width:2},marker:{size:4}})),
  {xaxis:{title:'Año',dtick:5},yaxis:{title:'Bosque (% de píxeles válidos en 41 años)',rangemode:'tozero'},legend:{orientation:'h',y:-.25}});
 plot('ecoTransitionsPlot',[{type:'bar',name:'Pérdida de clase bosque',x:ids.map(areaName),y:areas.map(a=>a.forest_loss_km2),marker:{color:'#b75546'}},{type:'bar',name:'Ganancia de clase bosque',x:ids.map(areaName),y:areas.map(a=>a.forest_gain_km2),marker:{color:'#3f805a'}},{type:'bar',name:'Bosque ambas fechas',x:ids.map(areaName),y:areas.map(a=>a.unchanged_forest_km2),marker:{color:'#7aa38c'}}],{barmode:'group',yaxis:{title:'Superficie clasificada (km²)'},xaxis:{title:'Paisaje'},legend:{orientation:'h',y:-.33,font:{size:9}},margin:{l:55,r:12,t:20,b:85}});
 const focus=ids[0], subset=coverage.filter(r=>r.area_id===focus),bins=subset.map(r=>r.elevation_band),total=subset.reduce((a,r)=>a+r.sampled_landscape_pixels,0),pts=subset.reduce((a,r)=>a+r.stations_total,0);
 const elevate=[{type:'bar',name:'Píxeles de paisaje (%)',x:bins,y:subset.map(r=>total?100*r.sampled_landscape_pixels/total:0),marker:{color:'#b8a273'}},{type:'bar',name:'Estaciones (%)',x:bins,y:subset.map(r=>pts?100*r.stations_total/pts:0),marker:{color:'#3f805a'}}];
 plot('ecoElevationPlot',elevate,{barmode:'group',xaxis:{title:'Altitud del terreno (m)',tickangle:-35},yaxis:{title:'Proporción del grupo (%)'},legend:{orientation:'h',y:-.35,font:{size:9}},margin:{l:50,r:15,t:20,b:92}});
 $('ecoTableBody').innerHTML=areas.map(a=>`<tr><th>${esc(areaName(a.area_id))}</th><td>${esNumber(a.forest_1985_km2,'km²')}</td><td>${esNumber(a.forest_2025_km2,'km²')}</td><td>${esNumber(a.forest_loss_km2,'km²')}</td><td>${esNumber(a.forest_gain_km2,'km²')}</td><td>${esNumber(a.continuous_forest_km2,'km²')}</td><td>${esNumber(a.forest_patches_2025)}</td><td>${esNumber(a.largest_patch_ha,'ha')}</td></tr>`).join('');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
