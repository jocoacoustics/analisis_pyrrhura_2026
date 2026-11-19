/* Pyrrhura 2026 v0.3.2 · Un único paper, resultados científicos reales E6 */
(()=>{'use strict';
const C=window.PYRRHURA_CIENCIA||null,E=window.PYRRHURA_INFERENCIA||null;
const $=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const fmt=(x,d=2)=>x==null||!Number.isFinite(Number(x))?'no estimable':new Intl.NumberFormat('es-EC',{maximumFractionDigits:d}).format(Number(x));
const pct=x=>x==null?'no estimable':fmt(x*100,1)+' %';
const keyName=t=>t==='Pyrrhura orcesi'?'P. orcesi':'P. albipectus';
const taxa=['Pyrrhura orcesi','Pyrrhura albipectus'];
const colors=['#206145','#ac6b48'];
function plot(id,data,layout={}){const el=$(id);if(!el)return;
  if(!window.Plotly){el.textContent='El gráfico no está disponible. Consulte las tablas reproducibles CSV.';return;}
  window.Plotly.newPlot(el,data,{paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'rgba(0,0,0,0)',font:{color:'#314339',size:11},
    autosize:true,margin:{l:80,r:22,t:54,b:90},legend:{orientation:'h',y:-.28},...layout},
    {displaylogo:false,responsive:true,displayModeBar:'hover',modeBarButtonsToRemove:['lasso2d','select2d']});}
function table(id,rows,mapper){const el=$(id);if(el)el.innerHTML=rows.length?rows.map(mapper).join(''):'<tr><td colspan="9">No hay estimaciones para esta combinación de fuentes.</td></tr>';}
function main(){
 if(!C||C.meta.status!=='COMPLETADO'){
    if($('ciStatus'))$('ciStatus').textContent='E6 pendiente: ejecutar el maestro en jocotoco1; no hay resultados estadísticos simulados.';
    return;
 }
 const primary=new Map(C.primary.map(x=>[x.taxon,x]));
 const status=`Análisis acústico y ambiental de dos especies · ${fmt(C.meta.details.fits_adjusted,0)} modelos multiescala ajustados.`;
 if($('ciStatus'))$('ciStatus').textContent=status;
 if($('paperStatus'))$('paperStatus').textContent='';
 if($('ciSummary'))$('ciSummary').innerHTML='';
 if($('paperSummary'))$('paperSummary').innerHTML='';
 table('ciCalibration',C.calibration.filter(r=>r.taxonomic_level==='ESPECIE'),r=>`<tr><td><i>${esc(keyName(r.taxon))}</i></td><td>${esc(r.model_id)}</td><td>${fmt(r.n_positive,0)} / ${fmt(r.n_negative,0)}</td><td>${fmt(r.n_stations,0)}</td><td>${fmt(r.threshold_full,3)}</td><td>${pct(r.balanced_accuracy_reviewed)}</td><td>${pct(r.balanced_accuracy_spatial_cv)} (${fmt(r.cv_folds,0)} folds)</td><td>${esc(r.status)}</td></tr>`);
 const phen=taxa.map(t=>({tax:t,data:C.phenology.filter(x=>x.taxon===t&&x.period_type==='year_month').sort((a,b)=>a.period.localeCompare(b.period))}));
 plot('ciPhenology',phen.map((group,i)=>({type:'scatter',mode:'lines+markers',name:keyName(group.tax),
   x:group.data.map(r=>r.period),y:group.data.map(r=>r.n_screened_days==null?null:100*r.n_screened_days/r.n_station_days),
   customdata:group.data.map(r=>[r.n_station_days,r.n_stations,r.effort_h]),
   hovertemplate:'%{x}<br>Screening %{y:.1f}%<br>Días evaluados %{customdata[0]}<br>Estaciones %{customdata[1]}<br>Esfuerzo %{customdata[2]:.1f} h<extra></extra>',
   line:{color:colors[i]},marker:{size:6}})),{xaxis:{title:'Mes de grabación',tickangle:-45},yaxis:{title:'Porcentaje de días con score ≥ corte',range:[0,100]}});
 const bestFit={};
 for(const tax of taxa){
  const candidates=C.fits.filter(x=>x.taxon===tax&&x.status==='AJUSTADO_CONDICIONAL');
  candidates.sort((a,b)=>{
   const aa=JSON.parse(a.diagnostics_json),bb=JSON.parse(b.diagnostics_json);
   const av=aa.brier_spatial_cv,bv=bb.brier_spatial_cv;
   if(av==null&&bv!=null)return 1;if(bv==null&&av!=null)return -1;
   return (av??aa.brier_internal??1)-(bv??bb.brier_internal??1);
  });bestFit[tax]=candidates[0]||null;
 }
 for(const [axis,ids] of [['altitude',['ciAltitudeO','ciAltitudeA']],['forest',['ciForestO','ciForestA']]]){
   for(let i=0;i<taxa.length;i++){
     const tax=taxa[i],fit=bestFit[tax],id=ids[i];if(!fit){if($(id))$(id).textContent='No se obtuvo un ajuste ambiental estimable.';continue;}
     const a=C.curves.filter(v=>v.taxon===tax&&v.forest_radius_m===fit.forest_radius_m&&v.axis===axis).sort((v,w)=>v.x-w.x);
     if(!a.length){if($(id))$(id).textContent='No hay curva estimable en este soporte ambiental.';continue;}
     const x=a.map(r=>axis==='forest'?100*r.x:r.x),lo=a.map(r=>r.ci_low==null?null:100*r.ci_low),hi=a.map(r=>r.ci_high==null?null:100*r.ci_high);
     const validBand=lo.every(Number.isFinite)&&hi.every(Number.isFinite)&&a.every((r,j)=>r.ci_low<=r.estimate&&r.estimate<=r.ci_high);
     const traces=[];
     if(validBand)traces.push({type:'scatter',mode:'lines',x:x.concat([...x].reverse()),
       y:hi.concat([...lo].reverse()),fill:'toself',fillcolor:i?'rgba(172,107,72,.16)':'rgba(32,97,69,.16)',line:{width:0},showlegend:false,hoverinfo:'skip'});
     traces.push({type:'scatter',mode:'lines',name:keyName(tax),x,y:a.map(r=>100*r.estimate),line:{color:colors[i],width:3},hovertemplate:(axis==='forest'?'Bosque: ':'Altitud: ')+ '%{x:.0f}<br>Predicción: %{y:.2f}%<extra></extra>'});
     plot(id,traces,{xaxis:{title:axis==='forest'?'Bosque clasificado en el radio de '+fit.forest_radius_m+' m (%)':'Elevación (m s. n. m.)'},
       yaxis:{title:'Probabilidad de superar umbral de IA (%)',rangemode:'tozero',ticksuffix:' %'},
       margin:{l:78,r:18,t:50,b:87},legend:{orientation:'h',y:-.26}});
   }
 }
 table('ciScaleTable',C.fits,(r)=>{const d=JSON.parse(r.diagnostics_json||'{}');
    return `<tr><td><i>${esc(keyName(r.taxon))}</i></td><td>${fmt(r.forest_radius_m,0)} m</td><td>${fmt(r.n_stations,0)}</td><td>${fmt(r.n_station_days,0)}</td><td>${fmt(d.brier_internal,3)}</td><td>${fmt(d.brier_spatial_cv,3)}</td><td>${fmt(d.brier_null_spatial_cv,3)}</td><td>${fmt(d.n_spatial_blocks,0)} / ${fmt(d.spatial_folds_evaluated,0)}</td><td>${esc(r.status)}</td></tr>`;
 });
 const interpretations=[];
 for(const tax of taxa){
   const f=bestFit[tax];if(!f){interpretations.push(`Para <i>${esc(keyName(tax))}</i>, el ajuste ambiental no alcanzó los requisitos mínimos o falló su diagnóstico. No se presenta una curva ficticia.`);continue;}
   const d=JSON.parse(f.diagnostics_json);
   const better=d.brier_spatial_cv!=null&&d.brier_null_spatial_cv!=null;
   interpretations.push(`Para <i>${esc(keyName(tax))}</i>, el mejor ajuste disponible entre las escalas probadas utilizó bosque a ${fmt(f.forest_radius_m,0)} m (n=${fmt(f.n_stations,0)} estaciones y ${fmt(f.n_station_days,0)} días). ${better?`El Brier por bloques espaciales fue ${fmt(d.brier_spatial_cv,3)}, frente a ${fmt(d.brier_null_spatial_cv,3)} de referencia sin covariables.`:'No hubo suficientes bloques independientes para validar espacialmente el ajuste.'} Estas curvas describen asociación con la señal acústica automatizada, no estiman ocupación.`);
 }
 $('ciScaleInterpretation').innerHTML=interpretations.map(x=>`<p>${x}</p>`).join('');
 table('ciUnitTable',C.units,(r)=>`<tr><td><i>${esc(keyName(r.taxon))}</i></td><td>${esc(r.unit_name)}</td><td>${fmt(r.station_count,0)}</td><td>${fmt(r.wav,0)}</td><td>${fmt(r.effort_h,1)}</td><td>${fmt(r.expert_positive_stations,0)}</td><td>${r.scored_days?`${fmt(r.screened_days,0)} / ${fmt(r.scored_days,0)}`:'no evaluables'}</td></tr>`);
 const forestUnits=C.forest_management||[],forestAnnual=C.forest_management_yearly||[];
 table('ciForestUnitTable',forestUnits,r=>`<tr><td>${esc(r.unit_name)}</td><td>${fmt(r.common_endpoints_km2,2)}</td><td>${fmt(r.forest_1985_common_km2,2)}</td><td>${fmt(r.forest_2025_common_km2,2)}</td><td>${fmt(r.gross_loss_km2,2)}</td><td>${fmt(r.gross_gain_km2,2)}</td><td>${fmt(r.net_change_km2,2)}</td></tr>`);
 plot('ciForestUnitTrend',[...new Set(forestAnnual.map(r=>r.unit_name))].sort().map((name,i)=>{
   const a=forestAnnual.filter(r=>r.unit_name===name).sort((r,s)=>r.year-s.year);
   return {type:'scatter',mode:'lines',name,x:a.map(r=>r.year),y:a.map(r=>r.area_common_41year_km2>0?100*r.forest_common_41year_km2/r.area_common_41year_km2:null),line:{width:2}};
 }),{xaxis:{title:'Año MapBiomas'},yaxis:{title:'Bosque sobre soporte 41 años válido (%)'}});
 const occ=C.occupancy_sensitivity;
 plot('ciOccPlot',taxa.map((t,i)=>{const a=occ.filter(r=>r.taxon===t&&r.psi_median_site!=null).sort((u,v)=>u.fpr_assumed-v.fpr_assumed);
     return {type:'scatter',mode:'lines+markers',name:keyName(t),x:a.map(r=>100*r.fpr_assumed),y:a.map(r=>100*r.psi_median_site),line:{color:colors[i]}};
   }),{xaxis:{title:'Falsos positivos por día, valor supuesto (%)'},yaxis:{title:'ψ condicional de escenario (%)',range:[0,100]}});
 table('ciOccTable',occ,r=>`<tr><td><i>${esc(keyName(r.taxon))}</i></td><td>${pct(r.fpr_assumed)}</td><td>${fmt(r.n_station_periods,0)}</td><td>${fmt(r.n_stations,0)}</td><td>${pct(r.psi_median_site)}</td><td>${pct(r.p_detection_median)}</td><td>${esc(r.status)}</td></tr>`);
 const scenario=taxa.map(t=>({tax:t,data:occ.filter(r=>r.taxon===t&&r.psi_median_site!=null)}));
 const changes=scenario.map(x=>{
  if(x.data.length<2)return `<i>${esc(keyName(x.tax))}</i>: escenarios no estimables o insuficientes.`;
  const min=Math.min(...x.data.map(r=>r.psi_median_site)),max=Math.max(...x.data.map(r=>r.psi_median_site));
  return `<i>${esc(keyName(x.tax))}</i>: ψ entre ${pct(min)} y ${pct(max)} según la tasa de falsos positivos impuesta; estos son resultados <strong>dependientes de supuestos</strong>, no un intervalo de confianza ni una estimación confirmada.`;
 });
 $('ciResearchText').innerHTML=`<p class="paper-paragraph"><strong>Pregunta central:</strong> ¿las asociaciones de la señal de especie con elevación, cobertura forestal y temporada persisten al considerar esfuerzo, modelo de IA y estructura espacial? La evidencia de detección revisada y el <em>screening</em> automatizado son niveles distintos de observación.</p>`;
 $('ciQA').innerHTML='<h3>Comprobaciones de integridad y límites</h3><div>'+C.qa.map(r=>`<p><strong>${esc(r.severity)}.</strong> ${esc(r.detail)}</p>`).join('')+'</div>';
 $('ciDownloads').innerHTML='<strong>Datos y métodos de E6:</strong> <a href="tablas/primary_v031.csv">modelos seleccionados</a> · <a href="tablas/calibration_v031.csv">calibración</a> · <a href="tablas/phenology_v031.csv">fenología</a> · <a href="tablas/fits_v031.csv">coeficientes y diagnósticos</a> · <a href="tablas/curves_v031.csv">curvas con incertidumbre</a> · <a href="tablas/occupancy_sensitivity_v031.csv">escenarios de ocupación</a> · <a href="RESULTADOS_REPRODUCIBLES_v031.json">procedencia JSON</a> · <a href="references.bib">BibTeX</a>';
 const discussion=$('ciDiscussionText');if(discussion)discussion.innerHTML=`<p>Las curvas altitudinales e interacciones con el bosque se estimaron sobre el soporte de estaciones con inferencia de especie. ${interpretations.join(' ')} La reproducción cooperativa de <i>P. orcesi</i> impide inferir abundancia o cría directamente desde el número de vocalizaciones (<a href="#ref-KlaukeSegelbacherSchaefer2013">Klauke et al., 2013</a>; <a href="#ref-KlaukeJansenKramerSchaefer2014">2014</a>). La diferenciación genética de poblaciones cercanas (<a href="#ref-KlaukeSchaeferBauerSegelbacher2016">Klauke et al., 2016</a>) no se deduce de nuestras métricas de parche.</p><p>Los contrastes de paisajes deben leerse en el contexto de los 41 años de MapBiomas disponibles, pero estos no constituyen una serie histórica de ocupación de <i>Pyrrhura</i>. La interpretación de ψ sigue condicionada al error de IA y a un periodo de cierre trimestral supuesto (<a href="#ref-MacKenzieEtAl2002">MacKenzie et al., 2002</a>; <a href="#ref-MillerEtAl2011">Miller et al., 2011</a>).</p>`;
 const conclusion=$('ciConclusionsText');if(conclusion)conclusion.innerHTML=`<h3>Conclusiones derivadas de los modelos calculados</h3><p>${interpretations.join(' ')}</p><p>${changes.join(' ')}</p><p>La evidencia confirmada por especialistas permanece separada de la probabilidad de screening. Los resultados disponibles permiten caracterizar gradientes de la señal de IA, no cuantificar individuos ni inferir causalidad ambiental.</p>`;
 const phText=$('ciPhenologyText');if(phText)phText.innerHTML='La frecuencia mensual está normalizada por <strong>estaciones-día con score de la clase de especie</strong>, y no por la totalidad de las grabaciones. Los meses con menos días o diferentes estaciones pueden mostrar variaciones de score que no reflejan cambios biológicos.';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',main,{once:true});else main();
})();
