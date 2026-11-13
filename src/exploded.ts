import * as T from 'three';
import {nameFor,sheetFor} from './library.mjs';
const fmt=(v:number)=>v.toFixed(2);
const esc=(s:string)=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export const item=(n:number)=>String(n+1).padStart(3,'0');

// Preserve the pitch circle of repeated hardware. Coaxial parts at one
// station separate into successive layers; multishaft assemblies fan out.
export function extraction(parts){
 const bounds=parts.map(p=>p.cad.bounds);
 const span=Math.max(...bounds.map(([a,b])=>Math.max(b[0]-a[0],b[1]-a[1],b[2]-a[2])));
 const stations=new Map<string,{z:number,parts:any[],depth:number}>();
 parts.forEach((p,i)=>{
  const [a,b]=bounds[i],z=p.z+(a[2]+b[2])/2;
  const k=p.ref+'|'+p.z.toFixed(3);
  if(!stations.has(k))stations.set(k,{z,parts:[],depth:0});
  const g=stations.get(k);g.parts.push(p);g.depth=Math.max(g.depth,b[2]-a[2]);
 });
 const ordered=[...stations.values()].sort((a,b)=>a.z-b.z);
 let cursor=0;
 const offsets=new Map<string,T.Vector3>();
 for(const g of ordered){
  const half=g.depth/2;cursor+=half;
  for(const p of g.parts)offsets.set(p.id,new T.Vector3(p.x*.35,p.y*.35,cursor-g.z));
  cursor+=half+span*.055;
 }
 const middle=(cursor-(ordered[0].z+ordered.at(-1).z))/2;
 offsets.forEach(v=>v.z-=middle);
 return offsets;
}

