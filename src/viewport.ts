import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {pose,velocities} from './mechanics.mjs';
import {extraction} from './exploded';
import {isStudy} from './library.mjs';
import {classifyPart,subgroupFor,bearingPartKind} from './learning.mjs';
const axis=(x,y,z)=>new T.Vector3(x,y,z);
export const calibration={
 C:{origin:[47,390],scale:[(977-47)/380,(462-318)/60],size:[1223,1047],crop:[40,14,978,766]},
 B:{origin:[234,550],scale:[(550-256)*2/240,(550-256)*2/240],size:[1790,1117],crop:[109,31,762,1015]},
 A:{origin:[174,431],scale:[(485-174)/86,(431-269)/42],size:[1467,808],crop:[10,1,689,790]}
};
export function phases(key,p,e,rpm,free){
 const v=velocities(key,p,e,rpm,free);
 const out:any={...v};
 if(!['A','B','C'].includes(key))return out;
 for(const [group,inner,outer,d,D] of [['main','input','output',p.shaft/2+4,p.bearingOD/2],['feed','input','fixed',20,35],['gearbox','output','fixed',p.shaft/2,p.shaft/2+15],['input','input','fixed',p.shaft/2,p.shaft/2+6],['output','output','fixed',p.shaft/2+7,p.shaft/2+13]] as any[]){
  const i=v[inner]||0,o=v[outer]||0,R=(d+D)/2,b=(D-d)*.245;
  const cage=(i*(R-b)+o*(R+b))/(2*R);
  for(const suffix of ['L','R','rear','bearing'])out[group+'-'+suffix+'-cage']=cage;
 }
 return out;
}
function transform(obj,part,e,phase,explode){
 const q=pose(part,e,phase,explode);
 obj.position.set(q.x,q.y,q.z);obj.rotation.order='ZYX';obj.rotation.set(0,q.tilt,q.a,'ZYX');obj.scale.set(1,1,q.scaleZ);
}
export class Viewport{
 scene=new T.Scene(); root=new T.Group(); objects=new Map<string,T.Mesh>(); renderer:T.WebGLRenderer;
 ortho=new T.OrthographicCamera();persp=new T.PerspectiveCamera(36,1,.1,10000);camera:T.Camera=this.ortho;
 orbit:OrbitControls; center=new T.Vector3(); radius=160;extent=400; view='Isométrica';meta:any;
 selectedIds=new Set<string>(); selected=''; hidden=new Set<string>();only='';onlyGroup='';wire=false;transparent=false;section='none';cut=0;
    motionColors=false; subassemblyTarget='';subExplode=0;
 offsets=new Map<string,T.Vector3>();manual=new Map<string,{axis:string,value:number}>(); guides:T.LineSegments; guidesOn=true;
 dirty=true;lastPose='';
 constructor(public host:HTMLElement,onPick:(id:string)=>void,public overlay:()=>void){
  this.renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.localClippingEnabled=true;
  this.host.prepend(this.renderer.domElement);this.scene.add(this.root);
  this.guides=new T.LineSegments(new T.BufferGeometry(),new T.LineDashedMaterial({color:0x80748f,dashSize:5,gapSize:4,transparent:true,opacity:.50,depthWrite:false}));this.guides.frustumCulled=false;this.scene.add(this.guides);
  this.scene.add(new T.HemisphereLight(0xffffff,0xa4b6b5,2.1));
  for(const [x,y,z,n] of [[1,2,3,2.3],[-3,1,-1,1.7]]){
   const l=new T.DirectionalLight(0xffffff,n);l.position.set(x,y,z);this.scene.add(l);
  }
  this.orbit=new OrbitControls(this.camera,this.renderer.domElement);this.orbit.addEventListener('change',()=>{this.dirty=true;this.overlay();});
  new ResizeObserver(()=>this.resize()).observe(host);
  let down=[0,0];this.renderer.domElement.onpointerdown=e=>{down=[e.clientX,e.clientY];};
  this.renderer.domElement.addEventListener('pointerup',e=>{
   if(Math.hypot(e.clientX-down[0],e.clientY-down[1])>4)return;
   const b=host.getBoundingClientRect(),ray=new T.Raycaster();
   ray.setFromCamera(new T.Vector2((e.clientX-b.left)/b.width*2-1,1-(e.clientY-b.top)/b.height*2),this.camera);
   const hit=ray.intersectObjects([...this.objects.values()].filter(o=>o.visible))
    .find(h=>!(h.object as T.Mesh<any,T.MeshStandardMaterial>).material.clippingPlanes?.some(plane=>plane.distanceToPoint(h.point)<0));
   if(hit)onPick(hit.object.name);
  });
 }
 load(meta,geometries){
  const old=new Set<T.BufferGeometry>();this.objects.forEach(m=>{old.add(m.geometry);(m.material as T.Material).dispose();});
  old.forEach(g=>g.dispose());this.root.clear();this.objects.clear();this.meta=meta;this.hidden.clear();this.only='';this.onlyGroup='';this.subExplode=0;this.subassemblyTarget='';
  this.offsets=extraction(meta.parts);this.manual.clear();this.guides.geometry.dispose();this.guides.geometry=new T.BufferGeometry();this.guides.geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(meta.parts.length*6),3));
  const geos=new Map(),groups=new Map();
  for(const [key,data] of Object.entries(geometries) as any){
   const g=new T.BufferGeometry();
   g.setAttribute('position',new T.Float32BufferAttribute(data.vertices,3));g.setAttribute('normal',new T.Float32BufferAttribute(data.normals,3));g.setIndex(data.triangles);geos.set(key,g);
  }
  this.root.name='Assembly_'+meta.key;
  for(const p of meta.parts){
   const m=new T.Mesh(geos.get(p.ref),new T.MeshStandardMaterial({color:p.color,roughness:.52,metalness:.3,side:T.DoubleSide}));
   m.name=p.id;m.userData={partId:p.id,geometry:p.ref,joint:p.joint,role:p.role};
   if(!groups.has(p.group)){const g=new T.Group();g.name=p.group;this.root.add(g);groups.set(p.group,g);}
   groups.get(p.group).add(m);this.objects.set(p.id,m);transform(m,p,0,{},0);
  }
  const box=new T.Box3().setFromObject(this.root);box.getCenter(this.center);this.radius=box.getBoundingSphere(new T.Sphere()).radius;
  this.setView('Isométrica');this.style();
 }
 focusSelection(ids:string[]){
  this.root.updateMatrixWorld(true);const box=new T.Box3();for(const id of ids){const mesh=this.objects.get(id);if(mesh){mesh.visible=true;this.hidden.delete(id);box.expandByObject(mesh);}}
  if(box.isEmpty())return;const target=box.getCenter(new T.Vector3()),delta=target.clone().sub(this.orbit.target);this.camera.position.add(delta);this.orbit.target.copy(target);this.orbit.update();this.dirty=true;
 }
 resize(){
  this.dirty=true;
  const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;
  this.renderer.setSize(w,h,false);this.persp.aspect=w/h;this.persp.updateProjectionMatrix();
  const size=this.extent;this.ortho.left=-size*w/h/2;this.ortho.right=-this.ortho.left;this.ortho.top=size/2;this.ortho.bottom=-size/2;this.ortho.near=.1;this.ortho.far=Math.max(10000,this.radius*12);this.ortho.updateProjectionMatrix();this.overlay();
 }
 setView(name){
  this.view=name;const b=new T.Box3();this.root.updateMatrixWorld(true);for(const obj of this.objects.values())if(obj.visible)b.expandByObject(obj);
  if(!b.isEmpty()){b.getCenter(this.center);this.radius=b.getBoundingSphere(new T.Sphere()).radius;}
  const ratio=Math.max(.3,this.host.clientWidth/this.host.clientHeight);
  this.extent=2.22*this.radius/Math.min(1,ratio);this.camera=name==='Perspectiva'?this.persp:this.ortho;
  this.orbit.object=this.camera;this.orbit.target.copy(this.center);
  const directions={Isométrica:[1.1,1.05,1.4],Perspectiva:[1.1,1.05,1.4],Axial:[0,1,0],Frontal:[0,0,1],Posterior:[0,0,-1],Superior:[1,0,0],Inferior:[-1,0,0],Izquierda:[0,-1,0]};
  this.camera.position.copy(this.center).addScaledVector(axis(...directions[name] as [number,number,number]).normalize(),this.radius*4.5);
  this.camera.up.copy(name==='Axial'||name==='Izquierda'?axis(1,0,0):axis(0,1,0));
  this.persp.far=this.ortho.far=Math.max(10000,this.radius*12);this.ortho.zoom=1;this.camera.lookAt(this.center);this.orbit.update();
  if(!b.isEmpty() && this.camera===this.ortho){
   const right=axis(1,0,0).applyQuaternion(this.camera.quaternion),up=axis(0,1,0).applyQuaternion(this.camera.quaternion);
   let xMin=Infinity,xMax=-Infinity,yMin=Infinity,yMax=-Infinity;
   for(const mesh of this.objects.values()){
    if(!mesh.visible)continue;
    const g=mesh.geometry;if(!g.boundingBox)g.computeBoundingBox();const {min,max}=g.boundingBox;
    for(const x of [min.x,max.x])for(const y of [min.y,max.y])for(const z of [min.z,max.z]){
     const v=axis(x,y,z).applyMatrix4(mesh.matrixWorld);
     xMin=Math.min(xMin,v.dot(right));xMax=Math.max(xMax,v.dot(right));yMin=Math.min(yMin,v.dot(up));yMax=Math.max(yMax,v.dot(up));
    }
   }
   const span=Math.max((xMax-xMin)/ratio,yMax-yMin);if(span>0)this.extent=span*1.12;
  }
  this.resize();
 }
 style(){
  this.dirty=true;
  if(!this.meta)return;
  const normal=this.section==='long'?axis(0,-1,0):axis(0,0,1);
  const plane=new T.Plane(normal,-normal.dot(this.center)-this.cut*this.radius);
  for(const p of this.meta.parts){
   const obj=this.objects.get(p.id),mat=obj.material as T.MeshStandardMaterial;
   obj.visible=(!this.only||this.selectedIds.has(p.id))&&(!this.onlyGroup||subgroupFor(p)===this.onlyGroup)&&!this.hidden.has(p.id);
       mat.color.set(this.motionColors?(classifyPart(p,this.meta.key).category==='fixed'?'#74777c':'#7c4dff'):p.color);
   mat.wireframe=this.wire;mat.transparent=this.transparent&&p.cover;mat.opacity=mat.transparent?.19:1;mat.depthWrite=!mat.transparent;
   mat.clippingPlanes=this.section==='none'?[]:[plane];
   mat.emissive.set((p.id===this.selected||this.selectedIds.has(p.id))?0x275e50:0);mat.needsUpdate=true;
  }
 }
 draw(e,phase,explode){
  const signature=JSON.stringify([e,phase,explode,this.subExplode,this.subassemblyTarget,this.guidesOn,[...this.manual]]);
  if(!this.dirty&&signature===this.lastPose)return;
  this.lastPose=signature;this.dirty=false;
  const attr=this.guides.geometry.getAttribute('position');let n=0;const guideGroups=new Set<string>();
  if(this.meta)for(const p of this.meta.parts){
   const obj=this.objects.get(p.id);transform(obj,p,e,phase,0);
   const [lo,hi]=p.cad.bounds;const v=new T.Vector3((lo[0]+hi[0])/2,(lo[1]+hi[1])/2,(lo[2]+hi[2])/2).multiply(obj.scale).applyQuaternion(obj.quaternion);
   const group=p.group+'|'+p.ref+'|'+p.z,guide=obj.visible&&(!guideGroups.has(group)||p.id===this.selected||this.manual.has(p.id));
   if(guide){guideGroups.add(group);attr.setXYZ(2*n,obj.position.x+v.x,obj.position.y+v.y,obj.position.z+v.z);}
   obj.position.addScaledVector(this.offsets.get(p.id),explode);
   if(this.subExplode>0 && subgroupFor(p)===this.subassemblyTarget){
      const groupParts=this.meta.parts.filter(q=>subgroupFor(q)===this.subassemblyTarget);
      const anchor=groupParts.find(q=>bearingPartKind(q)==='inner')||groupParts[0];
      const width=Math.max(8,anchor.cad.bounds[1][2]-anchor.cad.bounds[0][2]);
      const r=new T.Vector3(p.x-anchor.x,p.y-anchor.y,0);
      const kind=bearingPartKind(p);
      const progress=(start:number)=>Math.max(0,Math.min(1,(this.subExplode-start)*4));
      if(kind==='inner')obj.position.z-=width*1.45*progress(.70);
      else if(kind==='outer')obj.position.z+=width*1.45*progress(0);
      else if(kind==='cage')obj.position.z+=width*.40*progress(.20);
      else if(kind==='rolling'){
         if(r.lengthSq()<.001)r.set(1,0,0);
         obj.position.addScaledVector(r.normalize(),Math.max(9,width*1.4)*progress(.45));
      }
   }
   const move=this.manual.get(p.id);if(move)obj.position[move.axis]+=move.value;
   if(guide){attr.setXYZ(2*n+1,obj.position.x+v.x,obj.position.y+v.y,obj.position.z+v.z);n++;}
  }
  this.guides.visible=this.guidesOn&&(explode>0||this.manual.size>0);
  if(attr&&this.guides.visible){attr.needsUpdate=true;this.guides.geometry.setDrawRange(0,n*2);this.guides.computeLineDistances();}
  this.renderer.render(this.scene,this.camera);
 }
 pixel(x,y,z){
  const v=axis(x,y,z).project(this.camera);return [(v.x+1)*this.host.clientWidth/2,(1-v.y)*this.host.clientHeight/2];
 }
 async glb(params){
  const group=this.root.clone(true);group.scale.setScalar(.001);
  const study=isStudy(this.meta.key);
  // Use a unique ASCII track target even when a library normalizes display names.
  const tracks=[], eAt=t=>Math.min(1,Math.max(0,(t-1)/2),Math.max(0,(7-t)/2));
  const frames=97,duration=8;
  const cache=new Map<string,any>();
  let phase={};
  for(let f=0;f<frames;f++){
   const t=f*duration/(frames-1),e=eAt(t),rates=phases(this.meta.key,params,e,24,0);
   for(const k in rates)phase[k]=(phase[k]||0)+rates[k]*(f?duration/(frames-1):0);
   for(const p of this.meta.parts){
    let record=cache.get(p.id);
    if(!record){record={times:[],position:[],quaternion:[],scale:[]};cache.set(p.id,record);}
    const obj=group.getObjectByName(p.id) as T.Mesh;
    if(f===0){obj.visible=true;obj.material=new T.MeshStandardMaterial({color:p.color,metalness:.3,roughness:.52});}
    transform(obj,p,e,phase,0);if(study)obj.position.addScaledVector(this.offsets.get(p.id),e);record.times.push(t);
    record.position.push(...obj.position.toArray());record.quaternion.push(...obj.quaternion.toArray());record.scale.push(...obj.scale.toArray());
   }
  }
  for(const [id,r] of cache){
   const p=this.meta.parts.find(p=>p.id===id),obj=group.getObjectByName(id);transform(obj,p,0,{},0);
   if(study||p.slide||p.x||p.y)tracks.push(new T.VectorKeyframeTrack(id+'.position',r.times,r.position));
   if(p.drive!=='fixed'||p.tilt)tracks.push(new T.QuaternionKeyframeTrack(id+'.quaternion',r.times,r.quaternion));
   if(p.strain)tracks.push(new T.VectorKeyframeTrack(id+'.scale',r.times,r.scale));
  }
  try{
   const result=await new GLTFExporter().parseAsync(group,{binary:true,animations:[new T.AnimationClip(study?'Despiece y montaje':'Prescribed operation',duration,tracks)],trs:true});
   return new Blob([result as ArrayBuffer],{type:'model/gltf-binary'});
  }finally{group.traverse((o:T.Mesh)=>{if(o.isMesh)(o.material as T.Material).dispose();});}
 }
}

