import {sheetFor,nameFor} from './library.mjs';
import {normalizeDrag,validRect,checkedMapping} from './sheet-regions.mjs';

const BASE=import.meta.env.BASE_URL;
const $=(id:string)=>document.getElementById(id) as HTMLElement;
type Rect={x:number,y:number,w:number,h:number};
type Mapping={version:1,sheet:string,regions:Record<string,Rect>};
const toKey=(sheet:string)=>'cad-plane-regions-v1-'+sheet;
const regionId=(key:string,id:string)=>key+'::'+id;
let sheetId='',studyKey='',currentPart='',enabled=false,marking=false;
let regions:Record<string,Rect>={}, selectable=new Set<string>();
let pick:(id:string)=>void=()=>{};
let start: {x:number,y:number}|null=null;
function safeLoad(sheet:string):Record<string,Rect>{
 try {const raw=localStorage.getItem(toKey(sheet));return raw?checkedMapping(JSON.parse(raw)).regions as Record<string,Rect>:{};}catch{return {};}
}
function saveLocal(){try{localStorage.setItem(toKey(sheetId),JSON.stringify({version:1,sheet:sheetId,regions}));}catch{status('Almacenamiento local no disponible: exporte el JSON.');}}
function status(s:string){$('map-status').textContent=s;}
function download(text:string,name:string){
 const a=document.createElement('a'),url=URL.createObjectURL(new Blob([text],{type:'application/json'}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),12000);
}
function coordinates(e:PointerEvent){
 const box=$('plane-image').getBoundingClientRect();
 return {x:Math.max(0,Math.min(1,(e.clientX-box.left)/box.width)),y:Math.max(0,Math.min(1,(e.clientY-box.top)/box.height))};
}
function paint(preview?:Rect){
 const svg=$('plane-regions') as unknown as SVGSVGElement;
 while(svg.firstChild)svg.firstChild.remove();
 const selected=regions[regionId(studyKey,currentPart)];
 const figure=studyKey==='C'?{x:.035,y:.12,w:.53,h:.79}:studyKey==='281-2'?{x:.625,y:.17,w:.33,h:.47}:null;
 if(figure){const rect=document.createElementNS('http://www.w3.org/2000/svg','rect');for(const [k,v] of Object.entries(figure))rect.setAttribute(k==='w'?'width':k==='h'?'height':k,String(v*1000));rect.setAttribute('class','plane-figure');svg.append(rect);}
 for(const [fullId,r] of Object.entries(regions)){
  const prefix=studyKey+'::';if(!fullId.startsWith(prefix))continue;
  const id=fullId.slice(prefix.length);if(!selectable.has(id))continue;
  const rect=document.createElementNS('http://www.w3.org/2000/svg','rect');
  rect.setAttribute('x',String(r.x*1000));rect.setAttribute('y',String(r.y*1000));rect.setAttribute('width',String(r.w*1000));rect.setAttribute('height',String(r.h*1000));
  rect.setAttribute('class','plane-region'+(id===currentPart?' active':''));rect.dataset.id=id;
  rect.addEventListener('pointerup',(e)=>{if(!marking){e.stopPropagation();pick(id);}});
  svg.append(rect);
 }
 if(preview){const rect=document.createElementNS('http://www.w3.org/2000/svg','rect');for(const [k,v] of Object.entries(preview))rect.setAttribute(k==='w'?'width':k==='h'?'height':k,String(v*1000));rect.setAttribute('class','plane-region drawing');svg.append(rect);}
 if(selected&&!marking)status('Región registrada para '+currentPart+' · Seleccione otra en el plano o el árbol.');
 else if(!marking)status('Seleccione una pieza y use «Marcar región» para vincularla con el PDF.');
}
export function initSheetLink(onPick:(id:string)=>void){
 pick=onPick;
 const stage=$('stage');const holder=document.createElement('div');holder.id='view-pair';stage.parentElement?.insertBefore(holder,stage);holder.append(stage);
 const panel=document.createElement('section');panel.id='drawing-panel';panel.hidden=true;
 panel.innerHTML=`<div class="drawing-head"><strong>Plano original ↔ 3D</strong><a id="drawing-pdf" target="_blank" rel="noopener">Abrir PDF ↗</a></div>
 <div id="drawing-work"><img id="plane-image" alt="Reproducción de la lámina PDF técnica original"><svg id="plane-regions" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-label="Regiones de correspondencia entre el plano y el 3D"></svg></div>
 <div class="mapping-tools"><button id="map-mode" aria-pressed="false">Marcar región de la pieza</button><button id="map-remove">Quitar marca</button><button id="map-export">Exportar JSON</button><label class="mapping-import">Importar JSON<input id="map-import" type="file" accept="application/json,.json" hidden></label></div>
 <p id="map-status" role="status">Seleccione una pieza en el árbol para buscarla en el plano.</p><p class="drawing-note">Las regiones registradas son anotaciones didácticas, no cotas ni tolerancias de fabricación. Sin marca: correspondencia pendiente.</p>`;
 holder.append(panel);
 const toggle=document.createElement('button');toggle.id='sheet-pair-toggle';toggle.textContent='Plano ↔ 3D';toggle.setAttribute('aria-pressed','false');$('fit').insertAdjacentElement('beforebegin',toggle);
 toggle.onclick=()=>{enabled=!enabled;panel.hidden=!enabled;holder.classList.toggle('paired',enabled);toggle.setAttribute('aria-pressed',String(enabled));
  // ResizeObserver detects the new width, but an explicit event helps slower browsers.
  window.dispatchEvent(new Event('resize'));
 };
 $('map-mode').onclick=()=>{marking=!marking;$('map-mode').setAttribute('aria-pressed',String(marking));$('drawing-work').classList.toggle('mapping',marking);status(marking?'Arrastre sobre la pieza en el plano para delimitar su región.':'Marcado desactivado.');paint();};
 $('map-remove').onclick=()=>{if(regionId(studyKey,currentPart) in regions){delete regions[regionId(studyKey,currentPart)];saveLocal();paint();}};
 $('map-export').onclick=()=>{if(!sheetId)return;download(JSON.stringify({version:1,sheet:sheetId,regions},null,2),`CAD-lamina-${sheetId}-correspondencias.json`);};
 ($('map-import') as HTMLInputElement).onchange=async function(this:HTMLInputElement){const file=this.files?.[0];if(!file)return;try{
  const data=checkedMapping(JSON.parse(await file.text()));if(data.sheet!==sheetId)throw Error('El archivo corresponde a otra hoja: '+data.sheet);
  regions={...regions,...data.regions};saveLocal();paint();status('Correspondencias importadas: '+Object.keys(data.regions).length);
 }catch(e){status((e as Error).message);}finally{this.value='';}};
 const work=$('drawing-work');
 work.addEventListener('pointerdown',(e:PointerEvent)=>{if(!marking||!currentPart||!selectable.has(currentPart))return;start=coordinates(e);work.setPointerCapture(e.pointerId);e.preventDefault();});
 work.addEventListener('pointermove',(e:PointerEvent)=>{if(!marking||!start)return;paint(normalizeDrag(start,coordinates(e)));});
 work.addEventListener('pointerup',(e:PointerEvent)=>{if(!marking||!start)return;const r=normalizeDrag(start,coordinates(e));start=null;
  if(r.w<.007||r.h<.007){status('Marque una región más grande.');return;}
  if(validRect(r)){regions[regionId(studyKey,currentPart)]=r;saveLocal();marking=false;$('drawing-work').classList.remove('mapping');$('map-mode').setAttribute('aria-pressed','false');paint();}
 });
 work.addEventListener('pointercancel',()=>{start=null;paint();});
}
export async function updateLinkedSheet(key:string,partIds:string[]){
 studyKey=key;sheetId=sheetFor(key)||'A';currentPart='';selectable=new Set(partIds);regions=safeLoad(sheetId);
 const image=$('plane-image') as HTMLImageElement;
 image.src=sheetId==='A'?BASE+'references/A.png':BASE+'laminas/'+sheetId+'.webp';
 image.alt='Vista digitalizada de hoja '+sheetId+' · '+nameFor(key);
 ($('drawing-pdf') as HTMLAnchorElement).href=sheetId==='A'?BASE+'references/A.png':BASE+'laminas/'+sheetId+'.pdf';
 $('drawing-pdf').textContent=sheetId==='A'?'Abrir referencia ↗':'PDF original · hoja '+sheetId+' ↗';
 // Optional shared annotations committed by the instructor under public/mappings/.
 const requestedSheet=sheetId;try{const resp=await fetch(BASE+'mappings/'+requestedSheet+'.json');if(resp.ok){const data=checkedMapping(await resp.json());if(data.sheet===sheetId){regions={...data.regions,...regions};paint();}}}catch{}
 paint();
}
export function highlightLinkedPart(id:string){currentPart=id;paint();}
