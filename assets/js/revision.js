/* v0.3.2 · Lectura de los resultados reproducibles; ninguna cifra simulada. */
(()=>{'use strict';
const R=window.PYRRHURA_REVISION,C=window.PYRRHURA_CIENCIA,E=window.PYRRHURA_INFERENCIA;
const $=id=>document.getElementById(id);
const name=t=>t==='Pyrrhura orcesi'?'P. orcesi':t==='Pyrrhura albipectus'?'P. albipectus':t;
const fmt=(v,d=1)=>v==null||!Number.isFinite(Number(v))?'no estimable':new Intl.NumberFormat('es-EC',{maximumFractionDigits:d}).format(Number(v));
const html=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const models={'Clasificador_Especies_V1':'General V1','Clasificador_Pyrrhura_Jerarquico':'Jerárquico','Clasificador_Pyrrhuras_Unico':'Único'};
const mname=m=>models[m]||m;
function plot(id,traces,layout={}){const e=$(id);if(!e||!window.Plotly)return;
  const defaults={autosize:true,paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'rgba(0,0,0,0)',font:{color:'#304536',size:12},
  margin:{l:78,r:28,t:55,b:95},legend:{orientation:'h',y:-.34,font:{size:11}},
  xaxis:{automargin:true,zeroline:false,gridcolor:'#e6eee4'},yaxis:{automargin:true,zeroline:false,gridcolor:'#e6eee4'}};
  window.Plotly.newPlot(e,traces,{...defaults,...layout},{displaylogo:false,responsive:true,displayModeBar:'hover',modeBarButtonsToRemove:['lasso2d','select2d','toImage','autoScale2d']});}
function table(id,rows,render){if($(id))$(id).innerHTML=rows.length?rows.map(render).join(''):'<tr><td colspan="9">No hay resultados estimables para esta comparación.</td></tr>';}
function figureNumbers(){
  let n=0;
  // Scientific article: number only figures actually present in main narrative.
  document.querySelectorAll('figure.paper-chart, article.figure-card').forEach(f=>{
    if(f.closest('[hidden],.technical-supplement'))return;
    ++n;f.dataset.figureNumber=String(n);
    const heading=f.querySelector('h3');
    if(heading&&heading.id!=='evidenceTitle'){
      if(!heading.dataset.originalFigureTitle)heading.dataset.originalFigureTitle=heading.textContent.replace(/^Figura\s*(?:E\d+-)?\d+\s*[·:.–-]\s*/iu,'').replace(/^Figura suplementaria\s*[·:.–-]\s*/iu,'');
      heading.textContent='Figura '+String(n).padStart(2,'0')+' · '+heading.dataset.originalFigureTitle;
    }
    const caption=f.querySelector('figcaption, .fig-caption');
    if(caption){
      const markup=caption.innerHTML.replace(/^\s*<strong>Figura\s*(?:E\d+-)?\d+\.?<\/strong>\s*/i,'').replace(/^\s*Figura\s*(?:E\d+-)?\d+\.?\s*/i,'');
      caption.innerHTML='<strong>Figura '+String(n).padStart(2,'0')+'.</strong> '+markup;
    }
  });
  let t=0;
  document.querySelectorAll('table.paper-table,table.table-editorial').forEach(tab=>{
     if(tab.closest('[hidden],.technical-supplement'))return;
     const container=tab.closest('.paper-table-scroll,.table-editorial-wrap,.eco-table-wrap,.short-scroll');
     if(!container)return;
     if(container.dataset.tableNumber)return;
     container.dataset.tableNumber=String(++t);
     let existing=container.querySelector('h3');
     if(existing){existing.textContent=existing.textContent.replace(/^Tabla\s*(?:E\d+)?\d+\s*[·:.–-]\s*/iu,'');}
     const header=container.querySelector('.table-short-head span');
     if(header)header.textContent='Tabla '+String(t).padStart(2,'0');
     else{
       const cap=document.createElement('div');cap.className='paper-table-label';cap.textContent='Tabla '+String(t).padStart(2,'0');container.insertBefore(cap,container.firstChild);
     }
  });
}
function main(){
  if(!R||R.meta?.status!=='COMPLETADO'){
    if($('rvStatus'))$('rvStatus').textContent='Los resultados de comparación y continuidad se publicarán después de ejecutar los modelos en jocotoco1.';
    figureNumbers();return;
  }
  const um=R.unit_month||[],coverage=R.coverage||[],pairs=R.pairs||[],continuity=R.continuity||[],cf=R.continuity_models||[];
  const base=E?.points||[];
  const sites=new Set(base.map(x=>x.point_id));
  const stationDays=um.reduce((s,r)=>s+Number(r.station_days||0),0);
  const audios=um.reduce((s,r)=>s+Number(r.audios||0),0);
  const hours=um.reduce((s,r)=>s+Number(r.effort_h||0),0);
  const areas=[...new Set(um.map(x=>x.landscape))];
  if($('rvStatus'))$('rvStatus').textContent='Resultados estadísticos y territoriales derivados del monitoreo acústico de Jocotoco.';
  const taxonN=t=>base.filter(x=>x.taxon===t).length;
  const modelsN=[...new Set(coverage.map(x=>x.model_id))].length;
  if($('paperAbstract'))$('paperAbstract').innerHTML=`<p>Se estudió la evidencia ecoacústica de <i>Pyrrhura orcesi</i> y <i>Pyrrhura albipectus</i> en la red de monitoreo de la Fundación Jocotoco, organizada por paisaje, unidad de manejo y estación. El conjunto analizado comprende <strong>${fmt(base.length,0)} estaciones, ${fmt(audios,0)} grabaciones y ${fmt(hours,1)} horas de registro</strong>, distribuidas en <strong>${fmt(stationDays,0)} ocasiones estación–día</strong>. Se contrastaron <strong>${fmt(modelsN,0)} ${modelsN===1?'clasificador':'clasificadores'}</strong> mediante inferencias acústicas y referencias expertas temporalmente emparejadas, y se integraron elevación, cobertura del bosque y continuidad forestal reconstruida con MapBiomas (1985–2025).</p><p>Los modelos de respuesta ambiental cuantifican asociaciones con la señal acústica automatizada; las estimaciones de uso u ocupación requieren evaluar por separado detectabilidad y falsa identificación. Las diferencias de esfuerzo entre territorios y la selección dirigida de grabaciones revisadas se consideran al interpretar los resultados. Las estimaciones, intervalos y contrastes se presentan en las secciones siguientes.</p>`;
  const agg=new Map;
  for(const r of um){const key=r.landscape+'\u0001'+r.unit_name;
     if(!agg.has(key))agg.set(key,{landscape:r.landscape,unit:r.unit_name,months:0,stationDays:0,hours:0,audios:0,stations:0});
     const a=agg.get(key);a.months++;a.stationDays+=Number(r.station_days);a.hours+=Number(r.effort_h);a.audios+=Number(r.audios);a.stations=Math.max(a.stations,Number(r.stations));}
  // Station count per unit from original station inventory, not max simultaneously active stations.
  for(const r of agg.values())r.stations=base.filter(p=>p.landscape===r.landscape&&p.unit_name===r.unit).length||r.stations;
  const units=[...agg.values()].sort((a,b)=>a.landscape.localeCompare(b.landscape)||a.unit.localeCompare(b.unit));
  table('rvUnitTable',units,r=>`<tr><td>${html(r.landscape.replaceAll('_',' '))}</td><td>${html(r.unit)}</td><td>${fmt(r.stations,0)}</td><td>${fmt(r.stationDays,0)}</td><td>${fmt(r.hours,1)}</td><td>${fmt(r.audios,0)}</td></tr>`);
  const months=[...new Set(um.map(x=>x.year_month))].sort();
  const unitNames=[...new Set(um.map(x=>x.unit_name))].sort();
  plot('rvEffort',unitNames.map((u,i)=>({type:'bar',name:u,x:months,y:months.map(m=>um.filter(r=>r.year_month===m&&r.unit_name===u).reduce((s,r)=>s+r.effort_h,0)),marker:{color:['#245b47','#a46d46','#6e80a0','#78864c','#a86787'][i%5]}})),
       {barmode:'stack',xaxis:{title:'Mes de monitoreo',type:'category',tickangle:-40},yaxis:{title:'Horas de grabación por unidad de manejo'},margin:{l:83,r:20,t:40,b:112},legend:{orientation:'h',y:-.44}});
  table('rvCoverage',coverage.sort((a,b)=>a.taxon.localeCompare(b.taxon)||a.model_id.localeCompare(b.model_id)),r=>`<tr><td><i>${html(name(r.taxon))}</i></td><td>${html(mname(r.model_id))}</td><td>${r.taxonomic_level==='GENERO'?'Género + contexto geográfico':'Especie'}</td><td>${fmt(r.score_stations,0)}</td><td>${fmt(r.score_station_days,0)}</td><td>${fmt(r.reference_positives,0)}</td><td>${fmt(r.reference_discards,0)}</td></tr>`);
  table('rvPairedTable',pairs,r=>`<tr><td><i>${html(name(r.taxon))}</i></td><td>${html(mname(r.model_a))} / ${html(mname(r.model_b))}</td><td>${fmt(r.n_shared,0)}</td><td>${fmt(r.n_positive,0)} / ${fmt(r.n_discard,0)}</td><td>${fmt(r.auc_a,3)} / ${fmt(r.auc_b,3)}</td><td>${fmt(r.delta_auc,3)}</td><td>${r.delta_auc_lo!=null?fmt(r.delta_auc_lo,3)+' a '+fmt(r.delta_auc_hi,3):'no estimable'}</td></tr>`);
  const valid=pairs.filter(r=>r.n_positive>=5&&r.n_discard>=5&&r.delta_auc!=null);
  if(valid.length){plot('rvPairs',valid.map((r,i)=>({type:'bar',orientation:'h',name:name(r.taxon),y:[name(r.taxon)+' · '+mname(r.model_a)+' − '+mname(r.model_b)],x:[r.delta_auc],marker:{color:r.taxon==='Pyrrhura orcesi'?'#245b47':'#b36c49'},error_x:(r.delta_auc_lo!=null?{type:'data',symmetric:false,array:[Math.max(0,r.delta_auc_hi-r.delta_auc)],arrayminus:[Math.max(0,r.delta_auc-r.delta_auc_lo)]}:undefined),showlegend:false})),
       {barmode:'group',xaxis:{title:'Diferencia de AUC en los mismos intervalos expertos (A − B)',zeroline:true,zerolinecolor:'#222'},yaxis:{title:'Comparación de clasificadores'},margin:{l:215,r:30,t:35,b:72},height:Math.max(330,110*valid.length)});
  }else if($('rvPairs'))$('rvPairs').innerHTML='<p>No se identificaron conjuntos emparejados con ambas clases y tamaño suficiente para calcular una diferencia de AUC.</p>';
  const howmany=continuity.length;
  if(howmany){const un=[...new Set(continuity.map(r=>r.unit_name))].sort();
   plot('rvContinuity',un.map((u,i)=>({type:'box',name:u,y:continuity.filter(r=>r.unit_name===u&&r.continuous_mean_years_2025!=null).map(r=>r.continuous_mean_years_2025),boxpoints:'outliers',marker:{color:['#245b47','#9a7447','#587e90','#a8755e'][i%4]}})),
      {yaxis:{title:'Continuidad media de bosque clasificado (años, radio 500 m)',rangemode:'tozero'},xaxis:{title:'Unidad de manejo',automargin:true,tickangle:-15},margin:{l:92,r:18,t:40,b:90}});
  }else if($('rvContinuity'))$('rvContinuity').textContent='El análisis de continuidad requiere los 41 mapas anuales existentes en jocotoco1.';
  table('rvContinuityFits',cf,r=>`<tr><td><i>${html(name(r.taxon))}</i></td><td>${fmt(r.n_stations,0)}</td><td>${fmt(r.n_station_days,0)}</td><td>${r.status==='AJUSTADO_CONDICIONAL'?fmt(r.odds_ratio_decade,3):'no estimable'}</td><td>${r.ci_lo!=null?fmt(r.ci_lo,3)+'–'+fmt(r.ci_hi,3):'no estimable'}</td><td>${fmt(r.brier_spatial_cv,4)}</td><td>${fmt(r.brier_baseline_spatial_cv,4)}</td></tr>`);
  if($('rvInterpretation')){
    const eligible=pairs.filter(r=>r.n_shared>=20);
    $('rvInterpretation').innerHTML=`<p>Los ${fmt(coverage.length,0)} perfiles de modelo disponibles para las dos especies cubren diferentes estaciones y periodos. Se identificaron ${fmt(pairs.length,0)} comparaciones por pares, de las cuales ${fmt(eligible.length,0)} comparten al menos veinte intervalos de referencia. Comparar modelos sobre <em>los mismos intervalos</em> evita atribuir a la calidad del algoritmo diferencias producidas por utilizar muestras distintas. La referencia humana es selectiva; por ello, estas métricas describen el desempeño en el conjunto revisado.</p><p>El clasificador jerárquico identifica el género <i>Pyrrhura</i>; cuando se interpreta en el contexto biogeográfico de Palanda–Tapichalaca, la atribución a <i>P. albipectus</i> se presenta como <em>inferencia combinada</em>, no como identificación acústica específica del modelo.</p>`;
  }
  if($('rvDiscussion')){
    const taxa=['Pyrrhura orcesi','Pyrrhura albipectus'];
    $('rvDiscussion').innerHTML=taxa.map(t=>{const fit=cf.find(r=>r.taxon===t),local=pairs.filter(r=>r.taxon===t&&r.auc_a!=null&&r.auc_b!=null);
      return `<p>Para <i>${html(name(t))}</i>, ${local.length?`se obtuvo${local.length===1?'':'uvieron'} ${local.length} contraste${local.length===1?'':'s'} emparejado${local.length===1?'':'s'} de discriminación acústica.`:'no existen suficientes intervalos emparejados para estimar diferencias de discriminación.'} ${fit?.status==='AJUSTADO_CONDICIONAL'?`Al incorporar continuidad forestal, la razón de posibilidades de superar el umbral automatizado por diez años adicionales de continuidad media fue ${fmt(fit.odds_ratio_decade,2)} (IC aproximado del 95 %: ${fmt(fit.ci_lo,2)}–${fmt(fit.ci_hi,2)}); no equivale a una razón de posibilidades de ocupación.`:'La asociación multivariable con continuidad forestal no fue estimable con los requisitos de ajuste.'}</p>`;
    }).join('');
  }
  if($('rvDownloads'))$('rvDownloads').innerHTML='<a href="tablas/coverage_v032.csv">Cobertura de modelos</a> · <a href="tablas/pairs_v032.csv">Comparaciones emparejadas</a> · <a href="tablas/paired_references_v032.csv">Intervalos expertos emparejados</a> · <a href="tablas/unit_month_v032.csv">Esfuerzo territorial mensual</a> · <a href="tablas/continuity_v032.csv">Continuidad forestal</a> · <a href="tablas/continuity_models_v032.csv">Modelos de continuidad</a> · <a href="references.bib">Referencias BibTeX</a>';
  figureNumbers();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{main();requestAnimationFrame(()=>figureNumbers());},{once:true});else main();
})();
