import {checkedMapping} from '../sheet-regions.mjs';
const identifier=s=>typeof s==='string'&&/^[A-Za-z0-9_.:-]{1,160}$/.test(s);
export function pointsOf(g){return g.type==='rect'?[[g.x,g.y],[g.x+g.w,g.y],[g.x+g.w,g.y+g.h],[g.x,g.y+g.h]]:g.points;}
export function area(points){return Math.abs(points.reduce((a,p,i)=>{const q=points[(i+1)%points.length];return a+p[0]*q[1]-q[0]*p[1];},0)/2);}
export function contains(points,[x,y]){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
export function migrate(data){
 if(data?.schemaVersion===2)return data;
 const old=checkedMapping(data);
 return {schemaVersion:2,sheetId:old.sheet,sourcePdf:`laminas/${old.sheet}.pdf`,sourceSha256:null,regions:Object.entries(old.regions).map(([key,r],i)=>{const [studyId,...rest]=key.split('::');return {id:`legacy-${i}`,studyId,componentId:key,instanceIds:[rest.join('::')],page:1,viewId:'legacy',geometry:{type:'rect',coordinateSystem:'normalized-pdf-page',...r},evidence:{status:'pending_review',source:'M2 migration',notes:'Legacy image coordinates require PDF review.'}};})};
}
export function validateMapping(input,{sheetId,sha256,pageCount,inventories}={}){
 const d=migrate(input);
 if(!identifier(d.sheetId)||d.sourcePdf!==`laminas/${d.sheetId}.pdf`||!Array.isArray(d.regions)||d.regions.length>10000)throw Error('Documento de correspondencias inválido');
 if(sheetId&&sheetId!==d.sheetId)throw Error('La hoja no coincide');
 if(d.sourceSha256!==null&&!/^[a-f0-9]{64}$/.test(d.sourceSha256||''))throw Error('SHA-256 inválido');
 if(sha256&&d.sourceSha256&&sha256!==d.sourceSha256)throw Error('PDF modificado: correspondencias bloqueadas');
 const ids=new Set();
 for(const r of d.regions){
  if(!identifier(r.id)||ids.has(r.id)||!identifier(r.studyId)||!identifier(r.viewId)||!identifier(r.componentId)||!r.componentId.startsWith(r.studyId+'::'))throw Error('Identificador de región inválido o duplicado');ids.add(r.id);
  if(!Number.isInteger(r.page)||r.page<1||(pageCount&&r.page>pageCount))throw Error('Página inválida');
  if(!Array.isArray(r.instanceIds)||!r.instanceIds.length||r.instanceIds.length>2000||r.instanceIds.some(x=>!identifier(x)))throw Error('Instancias inválidas');
  if(inventories?.[r.studyId]&&r.instanceIds.some(x=>!inventories[r.studyId].includes(x)))throw Error('Pieza CAD inexistente');
  const g=r.geometry;if(!g||!['rect','polygon'].includes(g.type)||g.coordinateSystem!=='normalized-pdf-page')throw Error('Geometría inválida');
  if(g.type==='rect'&&(![g.x,g.y,g.w,g.h].every(Number.isFinite)||g.w<=0||g.h<=0))throw Error('Rectángulo inválido');
  const p=pointsOf(g);if(!Array.isArray(p)||p.length<3||p.length>512||p.some(v=>!Array.isArray(v)||v.length!==2||v.some(n=>!Number.isFinite(n)||n<0||n>1))||area(p)<1e-8)throw Error('Polígono inválido');
  if(!['verified','pending_review','uncertain','rejected'].includes(r.evidence?.status)||typeof r.evidence.source!=='string'||r.evidence.source.length>1000||String(r.evidence.notes||'').length>10000)throw Error('Evidencia inválida');
  if(r.evidence.status==='verified'&&(!d.sourceSha256||!r.evidence.notes?.trim()))throw Error('Verificación requiere huella PDF y evidencia');
 }
 return structuredClone(d);
}
export function hitRegions(data,study,page,point,editing=false){return data.regions.filter(r=>r.studyId===study&&r.page===page&&(editing?r.evidence.status!=='rejected':r.evidence.status==='verified')&&contains(pointsOf(r.geometry),point));}
export function linkedRegions(data,study,instance){return data.regions.filter(r=>r.studyId===study&&r.instanceIds.includes(instance)&&r.evidence.status==='verified');}
