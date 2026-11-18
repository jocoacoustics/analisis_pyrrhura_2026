/* Pyrrhura 2026 · UX v0.1.6. Solo datos reales exportados desde SQLite/JD.
   Sitio sin datos: vacío explícito, jamás usa la maqueta sintética v0.1.5.7. */
(()=>{'use strict';
const D=window.PYRRHURA_DATA||{meta:{state:'PENDIENTE_EXPORTACION'},points:[],daily:[],candidates:[]};
const $=id=>document.getElementById(id);
const all=Array.isArray(D.points)?D.points:[], allDaily=Array.isArray(D.daily)?D.daily:[], allCandidates=Array.isArray(D.candidates)?D.candidates:[];
const allEvaluations=Array.isArray(D.evaluations)?D.evaluations:[];
const HAS_REAL=D.meta?.state==='DATOS_REALES_EXPORTADOS'&&all.length>0;
const CAMPS=[...new Set(all.map(p=>p.campaign))].sort();
const pal=['#015486','#A88529','#80973E','#942F16','#765c9d','#007f80','#b05b3f'];
const C=Object.fromEntries(CAMPS.map((x,i)=>[x,pal[i%pal.length]]));
const SP={'P. orcesi':'#015486','P. albipectus':'#80973E'};
const frInt=new Intl.NumberFormat('es-EC',{maximumFractionDigits:0}); const frDec=new Intl.NumberFormat('es-EC',{minimumFractionDigits:1,maximumFractionDigits:1});
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sum=(arr,k)=>arr.reduce((n,x)=>n+(+x[k]||0),0);
let current=[],currentDaily=[],tablePage=0,sortCol='id',sortAsc=true,tab='human',leafletMap=null,layerGroups=null,labGroup=null,starGroup=null,rejectGroup=null,jdGroup=null,loadedMode='pending',mapFilters={},nativeControl=null;
let chartResizeTimer,initDone=false;let fallbackActiveCamps=new Set(CAMPS),fallbackShowHuman=true,fallbackShowRejected=false,fallbackShowIds=false;
function icon(name){return `<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-${name}"></use></svg>`;}
function toMonth(date){return date.slice(0,7)};
function months(){return [...new Set(allDaily.map(x=>toMonth(x.date)))].sort();}
const monthFormat=s=>new Date(`${s}-01T12:00:00`).toLocaleDateString('es-EC',{month:'short',year:'2-digit'});
function getFilters(){return {s:$('speciesFilter').value,u:$('unitFilter').value,c:$('campaignFilter').value};}
function populateFilters(){let f=getFilters();const units=[...new Set(all.filter(p=>f.s==='all'||p.species===f.s).map(p=>p.unit))].sort();
$('unitFilter').innerHTML='<option value="all">Todas las unidades</option>'+units.map(u=>`<option value="${escapeHtml(u)}">${escapeHtml(u)}</option>`).join('');
if(units.includes(f.u))$('unitFilter').value=f.u; else $('unitFilter').value='all';
$('campaignFilter').innerHTML='<option value="all">Todas las cohortes</option>'+CAMPS.map(c=>`<option>${escapeHtml(c)}</option>`).join('');
if(CAMPS.includes(f.c))$('campaignFilter').value=f.c;
}
function filtered(){const f=getFilters();current=all.filter(p=>(f.s==='all'||f.s===p.species)&&(f.u==='all'||f.u===p.unit)&&(f.c==='all'||f.c===p.campaign));const ids=new Set(current.map(p=>p.id));currentDaily=allDaily.filter(d=>ids.has(d.point));return current;}
function setKpis(){const vals=[current.length,sum(current,'n_wav'),sum(current,'hours'),sum(current,'days')];['kpiStations','kpiWav','kpiHours','kpiDays'].forEach((id,i)=>$(id).textContent=i===2?frDec.format(vals[i]):frInt.format(vals[i]));$('mapSummary').textContent=`${frInt.format(current.length)} estaciones con datos reales · ${new Set(current.map(p=>p.unit)).size} unidades`;}
function refresh(){filtered();setKpis();updateMap();renderTime();renderHeat();renderDist();renderEvidence();renderModel();renderEvaluations();tablePage=0;updateShortTable();updateTable();}
function initNav(){const app=$('app'),mq=window.matchMedia('(max-width:950px)');const stored=localStorageSafeGet('observatorio_sidebar');if(stored==='collapsed'&&!mq.matches)app.classList.add('collapsed');
const toggleSidebar=()=>{if(mq.matches){app.classList.toggle('mobile-open');return;}app.classList.toggle('collapsed');localStorageSafeSet('observatorio_sidebar',app.classList.contains('collapsed')?'collapsed':'expanded');$('brandToggle').setAttribute('aria-expanded',String(!app.classList.contains('collapsed')));resizeSoon();};
$('collapseSide').addEventListener('click',toggleSidebar);
$('brandToggle').addEventListener('click',toggleSidebar);
$('brandToggle').setAttribute('aria-expanded',String(!app.classList.contains('collapsed')));
$('restoreSide').addEventListener('click',()=>{app.classList.remove('collapsed');localStorageSafeSet('observatorio_sidebar','expanded');resizeSoon();});
$('mobileSide').addEventListener('click',()=>app.classList.add('mobile-open'));
$('shade').addEventListener('click',()=>app.classList.remove('mobile-open'));
document.querySelectorAll('.toc-link').forEach(a=>a.addEventListener('click',()=>app.classList.remove('mobile-open')));
mq.addEventListener('change',()=>{app.classList.remove('mobile-open');resizeSoon();});
const anchors=[...document.querySelectorAll('[data-section]')];if('IntersectionObserver' in window){const observer=new IntersectionObserver(items=>{for(const e of items){if(e.isIntersecting)document.querySelectorAll('.toc-link').forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+e.target.id));}},{rootMargin:'-10% 0px -75% 0px',threshold:0});anchors.forEach(x=>observer.observe(x));}
$('sideSearch').addEventListener('input',e=>{const q=e.target.value.trim().toLowerCase();document.querySelectorAll('.toc-link').forEach(a=>a.hidden=!!q&&!a.dataset.title.toLowerCase().includes(q));});
$('openSearch').addEventListener('click',openSearch);$('closeSearch').addEventListener('click',closeSearch);document.querySelectorAll('[data-close-search]').forEach(e=>e.addEventListener('click',closeSearch));$('globalSearch').addEventListener('input',searchItems);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeSearch();closePoint();app.classList.remove('mobile-open');}if(e.key==='/'&&!/input|textarea|select/i.test(document.activeElement?.tagName||'')&&!e.ctrlKey&&!e.metaKey){e.preventDefault();openSearch();}});
$('backTop').addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
$('copySummary').addEventListener('click',async()=>{const text=`Pyrrhura v0.1.6 | ${current.length} puntos con datos cotejados, ${sum(current,'n_wav')} WAV, ${frDec.format(sum(current,'hours'))} horas`;try{await navigator.clipboard.writeText(text);}catch{const t=document.createElement('textarea');t.value=text;document.body.append(t);t.select();document.execCommand('copy');t.remove();}const b=$('copySummary');b.textContent='✓ Copiado';setTimeout(()=>b.innerHTML=icon('copy')+' Copiar resumen',1400);});
function openSearch(){$('searchDialog').hidden=false;$('globalSearch').value='';searchItems();$('globalSearch').focus();}function closeSearch(){$('searchDialog').hidden=true;}
function searchItems(){const q=$('globalSearch').value.toLowerCase().trim();const items=[...document.querySelectorAll('.toc-link')].filter(a=>!q||a.textContent.toLowerCase().includes(q)||a.dataset.title.toLowerCase().includes(q));$('searchItems').innerHTML=items.length?items.map(a=>`<a href="${a.getAttribute('href')}" data-search-link>${escapeHtml(a.querySelector('.toc-index')?.textContent||'')} · ${escapeHtml(a.dataset.title)}</a>`).join(''):'<p style="padding:10px 14px;color:#888">No se encontraron secciones.</p>';$('searchItems').querySelectorAll('a').forEach(a=>a.addEventListener('click',closeSearch));}
window.addEventListener('scroll',()=>{$('backTop').hidden=window.scrollY<300;},{passive:true});$('backTop').hidden=true;
window.addEventListener('resize',resizeSoon);
if(window.ResizeObserver){const ro=new ResizeObserver(()=>resizeSoon());ro.observe($('main'));}
}
function localStorageSafeGet(k){try{return localStorage.getItem(k)}catch{return null}}
function localStorageSafeSet(k,v){try{localStorage.setItem(k,v)}catch{}}
function resizeSoon(){clearTimeout(chartResizeTimer);chartResizeTimer=setTimeout(()=>{if(leafletMap)leafletMap.invalidateSize();if(window.Plotly){document.querySelectorAll('.plot').forEach(d=>{if(d.data)try{Plotly.Plots.resize(d)}catch{}})}},230);}
function setupFilters(){populateFilters();$('speciesFilter').addEventListener('change',()=>{populateFilters();$('campaignFilter').value='all';refresh();});['unitFilter','campaignFilter'].forEach(id=>$(id).addEventListener('change',refresh));$('resetFilters').addEventListener('click',()=>{$('speciesFilter').value='all';$('unitFilter').value='all';$('campaignFilter').value='all';populateFilters();refresh();});}
function plotLayout(extra={}){return Object.assign({paper_bgcolor:'#fff',plot_bgcolor:'#fff',font:{family:'Inter, Arial, sans-serif',color:'#58635a',size:11},margin:{t:15,b:85,l:65,r:22},showlegend:true,legend:{orientation:'h',x:0,y:-.24,xanchor:'left',yanchor:'top',font:{size:10}},hovermode:'closest',xaxis:{showgrid:false,automargin:true,linecolor:'#d2d7ca',tickfont:{size:10},title:{font:{size:11}}},yaxis:{gridcolor:'#edf0e9',zeroline:false,automargin:true,title:{font:{size:11}}}},extra);}
const plotConfig={responsive:true,displaylogo:false,scrollZoom:false,modeBarButtonsToRemove:['lasso2d','select2d','autoScale2d','toggleSpikelines','zoomIn2d','zoomOut2d'],toImageButtonOptions:{format:'png',filename:'pyrrhura_datos_reales',scale:2}};
function displayPlot(id,traces,layout){const el=$(id);if(!window.Plotly){el.innerHTML='<div style="padding:30px;color:#856e43">Plotly no está disponible.</div>';return;}Plotly.react(el,traces,layout,plotConfig).catch(e=>console.error('Plot error',id,e));}
function monthlyData(group){const groups=group==='species'?['P. orcesi','P. albipectus']:CAMPS;const key=group==='species'?'species':'campaign';const mm=months();return groups.map(g=>({g,key,x:mm,y:mm.map(m=>+sum(currentDaily.filter(d=>d[key]===g&&toMonth(d.date)===m),'hours').toFixed(1))}));}
function renderTime(){const grp=$('timeGroup').value;const mode=$('timeMode').value;let groups=monthlyData(grp);const traces=groups.map(({g,x,y})=>{if(mode==='cumulative'){let total=0;y=y.map(v=>+(total+=v).toFixed(1));}return {name:g,type:'scatter',mode:'lines+markers',line:{width:2.5,color:SP[g]||C[g],shape:'linear'},marker:{size:6,color:SP[g]||C[g]},x:x.map(monthFormat),y,hovertemplate:`<b>${escapeHtml(g)}</b><br>%{x}<br>%{y:.1f} horas<extra></extra>`};});
if(mode==='bar')for(let t of traces){t.type='bar';delete t.mode;delete t.line;t.marker={color:SP[t.name]||C[t.name]};}const l=plotLayout({barmode:'group',xaxis:{title:{text:'Mes de monitoreo'},type:'category',showgrid:false,tickangle:-25,automargin:true},yaxis:{title:{text:mode==='bar'?'Horas registradas':'Horas acumuladas'},gridcolor:'#edf0e9',rangemode:'tozero'},margin:{t:14,b:90,l:65,r:22},legend:{orientation:'h',x:0,y:-.3}});displayPlot('timePlot',traces,l);}
function renderHeat(){const mm=months(),units=[...new Set(current.map(p=>p.unit))].sort();const z=units.map(unit=>mm.map(m=>{const ds=currentDaily.filter(d=>d.unit===unit&&toMonth(d.date)===m);return ds.length?+sum(ds,'hours').toFixed(1):null}));displayPlot('heatPlot',[{type:'heatmap',x:mm.map(monthFormat),y:units,z,colorscale:[[0,'#f4f5ec'],[.3,'#cbd6b0'],[.6,'#8a9d59'],[1,'#485e2b']],hoverongaps:false,hovertemplate:'%{y}<br>%{x}<br>%{z:.1f} horas<extra></extra>',colorbar:{title:{text:'Horas',side:'top',font:{size:10}},len:.72,thickness:12,x:1.02}}],plotLayout({margin:{t:8,b:90,l:125,r:70},xaxis:{title:{text:'Mes de monitoreo'},tickangle:-32,showgrid:false,automargin:true},yaxis:{title:{text:'Unidad'},automargin:true},showlegend:false}));}
function renderDist(){const species=['P. orcesi','P. albipectus'];const traces=species.map(s=>({type:'box',name:s,y:current.filter(p=>p.species===s).map(p=>p.hours),marker:{color:SP[s],size:5},line:{color:SP[s]},fillcolor:s==='P. orcesi'?'#e5eef3':'#eef3e1',boxpoints:'outliers',jitter:.2,hovertemplate:'%{y:.1f} h<extra>'+escapeHtml(s)+'</extra>'})).filter(t=>t.y.length);displayPlot('distPlot',traces,plotLayout({margin:{t:8,b:80,l:65,r:20},xaxis:{title:{text:'Especie'},showgrid:false},yaxis:{title:{text:'Horas por estación'},gridcolor:'#edf0e9'},showlegend:false}));}
function renderEvidence(){
 const group=['P. orcesi','P. albipectus'].filter(s=>current.some(p=>p.species===s));
 let traces=[], title='',sub='',caption='';
 if(tab==='human'){
  title='Evidencia humana por fuente'; sub='Anotaciones JD y revisiones Railway: no son la misma unidad estadística.';
  caption='<strong>Figura 05.</strong> Conteos de adjudicaciones por especie y origen, heredados del atlas real v0.1.5.2; no corresponden a individuos ni a días independientes.';
  traces=[{name:'JD · positivos históricos',field:'jd_pos',color:'#A88529'},
          {name:'Railway · positivos revisados',field:'railway_pos',color:'#015486'},
          {name:'Railway · descartes explícitos',field:'railway_rejects',color:'#942F16'}].map(v=>({type:'bar',name:v.name,x:group,y:group.map(s=>sum(current.filter(p=>p.species===s),v.field)),marker:{color:v.color}}));
 } else if(tab==='models'){
  title='Candidatos automáticos seleccionados';sub='No equivalen al universo completo de inferencias ni confirman presencia.';
  caption='<strong>Figura 05.</strong> Candidatos por especie del atlas v0.1.5.2; los tres clasificadores tienen cobertura y calibración distintas.';
  traces=[{type:'bar',name:'Ventanas candidatas',x:group,y:group.map(s=>sum(current.filter(p=>p.species===s),'candidates')),marker:{color:'#80973E'}}];
 } else {
  title='Cobertura y revisión';sub='WAV, días con audio y WAV revisados son denominadores diferentes.';
  caption='<strong>Figura 05.</strong> Contajes auditados; revisión no equivale necesariamente a identificación positiva.';
  traces=[{type:'bar',name:'Días con audio',x:group,y:group.map(s=>sum(current.filter(p=>p.species===s),'days')),marker:{color:'#80973E'}},
         {type:'bar',name:'WAV con referencia humana',x:group,y:group.map(s=>sum(current.filter(p=>p.species===s),'reviewed')),marker:{color:'#942F16'}}];
 }
 $('evidenceTitle').textContent=title;$('evidenceSubtitle').textContent=sub;$('evidenceCaption').innerHTML=caption;
 displayPlot('evidencePlot',traces,plotLayout({barmode:'group',margin:{t:12,b:100,l:60,r:20},xaxis:{title:{text:'Especie'}},yaxis:{title:{text:'Número de registros (según serie)'},rangemode:'tozero',gridcolor:'#edf0e9'},legend:{orientation:'h',x:0,y:-.3}}));
}
function renderModel(){
 const model=$('modelSelect').value,thr=+$('threshold').value/100;
 $('thresholdValue').textContent=thr.toFixed(2).replace('.',',');
 const names={general:'Clasificador_Especies_V1',hier:'Clasificador_Pyrrhura_Jerarquico',unique:'Clasificador_Pyrrhuras_Unico'};
 const ids=new Set(current.map(p=>p.id));
 const cands=allCandidates.filter(c=>c.model_id===names[model]&&ids.has(String(c.point_id))&&Number.isFinite(+c.score));
 if(!cands.length){$('modelPlot').innerHTML='<p class="data-unavailable">No hay candidatos verificables de este modelo en los filtros seleccionados. No se inventan scores.</p>';return;}
 const max=20000, chosen=cands.slice(0,max);
 let raw=[{type:'scattergl',name:'Score de candidato real',mode:'markers',x:chosen.map((_,i)=>i+1),y:chosen.map(c=>+c.score),marker:{color:chosen.map(c=>+c.score>=thr?'#942F16':'#80973E'),size:6,opacity:.82},
 text:chosen.map(c=>`${escapeHtml(c.point_id)} · WAV ${escapeHtml(c.file_id)} · ${escapeHtml(c.label)}`),hovertemplate:'%{text}<br>Score %{y:.4f}<extra></extra>'},
 {type:'scatter',name:`Umbral exploratorio ${thr.toFixed(2)}`,mode:'lines',x:[1,chosen.length],y:[thr,thr],line:{color:'#A88529',width:2,dash:'dash'},hoverinfo:'skip'}];
 displayPlot('modelPlot',raw,plotLayout({margin:{t:13,b:85,l:70,r:24},xaxis:{title:{text:'Ventanas candidatas del atlas (orden de exportación)'},showgrid:false},yaxis:{title:{text:'Score crudo del clasificador'},range:[0,1],gridcolor:'#edf0e9'},legend:{orientation:'h',x:0,y:-.27}}));
}