// Extract silhouette and crease edges from the tessellation of the actual CAD
// solid. Weld co-located vertices before testing the two adjacent face normals.
export function technicalPaths(geometry:T.BufferGeometry,angle=0){
 const pos=geometry.getAttribute('position'),idx=geometry.index,rot=new T.Euler(.54,-.68,angle,'XYZ');
 const verts:T.Vector3[]=[],keys=new Map<string,number>(),ids:number[]=[];
 for(let i=0;i<pos.count;i++){
  const v=new T.Vector3().fromBufferAttribute(pos,i).applyEuler(rot),k=[v.x,v.y,v.z].map(n=>Math.round(n*1e4)).join(',');
  if(!keys.has(k)){keys.set(k,verts.length);verts.push(v);}
  ids.push(keys.get(k));
 }
 const edges=new Map<string,{a:number,b:number,n:T.Vector3,draw:boolean}>();
 for(let i=0;i<(idx?.count??pos.count);i+=3){
  const v=[0,1,2].map(j=>ids[idx?idx.getX(i+j):i+j]);
  const normal=verts[v[1]].clone().sub(verts[v[0]]).cross(verts[v[2]].clone().sub(verts[v[0]])).normalize();
  for(let j=0;j<3;j++){
   const a=v[j],b=v[(j+1)%3],k=Math.min(a,b)+','+Math.max(a,b),prev=edges.get(k);
   if(!prev)edges.set(k,{a,b,n:normal,draw:false});
   else prev.draw=prev.draw||(prev.n.z*normal.z<=0 || (prev.n.dot(normal)<.84&&Math.max(prev.n.z,normal.z)>0));
  }
 }
 const bb=new T.Box3().setFromPoints(verts),s=bb.getSize(new T.Vector3()),center=bb.getCenter(new T.Vector3()),f=68/Math.max(s.x,s.y,.001);
 const xy=i=>fmt((verts[i].x-center.x)*f)+','+fmt(-(verts[i].y-center.y)*f);
 return [...edges.values()].filter(e=>e.draw).map(e=>'M'+xy(e.a)+'L'+xy(e.b)).join('');
}
export function partsBook(view,meta){
 const W=1120,H=790,perPage=15,pageCount=Math.ceil(meta.parts.length/perPage);
 const cache=new Map(),pages=[];
 const title=esc(nameFor(meta.key)),source=esc(sheetFor(meta.key)||'A');
 for(let pg=0;pg<pageCount;pg++){
  const cells=[];
  meta.parts.slice(pg*perPage,(pg+1)*perPage).forEach((p,j)=>{
   if(!cache.has(p.ref))cache.set(p.ref,technicalPaths(view.objects.get(p.id).geometry));
   const x=32+(j%5)*211,y=96+Math.floor(j/5)*208,caption=p.name;
   cells.push('<g transform="translate('+x+' '+y+')"><rect width="202" height="195" rx="5" fill="#fff" stroke="#ddd"/><text x="12" y="24" fill="#6336ca">'+item(pg*perPage+j)+'</text><path transform="translate(101 83) scale(1.65)" d="'+cache.get(p.ref)+'" stroke="#242429" stroke-width=".45" fill="none"/><text x="12" y="155">'+esc(caption.slice(0,26))+'</text><text x="12" y="172">'+esc(caption.slice(26,52))+'</text><text x="12" y="187" font-size="10" fill="#666">'+esc(p.id)+'</text></g>');
  });
  pages.push('<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'"><rect width="100%" height="100%" fill="#f7f7f5"/><g font-family="Arial,sans-serif" font-size="13"><text x="32" y="43" font-size="25">'+title+'</text><text x="32" y="69">Hoja '+source+' · Identificación individual de piezas · Vista axonométrica · Sin escala</text>'+cells.join('')+'<text x="32" y="755">Despiece de estación · '+meta.parts.length+' posiciones</text><text x="1010" y="755">'+(pg+1)+' / '+pageCount+'</text></g></svg>');
 }
 return pages;
}
export function assemblySheet(view,meta){
 const records=meta.parts.map((p,i)=>({p,i})).filter(({p})=>view.objects.get(p.id).visible);
 if(!records.length)throw Error('Muestre al menos una pieza para dibujar el plano.');
 const W=1120,H=790,names=[...new Set(records.map(r=>r.p.ref))];
 const body=view.renderer.domElement.toDataURL('image/png'),cw=view.host.clientWidth,ch=view.host.clientHeight;
 const f=Math.min(790/cw,570/ch),ox=30+(790-f*cw)/2,oy=95+(570-f*ch)/2;
 const coords=records.map(({i,p})=>{
  const obj=view.objects.get(p.id),v=new T.Vector3();obj.geometry.computeBoundingBox();
  obj.geometry.boundingBox.getCenter(v);obj.localToWorld(v);const [x,y]=view.pixel(v.x,v.y,v.z);
  return {i,p,x:ox+x*f,y:oy+y*f};
 });
 // Index each distinct geometry once on the overview; the parts book lists
 // every repeated instance and its unique number on a separate cell.
 const unique=names.map(n=>coords.find(o=>o.p.ref===n));
 const left=unique.filter((_,i)=>i%2===0).sort((a,b)=>a.y-b.y),right=unique.filter((_,i)=>i%2).sort((a,b)=>a.y-b.y);
 let calls='';for(const [side,arr] of [left,right].entries())arr.forEach((r,j)=>{
  const x=side?811:40,y=101+(j+.5)*550/arr.length;
  calls+='<path d="M'+fmt(r.x)+' '+fmt(r.y)+' L'+(side?786:65)+' '+fmt(y)+' H'+x+'" fill="none" stroke="#716c7a" stroke-width=".8"/><circle cx="'+fmt(r.x)+'" cy="'+fmt(r.y)+'" r="2" fill="#6650a0"/><rect x="'+(x-15)+'" y="'+(y-8)+'" width="30" height="16" rx="8" fill="white" stroke="#59515e"/><text text-anchor="middle" x="'+x+'" y="'+(y+3.5)+'" font-size="10">'+item(r.i)+'</text>';
 });
 const rows=unique.map((r,j)=>'<text x="851" y="'+(102+j*Math.min(17,550/unique.length))+'" font-size="10">'+item(r.i)+'   '+esc(r.p.name.slice(0,32))+'   ×'+records.filter(a=>a.p.ref===r.p.ref).length+'</text>').join('');
 return '<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 1120 790"><rect width="1120" height="790" fill="white"/><rect x="15" y="15" width="1090" height="760" fill="none" stroke="#333"/><g font-family="Arial,sans-serif" fill="#222"><text x="36" y="58" font-size="28">'+esc(nameFor(meta.key))+'</text><image x="'+ox+'" y="'+oy+'" width="'+cw*f+'" height="'+ch*f+'" href="'+body+'"/>'+calls+'<path d="M839 77V670 M15 684H1105" stroke="#888"/><text x="851" y="81" font-size="12">POS.  /  DENOMINACIÓN  /  CANT.</text>'+rows+'<text x="36" y="720" font-size="19">Plano explosionado de conjunto</text><text x="36" y="748" font-size="13">Hoja '+esc(sheetFor(meta.key)||'A')+' · '+records.length+' instancias visibles · Sin escala · Geometría interpretada</text></g></svg>';
}

