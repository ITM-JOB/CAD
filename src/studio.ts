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
 $('tree').insertAdjacentHTML('beforebegin','<input type="search" id="part-search" placeholder="Buscar pieza o posición…" aria-label="Buscar pieza">');
 $('fit').insertAdjacentHTML('beforebegin','<button id="exploded-toggle">Explosionar</button>');
 $('stage').insertAdjacentHTML('beforeend','<button id="pick-tag" hidden></button>');
 $('isolate').parentElement.insertAdjacentHTML('afterend','<fieldset id="piece-shift"><legend>Separación individual</legend><label>Eje <select id="shift-axis"><option>Z</option><option>X</option><option>Y</option></select><output id="shift-value">0 mm</output></label><input type="range" aria-label="Separación individual" id="shift" min="-100" max="100" step="1" value="0"><button id="shift-reset">Restituir pieza</button></fieldset>');
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
 $('part-search').oninput=()=>{
  const norm=t=>t.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const needle=norm(($('part-search') as HTMLInputElement).value.trim());
  document.querySelectorAll('#tree details').forEach((group:HTMLDetailsElement)=>{
   let matches=0;group.querySelectorAll('.node').forEach((node:HTMLElement)=>{node.hidden=!norm([node.textContent,node.dataset.id,group.querySelector('summary').textContent].join(' ')).includes(needle);if(!node.hidden)matches++;});
   group.hidden=!matches;if(needle&&matches)group.open=true;
  });
 };
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