function renderEvaluations(){
 const body=$('evaluationTableBody');if(!body)return;
 const species=new Set(current.map(p=>p.species==='P. orcesi'?'Pyrrhura orcesi':'Pyrrhura albipectus'));
 const rows=allEvaluations.filter(e=>species.has(e.taxon));
 const v=x=>x==null||!Number.isFinite(+x)?'No estimable':Number(x).toFixed(3).replace('.',',');
 body.innerHTML=rows.length?rows.map(e=>`<tr><th scope="row"><em>${escapeHtml(e.taxon)}</em></th><td title="${escapeHtml(e.score_label)}">${escapeHtml(e.model_id)}</td><td>${frInt.format(e.n_pos)}</td><td>${frInt.format(e.n_neg)}</td><td>${v(e.auc)}</td><td>${v(e.ap)}</td><td title="${escapeHtml(e.caveat)}">${escapeHtml(e.status)}</td></tr>`).join(''):'<tr><td colspan="7">Aún no hay métricas E2 para estos filtros. No se simulan resultados.</td></tr>';
}
function initPlotControls(){['timeMode','timeGroup'].forEach(id=>$(id).addEventListener('change',renderTime));document.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>{tab=btn.dataset.tab;document.querySelectorAll('[data-tab]').forEach(x=>{let is=x===btn;x.classList.toggle('active',is);x.setAttribute('aria-selected',String(is));});renderEvidence();}));$('modelSelect').addEventListener('change',renderModel);$('threshold').addEventListener('input',renderModel);document.querySelectorAll('[data-expand]').forEach(b=>b.addEventListener('click',async()=>{const el=$(b.dataset.expand);try{if(document.fullscreenElement===el)await document.exitFullscreen();else await el.requestFullscreen();}catch{console.warn('Pantalla completa no permitida en este navegador');}setTimeout(resizeSoon,250);}));document.addEventListener('fullscreenchange',()=>setTimeout(resizeSoon,180));document.querySelectorAll('[data-download]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.download==='time'){const rows=monthlyData($('timeGroup').value).flatMap(g=>g.x.map((m,i)=>({grupo:g.g,mes:m,horas:g.y[i]})));saveCSV('pyrrhura_esfuerzo_temporal.csv',rows,['grupo','mes','horas']);}}));document.querySelectorAll('details.math-details').forEach(el=>el.addEventListener('toggle',()=>{if(el.open&&window.MathJax?.typesetPromise)MathJax.typesetPromise([el]).catch(()=>{});}));}
async function showPoint(p){
 if(!p)return;
 // Un fullscreen de Leaflet es otra top layer: salir antes de mostrar la ficha.
 if(document.fullscreenElement && document.exitFullscreen){
  try{await document.exitFullscreen();}catch(err){console.warn('No se pudo cerrar pantalla completa',err);}
 }
 if(leafletMap && typeof leafletMap.closePopup==='function')leafletMap.closePopup();
 const models=(p.models||[]).map(m=>`<tr><td>${escapeHtml(m.model)}</td><td>${escapeHtml(m.kind)}</td><td>${m.max_score==null?'No disponible':Number(m.max_score).toFixed(4)}</td><td>${frInt.format(m.n_wav||0)}</td></tr>`).join('');
 const selected=allCandidates.filter(c=>String(c.point_id)===p.id).slice(0,12);
 const candidates=selected.map(c=>`<tr><td>${escapeHtml(c.model)}</td><td>${escapeHtml(c.file_id)}</td><td>${escapeHtml(c.date)}</td><td>${Number(c.score).toFixed(4)}</td></tr>`).join('');
 $('pointDetail').innerHTML=`<div style="font-size:10px;font-weight:800;letter-spacing:.1em;color:#a88529">FICHA DE ESTACIÓN · DATOS REALES</div><h3>${escapeHtml(p.id)}</h3>
 <p>${escapeHtml(p.species)} · ${escapeHtml(p.unit)} · ${escapeHtml(p.campaign)} (no equivale a campaña histórica)</p>
 <div class="point-meta"><div><span>WAV</span><strong>${frInt.format(p.n_wav)}</strong></div><div><span>Horas con duración conocida</span><strong>${frDec.format(p.hours)} h</strong></div><div><span>Días con grabación</span><strong>${p.days}</strong></div><div><span>JD · positivos</span><strong>${p.jd_pos}</strong></div><div><span>Railway · positivos</span><strong>${p.railway_pos}</strong></div><div><span>Railway · descartes WAV</span><strong>${p.railway_rejects}</strong></div><div><span>Candidatos IA</span><strong>${p.candidates}</strong></div><div><span>WAV con revisión humana</span><strong>${p.reviewed==null?'No disponible':frInt.format(p.reviewed)}</strong></div></div>
 <p><strong>Coordenadas originales:</strong> ${String(p.lat)}, ${String(p.lon)}<br/><small>${escapeHtml(p.coordinate_source)}</small></p>
 <p><strong>Estado:</strong> ${escapeHtml(p.status)}. Los descartes de Railway no demuestran ausencia de la especie en el sitio.</p>
 <div class="point-subtable"><h4>Clasificadores (agregados por punto)</h4><table><thead><tr><th>Modelo</th><th>Nivel</th><th>Máx. score</th><th>WAV procesados</th></tr></thead><tbody>${models||'<tr><td colspan="4">Sin cobertura documentada</td></tr>'}</tbody></table></div>
 <div class="point-subtable"><h4>Candidatos seleccionados (máximo 12 de ${p.candidates})</h4><table><thead><tr><th>Modelo</th><th>WAV</th><th>Fecha</th><th>Score</th></tr></thead><tbody>${candidates||'<tr><td colspan="4">Sin candidatos</td></tr>'}</tbody></table></div>
 <p class="point-footer">Datos originales derivados del atlas E2, GPS cotejado con JD. Positivo humano, candidato IA y descarte son evidencias diferentes.</p>`;
 const modal=$('pointModal');
 modal.hidden=false;
 if(typeof modal.showModal==='function'&&!modal.open)modal.showModal();
 document.body.classList.add('point-modal-open');
 $('closePoint').focus({preventScroll:true});
}
function closePoint(){
 const modal=$('pointModal');
 if(modal.open&&typeof modal.close==='function')modal.close();
 modal.hidden=true;document.body.classList.remove('point-modal-open');
}
function initPoint(){
 document.querySelectorAll('[data-close-point]').forEach(e=>e.addEventListener('click',closePoint));
 $('closePoint').addEventListener('click',closePoint);
 $('pointModal').addEventListener('cancel',e=>{e.preventDefault();closePoint();});
}
// ============================================================
// SIG de Scytalopus: L.control.layers NATIVO; iconos y checks.
// NO superficies ni ráster. GPS solo desde exportación verificada.
// ============================================================
function popupFor(p){
 const rejected=p.railway_rejects;
 return `<div class="sig-popup"><div class="sig-title">${escapeHtml(p.id)} <small>GPS ORIGINAL</small></div>
 <div class="sig-popgrid"><span>Especie</span><strong>${escapeHtml(p.species)}</strong>
 <span>Unidad</span><strong>${escapeHtml(p.unit)}</strong>
 <span>Año inicio</span><strong>${escapeHtml(p.campaign)}</strong>
 <span>WAV</span><strong>${frInt.format(p.n_wav)}</strong>
 <span>Esfuerzo</span><strong>${frDec.format(p.hours)} h</strong>
 <span>Revisiones</span><strong>${frInt.format(p.reviewed)}</strong>
 <span>JD · identificaciones</span><strong>${frInt.format(p.jd_pos)}</strong>
 <span>Railway · aprobados</span><strong>${frInt.format(p.railway_pos)}</strong>
 <span>Railway · descartes</span><strong>${frInt.format(rejected)}</strong></div>
 <button type="button" class="sig-detail-button" data-map-point="${escapeHtml(p.id)}">Ver ficha completa</button></div>`;
}
function sigIcon(symbol,color){return L.divIcon({className:'sig-divicon',html:`<span style="color:${color}" class="sig-symbol">${symbol}</span>`,iconSize:[27,27],iconAnchor:[13,13]});}
function sigLabel(p){return L.divIcon({className:'sig-divicon',html:`<span class="sig-label">${escapeHtml(p.id)}</span>`,iconSize:[62,17],iconAnchor:[-7,16]});}
function makeMapData(){
 for(const camp of CAMPS)layerGroups[camp].clearLayers();
 [labGroup,starGroup,rejectGroup,jdGroup].forEach(g=>g.clearLayers());
 const byLocation=new Map(),bounds=[];
 for(const p of current){
  const key=`${p.lat}|${p.lon}`;
  if(!byLocation.has(key)){byLocation.set(key,[]);bounds.push([p.lat,p.lon]);}
  byLocation.get(key).push(p);
 }
 for(const site of byLocation.values()){
  const p=site[0],coords=[p.lat,p.lon];
  const buttons=site.map(x=>`<button type="button" class="sig-detail-button" data-map-point="${escapeHtml(x.id)}">${escapeHtml(x.id)} · ${escapeHtml(x.unit)}</button>`).join('');
  const popup=site.length===1?popupFor(p):`<div class="sig-popup"><div class="sig-title">${site.length} registros en las mismas coordenadas</div><p>Lat: ${p.lat}, Lon: ${p.lon}. Sin desplazamientos.</p>${buttons}</div>`;
  const camps=[...new Set(site.map(x=>x.campaign))];
  for(const camp of camps){
    const marker=L.circleMarker(coords,{radius:7,color:'#252A28',weight:1.2,fillColor:C[camp],fillOpacity:.95});
    marker.bindPopup(popup,{maxWidth:320});marker.bindTooltip(site.map(x=>x.id).join(', ')+' · GPS original');
    layerGroups[camp].addLayer(marker);
  }
  const label=site.map(x=>x.id).join(' · ');
  labGroup.addLayer(L.marker(coords,{icon:L.divIcon({className:'sig-divicon',html:`<span class="sig-label">${escapeHtml(label)}</span>`,iconSize:[85,17],iconAnchor:[-7,16]}),interactive:false}));
  if(site.some(x=>x.railway_pos>0))starGroup.addLayer(L.marker(coords,{icon:sigIcon('★','#D4A017')}).bindTooltip('Railway · positivos revisados').bindPopup(popup));
  if(site.some(x=>x.railway_rejects>0))rejectGroup.addLayer(L.marker(coords,{icon:sigIcon('×','#C0392B')}).bindTooltip('Railway · descartes de WAV').bindPopup(popup));
  if(site.some(x=>x.jd_pos>0))jdGroup.addLayer(L.marker(coords,{icon:sigIcon('✦','#015486')}).bindTooltip('JD · positivos históricos').bindPopup(popup));
 }
 if(bounds.length){const filterJSON=JSON.stringify(getFilters());if(mapFilters.last!==filterJSON){leafletMap.fitBounds(bounds,{padding:[35,35],maxZoom:11});mapFilters.last=filterJSON;}}
}
function installScytalopusLayerControl(map,base,reference){
 const baseLayers={
  '<span class="base-icon">🛰️</span><b>Esri World Imagery</b>':base.esri,
  '<span class="base-icon">🗺️</span>OpenStreetMap':base.osm,
  '<span class="base-icon">⛰️</span>OpenTopoMap':base.openTopo,
  '<span class="base-icon">🧭</span>Esri Topographic':base.esriTopo
 };
 const overlays={};
 for(const c of CAMPS)overlays[`<span class="legend-dot" style="background:${C[c]}"></span>Cohorte · ${escapeHtml(c)}`]=layerGroups[c];
 overlays['<span class="legend-symbol" style="color:#D4A017">★</span>Railway · positivo aprobado']=starGroup;
 overlays['<span class="legend-symbol" style="color:#C0392B">×</span>Railway · descarte explícito']=rejectGroup;
 overlays['<span class="legend-symbol" style="color:#015486">✦</span>JD · identificación humana']=jdGroup;
 overlays['<span class="legend-symbol" style="color:#252A28;font-size:11px">ID</span>Identificadores']=labGroup;
 const emptySep=L.layerGroup();
 overlays['<span class="layer-separator-row"></span>']=emptySep;
 overlays['<span class="base-icon">🛣️</span>Carreteras']=reference.roads;
 overlays['<span class="base-icon">🏛️</span>División política y lugares']=reference.boundaries;
 overlays['<span class="base-icon">🌊</span>Ríos e hidrografía']=reference.hyd;
 const environmental=window.PYRRHURA_AMBIENTE||{};
 for(const f of (environmental.territorios?.features||[])){
   const name=(f.properties&&f.properties.nombre)||'Polígono territorial';
   const layer=L.geoJSON(f,{style:{color:'#00937A',weight:2.2,fillColor:'#30a286',fillOpacity:.05},
      onEachFeature:(feature,l)=>l.bindPopup('<strong>'+escapeHtml(name)+'</strong><br>Polígono original PostGIS')});
   if(!/SNAP/i.test(name))layer.addTo(map);overlays['<span class="base-icon">🟩</span>'+escapeHtml(name)]=layer;
 }
 for(const preview of (environmental.previews||[])){
   const l=L.imageOverlay(preview.url,preview.bounds,{opacity:.70,interactive:false});
   overlays['<span class="base-icon">🌿</span>'+escapeHtml(preview.name)]=l;
 }

 nativeControl=L.control.layers(baseLayers,overlays,{collapsed:true,position:'topright'}).addTo(map);
 // Separador visual inerte, sin checkbox. Uso exacto de control nativo.
 const box=nativeControl.getContainer();const overlaysBox=box.querySelector('.leaflet-control-layers-overlays');
 const sepLabel=[...overlaysBox.querySelectorAll('label')].find(e=>e.querySelector('.layer-separator-row'));
 if(sepLabel){sepLabel.querySelectorAll('input').forEach(i=>i.style.display='none');sepLabel.style.pointerEvents='none';sepLabel.classList.add('sig-divider');}
 const master=document.createElement('label');master.className='campaign-master-row';master.innerHTML='<span><input class="campaign-master-checkbox" type="checkbox"> <span class="legend-symbol" style="color:#252A28;font-size:14px">●</span><b>Todas las cohortes</b></span>';
 overlaysBox.prepend(master);const check=master.querySelector('input');
 function inputs(){return [...overlaysBox.querySelectorAll('label:not(.campaign-master-row)')].filter(row=>CAMPS.some(c=>(row.textContent||'').includes(`Cohorte · ${c}`))).map(row=>row.querySelector('input[type=checkbox]')).filter(Boolean)}
 let bulk=false;
 function sync(){if(bulk)return;const a=inputs(),n=a.filter(i=>i.checked).length;check.checked=a.length>0&&n===a.length;check.indeterminate=n>0&&n<a.length;}
 check.addEventListener('change',()=>{const v=check.checked;bulk=true;for(const item of inputs())if(item.checked!==v)item.click();bulk=false;sync();});
 map.on('overlayadd overlayremove',()=>setTimeout(sync,0));
 overlaysBox.addEventListener('change',e=>{if(e.target!==check)setTimeout(sync,0)});
 sync();
 return nativeControl;
}
function installZoomFullscreen(map){
 const zoom=document.querySelector('#leafletMap .leaflet-control-zoom');if(!zoom)return;
 const a=document.createElement('a');a.href='#';a.className='zoom-fullscreen';a.textContent='⛶';a.title='Pantalla completa';a.setAttribute('aria-label','Mapa en pantalla completa');a.setAttribute('role','button');zoom.append(a);
 L.DomEvent.on(a,'click',e=>{L.DomEvent.preventDefault(e);L.DomEvent.stopPropagation(e);const el=$('mapArea');if(!document.fullscreenElement)el.requestFullscreen?.();else document.exitFullscreen?.();});
 document.addEventListener('fullscreenchange',()=>setTimeout(()=>map.invalidateSize(),150));
}
function initMap(){
 if(window.L&&typeof L.map==='function'){
 try{
 const map=L.map('leafletMap',{zoomControl:true,preferCanvas:true,zoomSnap:.5}).setView([-4.08,-79.31],8);
 leafletMap=map;
 const esri=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:20,attribution:'Tiles © Esri'}).addTo(map);
 const osm=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'});
 const openTopo=L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',{maxZoom:17,attribution:'© OpenTopoMap'});
 const esriTopo=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',{maxZoom:20,attribution:'Tiles © Esri'});
 const roads=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',{maxZoom:20,opacity:.9,attribution:'Esri Transportation'});
 const boundaries=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',{maxZoom:20,opacity:.86,attribution:'Esri Boundaries & Places'});
 const hyd=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Hydro_Reference_Overlay/MapServer/tile/{z}/{y}/{x}',{maxZoom:20,opacity:.92,attribution:'Esri Hydro Reference'});
 layerGroups={};for(const c of CAMPS)layerGroups[c]=L.layerGroup().addTo(map);
 labGroup=L.layerGroup();starGroup=L.layerGroup().addTo(map);rejectGroup=L.layerGroup();jdGroup=L.layerGroup();
 installScytalopusLayerControl(map,{esri,osm,openTopo,esriTopo},{roads,boundaries,hyd});
 installZoomFullscreen(map);
 map.on('popupopen',e=>{e.popup.getElement()?.querySelectorAll('[data-map-point]').forEach(b=>b.addEventListener('click',()=>showPoint(current.find(p=>p.id===b.dataset.mapPoint))))});
 L.control.scale({imperial:false,metric:true}).addTo(map);
 loadedMode='leaflet';$('mapMode').textContent='Leaflet · GPS original cotejado';
 makeMapData();setTimeout(()=>map.invalidateSize(),140);
 let tilesLoaded=false;[esri,osm,openTopo,esriTopo].forEach(layer=>layer.on('tileload',()=>tilesLoaded=true));
 setTimeout(()=>{if(!tilesLoaded&&loadedMode==='leaflet'){
  loadedMode='fallback';$('mapMode').textContent='Cartografía de respaldo · sin teselas';
  $('fallbackMap').classList.add('is-visible');$('leafletMap').hidden=true;
  installFallbackLayers();drawFallback();
 }},7000);
 return;
 }catch(e){console.warn('Leaflet: no fue posible inicializar',e);}
 }
 loadedMode='fallback';$('mapMode').textContent='Cartografía de respaldo · sin Leaflet';$('fallbackMap').classList.add('is-visible');$('leafletMap').hidden=true;
 installFallbackLayers();drawFallback();
 // CDN alternativo si unpkg no carga. No inventa teselas ni altera coordenadas.
 if(!window.L&&!window.__leafletRetry){window.__leafletRetry=true;
  const link=document.createElement('link');link.rel='stylesheet';link.href='https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css';document.head.appendChild(link);
  const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js';
  script.onload=()=>{if(window.L&&loadedMode==='fallback'){
    $('leafletMap').hidden=false;$('fallbackMap').classList.remove('is-visible');$('fallbackLayers').hidden=true;loadedMode='pending';initMap();
  }};
  script.onerror=()=>{$('mapMode').textContent='Cartografía de respaldo · sin conexión';};document.head.appendChild(script);
 }
}
function updateMap(){if(loadedMode==='pending')return;if(loadedMode==='leaflet'&&leafletMap){makeMapData();return;}drawFallback();}
function installFallbackLayers(){
 const box=$('fallbackLayers');box.hidden=false;
 box.innerHTML='<div class="fallback-layer-title">CAPAS · VISOR SIN CONEXIÓN</div><div class="fallback-hint">Fondos Esri, OSM y OpenTopoMap requieren Leaflet e Internet.</div><label class="master"><input type="checkbox" data-master checked> <b>● Todas las cohortes</b></label>'+
 CAMPS.map(c=>`<label><input type="checkbox" data-camp="${escapeHtml(c)}" checked> <i style="background:${C[c]}"></i>${escapeHtml(c)}</label>`).join('')+
 '<div class="fallback-sep"></div><label><input type="checkbox" data-human checked> <b style="color:#d4a017">★</b> Positivo humano</label><label><input type="checkbox" data-rejected> <b style="color:#c0392b">×</b> Descarte</label><label><input type="checkbox" data-ids> ID Identificadores</label>';
 const master=box.querySelector('[data-master]'),camps=[...box.querySelectorAll('[data-camp]')];
 function sync(){const n=camps.filter(x=>x.checked).length;master.checked=n===camps.length;master.indeterminate=n>0&&n<camps.length;fallbackActiveCamps=new Set(camps.filter(x=>x.checked).map(x=>x.dataset.camp));drawFallback();}
 master.addEventListener('change',()=>{camps.forEach(x=>x.checked=master.checked);sync()});camps.forEach(x=>x.addEventListener('change',sync));
 box.querySelector('[data-human]').addEventListener('change',e=>{fallbackShowHuman=e.target.checked;drawFallback()});
 box.querySelector('[data-rejected]').addEventListener('change',e=>{fallbackShowRejected=e.target.checked;drawFallback()});
 box.querySelector('[data-ids]').addEventListener('change',e=>{fallbackShowIds=e.target.checked;drawFallback()});
}
function drawFallback(){
 const el=$('fallbackMap'),pts=current.length?current:all;
 if(!pts.length){el.innerHTML='<p class="data-unavailable">Aún no hay coordenadas reales exportadas. Ejecute el exportador en el servidor; no se muestran puntos simulados.</p>';return;}
 const lons=pts.map(p=>p.lon),lats=pts.map(p=>p.lat),minLon=Math.min(...lons)-.07,maxLon=Math.max(...lons)+.07,minLat=Math.min(...lats)-.07,maxLat=Math.max(...lats)+.07;
 const x=v=>((v-minLon)/(maxLon-minLon))*1000,y=v=>((maxLat-v)/(maxLat-minLat))*560;
 const geo=window.GEOGRAPHY||{};
 const paths=Object.values(geo).map(rings=>`<path class="map-background-polygon" d="${rings.map(r=>r.map(([lon,lat],i)=>`${i?'L':'M'}${x(lon).toFixed(1)} ${y(lat).toFixed(1)}`).join(' ')+'Z').join(' ')}"/>`).join('');
 const pins=current.filter(p=>fallbackActiveCamps.has(p.campaign)).map(p=>{
 const cx=x(p.lon),cy=y(p.lat),co=C[p.campaign];
 const symbol=fallbackShowHuman&&p.railway_pos>0?`<text x="${cx+9}" y="${cy-8}" fill="#D4A017" font-size="19">★</text>`:'';
 const reject=fallbackShowRejected&&p.railway_rejects>0?`<text x="${cx-18}" y="${cy-8}" fill="#C0392B" font-size="19">×</text>`:'';
 const label=fallbackShowIds?`<text x="${cx+9}" y="${cy+20}" class="sig-fallback-label">${escapeHtml(p.id)}</text>`:'';
 return `<g class="fallback-pin" role="button" tabindex="0" data-pid="${escapeHtml(p.id)}" aria-label="Ficha ${escapeHtml(p.id)}"><circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="6.5" fill="${co}" stroke="#252A28" stroke-width="1.3"/><title>${escapeHtml(p.id)}</title>${symbol}${reject}${label}</g>`;
 }).join('');
 el.innerHTML=`<svg viewBox="0 0 1000 560" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Puntos reales en mapa vectorial de respaldo"><rect width="1000" height="560" fill="#e8eee3"/>${paths}${pins}</svg>`;
 el.querySelectorAll('[data-pid]').forEach(g=>{const callback=()=>showPoint(current.find(p=>p.id===g.dataset.pid));g.addEventListener('click',callback);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();callback()}})});
}
function setupMapControls(){/* Toda la selección de capas se realiza dentro del control SIG. */}

