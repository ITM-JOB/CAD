import {sheets,sheetFor,nameFor,isStudy} from './library.mjs';
const BASE=import.meta.env.BASE_URL;
const $=id=>document.getElementById(id);
const assembly=$('assembly') as HTMLSelectElement;
export function setupStudio(){
 const mast=document.querySelector('header .mast');mast.textContent='Estudio de despiece';
 document.querySelector('header .mark').textContent='◩';
 mast.insertAdjacentHTML('afterend','<button id="library-open">Biblioteca de láminas</button>');
 assembly.replaceChildren();
 for(const [id,[title,,keys]] of Object.entries(sheets) as any){
  const group=document.createElement('optgroup');group.label='Hoja '+id+' · '+title;
  for(const key of keys)group.append(new Option(id+' · '+nameFor(key),key));assembly.append(group);
 }
 assembly.append(new Option('A · Transmisión coaxial','A'));assembly.value='C';
 assembly.insertAdjacentHTML('afterend','<a id="source-pdf" target="_blank" rel="noopener">Abrir lámina original ↗</a>');
 $('tree').insertAdjacentHTML('beforebegin','<input type="search" id="part-search" placeholder="Buscar pieza o posición…" aria-label="Buscar pieza"><label class="motion-filter-label">Clasificar elementos <select id="motion-filter"><option value="all">Todos</option><option value="fixed">Fijos al bastidor</option><option value="moving">Móviles</option></select></label><label class="motion-color-label"><input id="motion-colors" type="checkbox"> Colores didácticos: gris / violeta</label><p id="motion-evidence" class="motion-evidence"></p>');
 $('fit').insertAdjacentHTML('beforebegin','<button id="exploded-toggle">Explosionar</button>');
 $('stage').insertAdjacentHTML('beforeend','<button id="pick-tag" hidden></button>');
 $('isolate').parentElement.insertAdjacentHTML('afterend','<fieldset id="piece-shift"><legend>Separación individual</legend><label>Eje <select id="shift-axis"><option>Z</option><option>X</option><option>Y</option></select><output id="shift-value">0 mm</output></label><input type="range" aria-label="Separación individual" id="shift" min="-100" max="100" step="1" value="0"><button id="shift-reset">Restituir pieza</button></fieldset>');
 $('piece-shift').insertAdjacentHTML('afterend','<fieldset id="subassembly-tools"><legend>Despiece interno de subensamble</legend><label>Rodamiento <select id="subassembly-target"><option value="">Seleccionar rodamiento</option></select></label><label>Separar aros, jaula y elementos rodantes <output id="subexplode-value">0 %</output></label><input id="subexplode" type="range" min="0" max="1" step=".01" value="0"><div class="actions"><button id="subassembly-isolate">Aislar rodamiento</button><button id="subassembly-play">Animar piezas</button><button id="subassembly-reset">Restituir</button></div><p>Jaula interpretativa. No se atribuyen sellos ni tolerancias desconocidas.</p></fieldset>');
 document.querySelector('.motion .sliders').insertAdjacentHTML('afterend','<div class="planbar"><label><input id="guides" type="checkbox" checked> Líneas de despiece</label><button id="print-plan">Descargar plano SVG</button><button id="book">Despiece completo ZIP</button></div>');
 $('params').parentElement.removeAttribute('open');
 document.body.insertAdjacentHTML('beforeend','<dialog id="library"><div class="library-head"><div><div class="eyebrow">Documentación técnica</div><h2>Biblioteca de láminas</h2></div><button id="library-close" aria-label="Cerrar biblioteca">Cerrar ×</button></div><div class="sheet-grid"></div></dialog>');
 const dialog=$('library') as HTMLDialogElement;
 for(const [id,[title,category,keys]] of Object.entries(sheets) as any){
  const card=document.createElement('article');
  card.innerHTML='<img loading="lazy" alt="Vista previa de la hoja '+id+'" src="'+BASE+'laminas/'+id+'.webp"><div><small>HOJA '+id+' · '+category+'</small><h3>'+title+'</h3></div>';
  const actions=document.createElement('div');actions.className='card-links';
  keys.forEach((k,i)=>{const b=document.createElement('button');b.textContent=keys.length>1?'Fig. '+(i+1):'Abrir despiece';b.title=nameFor(k);b.onclick=()=>{assembly.value=k;assembly.dispatchEvent(new Event('change'));dialog.close();};actions.append(b);});
  const link=document.createElement('a');link.textContent='PDF ↗';link.href=BASE+'laminas/'+id+'.pdf';link.target='_blank';actions.append(link);card.append(actions);dialog.querySelector('.sheet-grid').append(card);
 }
 $('library-open').onclick=()=>dialog.showModal();$('library-close').onclick=()=>dialog.close();
 ($('part-search') as HTMLInputElement).oninput=applyTreeFilters;
 ($('motion-filter') as HTMLSelectElement).onchange=applyTreeFilters;
}
export function studioState(key){
 const original=$('source-pdf') as HTMLAnchorElement;const sheet=sheetFor(key);
 original.href=sheet?BASE+'laminas/'+sheet+'.pdf':BASE+'references/A.png';original.textContent=sheet?'PDF original · hoja '+sheet+' ↗':'Ver referencia original ↗';
 const study=isStudy(key);
 for(const id of ['play','rpm','free','speed','reverse','timeline'])($ (id) as HTMLInputElement).disabled=study;
 $('params').parentElement.hidden=study;
 const opt=$('refView') as HTMLSelectElement;for(const o of opt.options)o.disabled=study&&['aligned','end'].includes(o.value);
 $('eng-row').hidden=study||key==='A';($('part-search') as HTMLInputElement).value='';
}


export function applyTreeFilters(){
 const text=($('part-search') as HTMLInputElement).value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const filter=($('motion-filter') as HTMLSelectElement).value;
 document.querySelectorAll('#tree details.group-branch').forEach((group:HTMLDetailsElement)=>{
  let visible=0;
  group.querySelectorAll('button.node').forEach((node:HTMLButtonElement)=>{
   const hay=[node.textContent,node.dataset.id,group.querySelector('summary')?.textContent].join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
   node.hidden=(filter!=='all'&&node.dataset.motion!==filter)||!hay.includes(text);
   if(!node.hidden)visible++;
  });
  group.hidden=visible===0;if(text&&visible)group.open=true;
 });
 document.querySelectorAll('#tree details.motion-branch').forEach((parent:HTMLDetailsElement)=>{
  parent.hidden=!Array.from(parent.querySelectorAll('button.node')).some((b:HTMLButtonElement)=>!b.hidden);
  if(text&&!parent.hidden)parent.open=true;
 });
}
