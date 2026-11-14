import './style.css';
import './animotion.css';
import {setupStudio,studioState,applyTreeFilters} from './studio';
import {sheetFor,nameFor,isStudy} from './library.mjs';
import {assemblySheet,partsBook,item} from './exploded';
import {zipSync,strToU8} from 'fflate';
import {denomination} from './nomenclature.mjs';
import {classifyPart,subgroupFor,studyNotice} from './learning.mjs';
import {componentInventory} from './mapping/identity.mjs';
import {readDeepLink} from './sync/selection.mjs';
import {sheets as librarySheets} from './library.mjs';
import {initSheetLink,updateLinkedSheet,highlightLinkedPart,restoreLinkedRegion} from './sheet-link';
setupStudio();
import {Viewport,calibration,phases} from './viewport';
import {defaults,definitions,clutch,validate} from './mechanics.mjs';
const BASE=import.meta.env.BASE_URL;
const el=(id:string)=>document.getElementById(id) as HTMLInputElement;
const val=(id:string)=>Number(el(id).value);
const titles={C:'Embrague hidráulico multidisco',B:'Embrague de automóvil',A:'Transmisión coaxial'};
const labels={length:'Longitud de referencia',shaft:'Ø eje principal',bearingOD:'Ø exterior rodamiento',housingOD:'Ø envolvente',pitch:'Paso de cadena',teeth:'Dientes por hilera',discs:'Discos revestidos',frictionID:'Ø interior fricción',frictionOD:'Ø exterior fricción',discT:'Espesor de disco',plateT:'Espesor separador',gap:'Holgura por interfaz',pressure:'Presión máxima',mu:'Coef. de fricción',returnForce:'Fuerza de retorno',travel:'Carrera de liberación',leverCount:'Palancas',offset:'Excentricidad'};
const sheets={C:'Hoja 281',B:'Hoja 280',A:'Secciones axial y A–A'};
const saved={};let active='C',p=defaults('C'),meta,worker:Worker,selection='',busy=false,playing=false,time=0,last=0,phase={},revision=0;
let viewport:Viewport;let subPlaying=false,subStart=0;
const overlay=()=>{
 if(!viewport)return;
 const box=el('overlay'),mode=el('refView').value;
 box.style.opacity=el('opacity').value;
 if(mode==='off'||!meta){box.style.backgroundImage='none';return;}
 box.style.backgroundImage=isStudy(meta.key)?'url('+BASE+'laminas/'+sheetFor(meta.key)+'.webp)':'url('+BASE+'references/'+meta.key+'.png)';box.style.clipPath='';
 if(mode==='source'){box.style.backgroundSize='contain';box.style.backgroundPosition='center';return;}
 const h=viewport.host.clientHeight,w=viewport.host.clientWidth;
 const endRefs={C:{origin:[238,848],scale:[370/310,370/310],size:[1223,1047],crop:[48,658,427,1039]},A:{origin:[1063,435],scale:[163/42,163/42],size:[1467,808],crop:[700,1,1465,798]},B:{origin:[1329,550],scale:[(550-256)*2/240,(550-256)*2/240],size:[1790,1117],crop:[882,97,1774,997]}};
 const end=mode==='end',ref=end?endRefs[meta.key]:calibration[meta.key];
 const o=viewport.pixel(0,0,0),u=end?viewport.pixel(1,0,0):viewport.pixel(0,0,1),v=end?viewport.pixel(0,1,0):viewport.pixel(1,0,0);
 if(Math.abs(u[1]-o[1])>.0001||Math.abs(v[0]-o[0])>.0001||u[0]<=o[0]||v[1]>=o[1]){
  box.style.backgroundImage='none';return;
 }
 const sx=(u[0]-o[0])/ref.scale[0],sy=(o[1]-v[1])/ref.scale[1];
 const x=o[0]-ref.origin[0]*sx,y=o[1]-ref.origin[1]*sy;
 box.style.backgroundSize=ref.size[0]*sx+'px '+ref.size[1]*sy+'px';box.style.backgroundPosition=x+'px '+y+'px';
 box.style.clipPath='inset('+Math.max(0,y+ref.crop[1]*sy)+'px '+Math.max(0,w-x-ref.crop[2]*sx)+'px '+Math.max(0,h-y-ref.crop[3]*sy)+'px '+Math.max(0,x+ref.crop[0]*sx)+'px)';
};
viewport=new Viewport(el('stage'),select,overlay);
initSheetLink((id,ids)=>{select(id,ids,'pdf');viewport.focusSelection(ids||[id]);});
function save(blob,name){
 const link=document.createElement('a'),url=URL.createObjectURL(blob);link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),15000);
}
function status(t){el('status').textContent=t;}
function selected(){return meta?.parts.find(i=>i.id===selection);}
function select(id,ids=[id],origin='cad'){
 if(!meta)return;selection=id;viewport.selected=id;viewport.selectedIds=new Set(ids);
 document.querySelectorAll('.node').forEach(n=>n.classList.toggle('selected',ids.includes((n as HTMLElement).dataset.id)));
 const i=selected();if(!i)return;viewport.sourceSelection=origin==='pdf';
 if(viewport.onlyGroup && subgroupFor(i)!==viewport.onlyGroup){viewport.onlyGroup=subgroupFor(i)||'';viewport.style();}
 if(viewport.only){viewport.only=id;viewport.hidden.delete(id);}
 const shift=viewport.manual.get(id);el('shift').value=String(shift?.value||0);el('shift-axis').value=(shift?.axis||'z').toUpperCase();el('shift-value').textContent=el('shift').value+' mm';
 el('properties').dataset.selectionOrigin=origin;const cls=classifyPart(i,active);el('part-name').textContent=i.name;
 if(subgroupFor(i)){el('subassembly-target').value=subgroupFor(i);viewport.subassemblyTarget=subgroupFor(i);}
 const bounds=i.cad.bounds,dim=bounds[1].map((v,j)=>(v-bounds[0][j]).toFixed(1)).join(' × ');
 el('properties').innerHTML='<p>'+i.role+'</p><dl><dt>Identidad canónica</dt><dd>'+active+'::'+id+'</dd><dt>Grupo</dt><dd>'+i.parent+'</dd><dt>Envolvente local</dt><dd>'+dim+' mm</dd><dt>Volumen CAD</dt><dd>'+(i.cad.volume/1000).toFixed(2)+' cm³</dd><dt>Restricción</dt><dd>'+i.joint+' / '+i.drive+'</dd><dt>Carrera axial</dt><dd>'+i.slide.toFixed(2)+' mm</dd><dt>Material</dt><dd>Sin especificar</dd><dt>Evidencia dimensional</dt><dd>Reconstrucción educativa; cotas impresas y supuestos: consultar Parámetros. Envolvente medida del sólido generado, no cota certificada.</dd></dl>';
 viewport.style();highlightLinkedPart(id,origin,ids);
}
function refreshPanel(){
 el('tree').replaceChildren();
 const groupMap=new Map<string,HTMLDetailsElement>();
 const branches=new Map<string,HTMLDetailsElement>();
 for(const category of ['fixed','moving']){
  const parent=document.createElement('details');parent.className='motion-branch';parent.open=true;
  const summary=document.createElement('summary');summary.textContent=(category==='fixed'?'Fijos respecto al bastidor':'Móviles')+' · '+meta.parts.filter(p=>classifyPart(p,active).category===category).length;
  parent.append(summary);el('tree').append(parent);branches.set(category,parent);
 }
 for(const [index,part] of meta.parts.entries()){
  const cls=classifyPart(part,active),key=cls.category+'|'+part.group;
  if(!groupMap.has(key)){
   const group=document.createElement('details');group.className='group-branch';group.open=groupMap.size<6;
   const summary=document.createElement('summary');summary.textContent=part.group;group.append(summary);branches.get(cls.category)?.append(group);groupMap.set(key,group);
  }
  const b=document.createElement('button');b.className='node';b.dataset.id=part.id;b.dataset.motion=cls.category;
  b.title=cls.basis+' · '+cls.confidence;
  b.innerHTML='<span class="pos">'+item(index)+'</span><i class="swatch" style="background:'+part.color+'"></i>'+part.name;
  b.onclick=()=>select(part.id,[part.id],'tree');groupMap.get(key)?.append(b);
 }
 el('count').textContent=meta.parts.length+' piezas';
 el('motion-evidence').textContent=studyNotice(active);
 const sub=el('subassembly-target') as unknown as HTMLSelectElement;sub.replaceChildren(new Option('Seleccionar rodamiento',''));
 for(const g of [...new Set(meta.parts.map(subgroupFor).filter(Boolean))])sub.add(new Option(String(g),String(g)));
 el('subexplode').value='0';el('subexplode-value').textContent='0 %';
 viewport.subassemblyTarget='';viewport.subExplode=0;viewport.onlyGroup='';
 el('subassembly-tools').hidden=sub.options.length===1;
 applyTreeFilters();
 el('params').replaceChildren();
 for(const [k,[v,unit,source,lo,hi]] of Object.entries(definitions[active]) as any){
  const lab=document.createElement('label');lab.htmlFor='p-'+k;lab.innerHTML='<span>'+labels[k]+' '+unit+'<br><small>'+(p[k]!==v?'EDITADO':source)+'</small></span>';
  const field=document.createElement('input');field.type='number';field.id='p-'+k;field.step=['teeth','discs','leverCount'].includes(k)?'1':'any';field.min=lo;field.max=hi;field.value=p[k];field.disabled=lo===hi;lab.append(field);el('params').append(lab);
 }
 el('eng-row').hidden=active==='A';
 el('sheet').textContent=sheetFor(active)?'HOJA '+sheetFor(active)+(isStudy(active)?'  /  DESPIECE INTERPRETATIVO':'  /  ENSAMBLE CAD'):'REFERENCIA A';
 el('title').textContent=nameFor(active);studioState(active);
 el('drawings').hidden=isStudy(active);el('drawings').setAttribute('href',BASE+'outputs/'+active+'/index.html');
 el('calibration').textContent=active==='A'?'Escala relativa. Esta lámina carece de cotas legibles.':active==='B'?'Calibración radial con Ø240. Escala axial supuesta isotrópica.':'Calibración axial con 380 mm y radial con Ø60. Vista A y detalle C–C tienen escalas distintas.';
 if(isStudy(active))el('calibration').textContent='Consultar medidas y variantes en el PDF original. Forma, cantidades y posiciones del modelo son interpretativas.';
 const span=Math.max(...meta.parts.map(i=>Math.max(...i.cad.bounds[1].map((v,j)=>v-i.cad.bounds[0][j]))));el('shift').min=String(-Math.ceil(span));el('shift').max=String(Math.ceil(span));
 updateLinkedSheet(active,meta.parts).then(()=>{const region=new URLSearchParams(location.search).get('region');if(region&&restoreLinkedRegion(region))return;if(selection)highlightLinkedPart(selection);});
 select(meta.parts.some(i=>i.id===selection)?selection:(({C:'disc-1',B:'disc',A:'input'})[active]||meta.parts[0].id));overlay();
}
function build(key,params){
 try{validate(key,params);}catch(e){el('error').textContent=e.message;return;}
 const token=++revision,old=worker,pending=new Worker(new URL('./cad.worker.js',import.meta.url),{type:'module'});
 busy=true;playing=false;el('play').textContent='Reproducir';status('Calculando sólidos…');el('error').textContent='';
 function fail(message){pending.terminate();busy=false;el('error').textContent=message;el('assembly').value=active;status(meta?'Modelo anterior conservado':'Falló el cálculo');}
 pending.onerror=e=>{if(token===revision)fail(e.message);};
 pending.onmessage=({data})=>{
  if(token!==revision){pending.terminate();return;}
  if(data.action==='error'){if(busy)fail(data.error);else el('error').textContent=data.error;return;}
  if(data.action==='file'){save(data.file,data.name);status('STEP exportado');return;}
  if(data.action!=='built')return;
  old?.terminate();worker=pending;meta=data.meta;active=key;p=params;saved[key]=p;busy=false;
  for(const part of meta.parts){part.name=denomination(part.name);part.group=denomination(part.group);part.parent=key+'/'+part.group;}
  meta.componentInventory=componentInventory(meta,sheetFor(active),definitions[active],p);
  viewport.load(meta,data.geometries);el('view').value='Isométrica';el('refView').value='off';el('assembly').value=active;
  reset();refreshPanel();status('Núcleo listo · '+Object.keys(data.geometries).length+' geometrías');
 };
 pending.postMessage({action:'build',key,p:params});
}
function reset(){subPlaying=false;subStart=0;el('subassembly-play').textContent='Animar piezas';time=0;phase={};last=0;playing=false;el('play').textContent='Reproducir';el('timeline').value='0';el('eng').value='0';el('explode').value='0';viewport.subExplode=0;el('subexplode').value='0';el('subexplode-value').textContent='0 %';viewport.manual.clear();el('shift').value='0';el('shift-value').textContent='0 mm';el('exploded-toggle').setAttribute('aria-pressed','false');el('exploded-toggle').textContent='Explosionar';}
el('assembly').onchange=()=>{const k=el('assembly').value;build(k,saved[k]||defaults(k));};
el('apply').onclick=()=>{if(busy)return;const q={};for(const k of Object.keys(p))q[k]=el('p-'+k).value===''?NaN:val('p-'+k);build(active,q);};
el('params').onsubmit=e=>{e.preventDefault();el('apply').click();};
el('view').onchange=()=>{viewport.setView(el('view').value);if(el('refView').value==='aligned'&&el('view').value!=='Axial'){el('refView').value='off';overlay();}};
el('fit').onclick=()=>viewport.setView(el('view').value);
for(const id of ['transparent','wire','section','cut'])el(id).oninput=()=>{
 viewport.transparent=el('transparent').checked;viewport.wire=el('wire').checked;viewport.section=el('section').value;viewport.cut=val('cut');viewport.style();
};
(el('refView') as unknown as HTMLSelectElement).add(new Option('Vista de extremo alineada','end'));
el('refView').onchange=()=>{const mode=el('refView').value;if(['aligned','end'].includes(mode)){const view=mode==='end'?'Frontal':'Axial';el('view').value=view;viewport.setView(view);}overlay();};el('opacity').oninput=overlay;
function fitCurrent(){viewport.draw(val('eng'),phase,val('explode'));viewport.setView(el('view').value);}
el('isolate').onclick=()=>{viewport.onlyGroup='';viewport.only=viewport.only?'':selection;viewport.hidden.delete(selection);viewport.style();fitCurrent();};
el('hide').onclick=()=>{if(viewport.hidden.has(selection))viewport.hidden.delete(selection);else viewport.hidden.add(selection);viewport.style();};
el('show').onclick=()=>{viewport.only='';viewport.onlyGroup='';viewport.hidden.clear();viewport.style();fitCurrent();};
el('motion-colors').onchange=()=>{viewport.motionColors=el('motion-colors').checked;viewport.style();};
(el('subassembly-target') as unknown as HTMLSelectElement).onchange=()=>{viewport.subassemblyTarget=el('subassembly-target').value;viewport.dirty=true;};
el('subexplode').oninput=()=>{subPlaying=false;el('subassembly-play').textContent='Animar piezas';viewport.subExplode=val('subexplode');el('subexplode-value').textContent=Math.round(viewport.subExplode*100)+' %';viewport.dirty=true;};
el('subassembly-play').onclick=()=>{if(!el('subassembly-target').value)return;subPlaying=!subPlaying;subStart=0;el('subassembly-play').textContent=subPlaying?'Pausar animación':'Animar piezas';};
el('subassembly-isolate').onclick=()=>{const g=el('subassembly-target').value;if(!g)return;viewport.only='';viewport.onlyGroup=viewport.onlyGroup===g?'':g;viewport.style();fitCurrent();};
el('subassembly-reset').onclick=()=>{subPlaying=false;el('subassembly-play').textContent='Animar piezas';el('subexplode').value='0';viewport.subExplode=0;el('subexplode-value').textContent='0 %';viewport.onlyGroup='';viewport.style();fitCurrent();};
el('guides').oninput=()=>viewport.guidesOn=el('guides').checked;
function adjustPiece(){if(!selected())return;const amount=val('shift');if(amount)viewport.manual.set(selection,{axis:el('shift-axis').value.toLowerCase(),value:amount});else viewport.manual.delete(selection);el('shift-value').textContent=amount+' mm';}
el('shift').oninput=adjustPiece;el('shift-axis').onchange=adjustPiece;el('shift-reset').onclick=()=>{el('shift').value='0';adjustPiece();};
el('explode').oninput=()=>{const on=val('explode')>0;el('exploded-toggle').setAttribute('aria-pressed',String(on));el('exploded-toggle').textContent=on?'Reensamblar':'Explosionar';};
el('explode').onchange=fitCurrent;
el('exploded-toggle').onclick=()=>{if(!meta)return;el('explode').value=val('explode')?'0':'1';el('explode').dispatchEvent(new Event('input'));fitCurrent();};
function plan(){if(!val('explode'))el('exploded-toggle').click();fitCurrent();viewport.draw(val('eng'),phase,val('explode'));return assemblySheet(viewport,meta);}
el('print-plan').onclick=()=>{if(!meta)return;try{save(new Blob([plan()],{type:'image/svg+xml'}),active+'-explosionado.svg');}catch(e){el('error').textContent=e.message;}};
el('book').onclick=async()=>{if(!meta||busy)return;try{
 status('Preparando despiece…');el('book').disabled=true;await new Promise(resolve=>setTimeout(resolve,30));
 const files:Record<string,Uint8Array>={'00-conjunto.svg':strToU8(plan())};const pages=partsBook(viewport,meta);
 pages.forEach((svg,j)=>files['piezas-'+String(j+1).padStart(2,'0')+'.svg']=strToU8(svg));
 const cell=v=>'"'+String(v).replace(/"/g,'""')+'"';
 files['lista-de-piezas.csv']=strToU8('\uFEFF'+[['Posición','Identificador','Pieza','Grupo','Geometría'],...meta.parts.map((p,i)=>[item(i),p.id,p.name,p.group,p.ref])].map(row=>row.map(cell).join(';')).join('\r\n'));
 save(new Blob([new Uint8Array(zipSync(files,{level:4})).buffer],{type:'application/zip'}),active+'-despiece.zip');status('Despiece exportado');
 }catch(e){el('error').textContent=e.message;}finally{el('book').disabled=false;}};
el('play').onclick=()=>{if(!meta||busy)return;if(time>=60){time=0;phase={};}playing=!playing;last=0;el('play').textContent=playing?'Pausar':'Reproducir';};
el('reset').onclick=()=>{reset();fitCurrent();};
el('reverse').onclick=()=>{el('rpm').value=String(-val('rpm'));el('free').value=String(-val('free'));};
el('timeline').oninput=()=>{time=val('timeline');const rates=phases(active,p,val('eng'),val('rpm'),val('free'));for(const k in rates)phase[k]=rates[k]*time;};
for(const [id,action] of [['step',''],['partstep','selected']])el(id).onclick=()=>{if(worker&&!busy){status('Escribiendo STEP…');worker.postMessage({action:'step',id:action?selection:null});}};
el('glb').onclick=async()=>{if(!meta||busy)return;try{status('Exportando animación…');save(await viewport.glb(p),active+'-assembly.glb');status('GLB exportado');}catch(e){el('error').textContent=e.message;}};
el('png').onclick=()=>viewport.renderer.domElement.toBlob(b=>save(b,active+'-vista.png'));
el('json').onclick=()=>save(new Blob([JSON.stringify({...meta,parameterDefinitions:definitions[active]},null,2)]),active+'-assembly.json');
let metrics='';
function frame(now){
 if(subPlaying){
  if(!subStart)subStart=now;
  const t=Math.min(1,(now-subStart)/8000);
  viewport.subExplode=t<.5?t*2:(1-t)*2;
  el('subexplode').value=String(viewport.subExplode);el('subexplode-value').textContent=Math.round(viewport.subExplode*100)+' %';
  if(t>=1){subPlaying=false;subStart=0;el('subassembly-play').textContent='Animar piezas';}
 }
 const e=val('eng');
 if(playing&&meta){
  const dt=Math.min(60-time,Math.max(0,(now-(last||now))/1000)*Math.max(.1,Math.min(5,val('speed'))));time+=dt;
  const rates=phases(active,p,e,val('rpm'),val('free'));for(const k in rates)phase[k]=(phase[k]||0)+rates[k]*dt;
  el('timeline').value=String(time);if(time>=60){playing=false;el('play').textContent='Reproducir';}
 }
 last=now;el('time').textContent=time.toFixed(1)+' s';viewport.draw(e,phase,val('explode'));
 if(meta){
  const h=active==='C'?clutch(p,e):null;
  const state=isStudy(active)?'Inspección de montaje':active==='A'?'Relación desconocida':e===0?'Desacoplado':e<1?'En transición':h&&h.clamp===0?'Contacto sin carga':'Acoplado';
  el('state').textContent=state;
  let message=active==='A'?'Entrada y portador independientes. No se ha identificado una relación de engrane.':'Movimiento prescrito · sin dinámica de deslizamiento.';
  if(isStudy(active))message='Despiece geométrico interpretativo. Las medidas y cantidades estimadas requieren cotejo con la lámina.';
  const tag=el('pick-tag'),obj=viewport.objects.get(selection);tag.hidden=!(val('explode')||viewport.subExplode||viewport.manual.size)||!obj?.visible;
  if(!tag.hidden){const p=selected(),[a,b]=p.cad.bounds;const v=obj.position.clone().fromArray(a).lerp(obj.position.clone().fromArray(b),.5);obj.localToWorld(v);const [x,y]=viewport.pixel(v.x,v.y,v.z);tag.style.left=x+'px';tag.style.top=y+'px';tag.textContent=item(meta.parts.indexOf(p));}
  if(h)message='<dl><dt>Carrera pistón</dt><dd>'+h.displacement.toFixed(2)+' mm</dd><dt>Presión aplicada</dt><dd>'+(p.pressure*e).toFixed(3)+' MPa</dd><dt>Fuerza hidráulica</dt><dd>'+h.applied.toFixed(0)+' N</dd><dt>Apriete neto</dt><dd>'+h.clamp.toFixed(0)+' N</dd><dt>Capacidad ideal</dt><dd>'+h.torque.toFixed(1)+' N·m</dd></dl>'+message;
  if(message!==metrics){el('metrics').innerHTML=message;metrics=message;}
 }
 requestAnimationFrame(frame);
}
const deep=readDeepLink(location.search,[...Object.values(librarySheets).flatMap((s:any)=>s[2]),'A'],sheetFor);
if(deep){selection=deep.part;}
requestAnimationFrame(frame);build(deep?.study||'C',deep?defaults(deep.study):p);