function updateShortTable(){
 const out=$('summaryTableBody');if(!out)return;
 const sp=['P. orcesi','P. albipectus'];
 const records=sp.map(name=>({name,pts:current.filter(p=>p.species===name)})).filter(x=>x.pts.length);
 let html=records.map(x=>`<tr><th scope="row"><em>${escapeHtml(x.name)}</em></th><td>${frInt.format(x.pts.length)}</td><td>${frInt.format(sum(x.pts,'n_wav'))}</td><td>${frDec.format(sum(x.pts,'hours'))}</td><td>${frInt.format(sum(x.pts,'days'))}</td></tr>`).join('');
 if(records.length){html+=`<tr class="editorial-total"><th scope="row">Total mostrado</th><td>${frInt.format(current.length)}</td><td>${frInt.format(sum(current,'n_wav'))}</td><td>${frDec.format(sum(current,'hours'))}</td><td>${frInt.format(sum(current,'days'))}</td></tr>`;}
 out.innerHTML=html||'<tr><td colspan="5">Sin registros para estos filtros.</td></tr>';
}
const COLS=[{k:'id',label:'Punto',w:105},{k:'species',label:'Especie',w:125},{k:'unit',label:'Unidad',w:195},{k:'campaign',label:'Cohorte de inicio',w:155},{k:'n_wav',label:'WAV',w:95},{k:'hours',label:'Horas',w:95},{k:'days',label:'Días',w:85},{k:'human_pos',label:'Evid. humanas',w:123},{k:'reviewed',label:'WAV revisados',w:125},{k:'candidates',label:'Candidatos IA',w:121},{k:'max_score',label:'Score General V1',w:131}];
let colWidths=Object.fromEntries(COLS.map(c=>[c.k,c.w])),columnFilters={};
function buildTableHead(){let cols=COLS.map(c=>`<col data-col="${c.k}" style="width:${colWidths[c.k]}px;min-width:${colWidths[c.k]}px">`).join('');let old=$('dataTable').querySelector('colgroup');if(old)old.remove();$('dataTable').insertAdjacentHTML('afterbegin','<colgroup>'+cols+'</colgroup>');$('tableHead').innerHTML=COLS.map(c=>`<th style="width:${colWidths[c.k]}px"><button class="th-button" data-sort="${c.k}" aria-label="Ordenar por ${escapeHtml(c.label)}">${escapeHtml(c.label)} <span>${sortCol===c.k?(sortAsc?'↑':'↓'):'↕'}</span></button><span class="resize-handle" data-resize="${c.k}" title="Arrastrar para ajustar"></span></th>`).join('');$('tableFilters').innerHTML=COLS.map(c=>`<th style="width:${colWidths[c.k]}px"><input class="col-filter" data-filter="${c.k}" value="${escapeHtml(columnFilters[c.k]||'')}" aria-label="Filtrar ${escapeHtml(c.label)}" placeholder="Filtrar…"></th>`).join('');$('tableHead').querySelectorAll('[data-sort]').forEach(b=>b.addEventListener('click',()=>{if(sortCol===b.dataset.sort)sortAsc=!sortAsc;else{sortCol=b.dataset.sort;sortAsc=true;}tablePage=0;buildTableHead();updateTable();}));$('tableFilters').querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('input',()=>{columnFilters[b.dataset.filter]=b.value;tablePage=0;updateTable();}));$('tableHead').querySelectorAll('[data-resize]').forEach(h=>h.addEventListener('pointerdown',e=>{e.preventDefault();h.setPointerCapture(e.pointerId);const col=h.dataset.resize,start=e.clientX,was=colWidths[col];const move=ev=>{colWidths[col]=Math.max(74,Math.min(440,was+ev.clientX-start));applyColWidths();};const stop=()=>{h.removeEventListener('pointermove',move);h.removeEventListener('pointerup',stop);h.removeEventListener('pointercancel',stop);};h.addEventListener('pointermove',move);h.addEventListener('pointerup',stop);h.addEventListener('pointercancel',stop);}));}
function applyColWidths(){for(const c of COLS){const w=colWidths[c.k]+'px';const col=$('dataTable').querySelector(`col[data-col="${c.k}"]`);if(col){col.style.width=w;col.style.minWidth=w;}}$('tableHead').querySelectorAll('th').forEach((th,i)=>{th.style.width=colWidths[COLS[i].k]+'px'});$('tableFilters').querySelectorAll('th').forEach((th,i)=>{th.style.width=colWidths[COLS[i].k]+'px'});}
function fmtVal(v,k){if(['hours'].includes(k))return frDec.format(v);if(['max_score'].includes(k))return v==null?'No disponible':Number(v).toFixed(3).replace('.',',');if(typeof v==='number')return frInt.format(v);return v==null?'No disponible':String(v);}
function rowsMatching(){const q=$('tableSearch').value.toLowerCase().trim();const out=current.filter(p=>{if(q&&!COLS.some(c=>String(fmtVal(p[c.k],c.k)).toLowerCase().includes(q)))return false;return COLS.every(c=>!columnFilters[c.k]||String(fmtVal(p[c.k],c.k)).toLowerCase().includes(columnFilters[c.k].toLowerCase().trim()))});out.sort((a,b)=>{let av=a[sortCol],bv=b[sortCol],v=typeof av==='number'?av-bv:String(av??'').localeCompare(String(bv??''),'es');return sortAsc?v:-v;});return out;}
function updateTable(){const rows=rowsMatching(),pageSize=+$('pageSize').value,totalPages=Math.max(1,Math.ceil(rows.length/pageSize));tablePage=Math.max(0,Math.min(tablePage,totalPages-1));const slice=rows.slice(tablePage*pageSize,(tablePage+1)*pageSize);$('tableBody').innerHTML=slice.map(p=>`<tr>${COLS.map(c=>`<td title="${escapeHtml(fmtVal(p[c.k],c.k))}">${c.k==='id'?`<a href="#" data-point="${p.id}"><strong>${escapeHtml(p.id)}</strong></a>`:escapeHtml(fmtVal(p[c.k],c.k))}</td>`).join('')}</tr>`).join('')||`<tr><td colspan="${COLS.length}" style="padding:20px">Sin registros para estos filtros.</td></tr>`;$('tableCount').textContent=`${rows.length} estaciones · ${pageSize} filas por página`;$('pageInfo').textContent=`Página ${tablePage+1} de ${totalPages}`;$('prevPage').disabled=tablePage===0;$('nextPage').disabled=tablePage>=totalPages-1;$('tableBody').querySelectorAll('[data-point]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();showPoint(current.find(p=>p.id===a.dataset.point));}));}
function saveCSV(filename,rows,cols){const esc=v=>'"'+String(v??'').replaceAll('"','""')+'"';const csv='\uFEFF'+[cols.map(esc).join(';'),...rows.map(r=>cols.map(c=>esc(r[c])).join(';'))].join('\r\n');const u=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=u;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),3000);}
function initTable(){buildTableHead();$('tableSearch').addEventListener('input',()=>{tablePage=0;updateTable();});$('pageSize').addEventListener('change',()=>{tablePage=0;updateTable();});$('prevPage').addEventListener('click',()=>{tablePage--;updateTable();});$('nextPage').addEventListener('click',()=>{tablePage++;updateTable();});$('csvExport').addEventListener('click',()=>saveCSV('pyrrhura_estaciones_reales.csv',rowsMatching(),COLS.map(c=>c.k).concat(['lat','lon','status','unit_id'])));$('autoColumns').addEventListener('click',()=>{for(const c of COLS){let mx=c.label.length;for(const p of current.slice(0,80))mx=Math.max(mx,String(fmtVal(p[c.k],c.k)).length);colWidths[c.k]=Math.max(75,Math.min(230,Math.round(mx*7.1+31)));}applyColWidths();});}
function updateAmbientSummary(){
 const root=$('ambientStats');if(!root)return;
 const rows=(window.PYRRHURA_AMBIENTE||{}).statistics||[];
 if(!rows.length){root.textContent='Pendiente de extracción: todavía no hay indicadores ambientales completos de Earth Engine.';return;}
 const p=v=>v==null?'Sin dato':Number(100*v).toFixed(1).replace('.',',')+' %';
 root.innerHTML=rows.map(r=>{const start=r.forest?.['1985']?.fraction,end=r.forest?.['2025']?.fraction;
  const diff=start!=null&&end!=null?((end-start)*100).toFixed(1).replace('.',',')+' pp':'No calculado';
  return `<article class="ambient-stat"><strong>${escapeHtml(r.name)}</strong><span>${frDec.format(r.area_km2)} km² · ${r.n_points} puntos · ${r.n_external} fuera del área contextual inicial</span><span>Bosque 1985: ${p(start)} · Bosque 2025: ${p(end)} · Diferencia: ${diff}</span></article>`;
 }).join('');
}
function main(){if(!HAS_REAL){$('dataStatus').textContent='Sin publicación científica: falta exportar en servidor las coordenadas exactas';$('dataStatus').classList.add('pending');}else{$('dataStatus').textContent='Registros reales verificados en servidor · GPS original · fechas y esfuerzo E2';}initNav();setupFilters();initPlotControls();initPoint();initTable();setupMapControls();updateAmbientSummary();filtered();setKpis();initMap();renderTime();renderHeat();renderDist();renderEvidence();renderModel();renderEvaluations();updateShortTable();updateTable();initDone=true;resizeSoon();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',main,{once:true});else main();
window.__pyrrhuraTest={getState:()=>({points:current.length,map:loadedMode,sidebarCollapsed:$('app').classList.contains('collapsed'),plots:['timePlot','heatPlot','distPlot','evidencePlot','modelPlot'].map(id=>!!$(id).data),table:rowsMatching().length}),refresh,showPoint};
})();
