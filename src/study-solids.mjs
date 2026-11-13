import * as r from 'replicad';
import {catalog,cyl,ring,bolt,polar,polygon,palette} from './geometry.mjs';

export function turned(profile){
 let path=r.draw(profile[0]);for(const pt of profile.slice(1))path=path.lineTo(pt);
 return path.close().sketchOnPlane('XZ').revolve([0,0,1]);
}
export function shaftProfile(stations,bore=0){
 const points=[[bore,0]];let z=0;
 for(const [len,rad] of stations){points.push([rad,z],[rad,z+len]);z+=len;}
 points.push([bore,z]);return turned(points);
}
export function box(w,h,l){return r.makeBox([-w/2,-h/2,0],[w/2,h/2,l]);}
export const holes=(body,points,rad,l)=>points.reduce((s,[x,y])=>s.cut(cyl(rad,l+2).translate(x,y,-1)),body);
export const circlePattern=(rad,n)=>Array.from({length:n},(_,i)=>polar(rad,i*2*Math.PI/n));
export const hex=(rad,h)=>polygon(circlePattern(rad,6),h);
// Sample true involute flanks at a 20° provisional pressure angle.
export function gear(teeth,module,width,bore){
 const pitch=teeth*module/2,base=pitch*Math.cos(Math.PI/9),root=pitch-1.25*module,tip=pitch+module;
 const inv=rad=>{const t=Math.sqrt(Math.max(0,(rad/base)**2-1));return t-Math.atan(t);};
 const half=r=>Math.PI/(2*teeth)+inv(pitch)-inv(r);
 const points=[];
 for(let i=0;i<teeth;i++){
  const a=i*2*Math.PI/teeth,r0=Math.max(root,base);
  points.push(polar(root,a-half(r0)));
  for(let j=0;j<=3;j++){const rad=r0+(tip-r0)*j/3;if(j||r0>root)points.push(polar(rad,a-half(rad)));}
  for(let j=3;j>=0;j--){const rad=r0+(tip-r0)*j/3;if(j||r0>root)points.push(polar(rad,a+half(rad)));}
  points.push(polar(root,a+half(r0)));
 }
 return polygon(points,width).cut(cyl(bore,width));
}
export function study(key){
 const c=catalog(key);
 function part(id,name,group,shape,z=0,x=0,y=0,options={}){
  c.add(id,name,group,options.role||name,options.ref||id,shape,z,{x,y,color:palette.steel,...options});
 }
 function fastening(prefix,points,z,r0,length,group='Tornillería',withNut=false){
  for(const [j,[x,y]] of points.entries()){
   const id=prefix+'-'+(j+1),shapeKey='fix-'+r0+'-'+length;
   part(id,'Tornillo '+(j+1),group,()=>bolt(r0,length),z,x,y,{ref:shapeKey,color:palette.dark});
   part(id+'-w','Arandela '+(j+1),group,()=>ring(r0*2,r0*1.08,r0*.35),z+length-r0*.35,x,y,{ref:'washer-'+r0,color:palette.light});
   if(withNut)part(id+'-n','Tuerca '+(j+1),group,()=>hex(r0*1.9,r0*1.4).cut(cyl(r0*1.05,r0*1.4)),z,x,y,{ref:'nut-'+r0});
  }
 }
 function support(id,z,x,y,ri,ro,b,type='bolas'){
  const g='Rodamiento '+id,R=(ri+ro)/2,gap=(ro-ri),rolling=gap*.23;
  const ref='br-'+[ri,ro,b,type].join('-');
  const track=type==='bolas'?r.drawCircle(rolling*1.03).translate(R,b/2).sketchOnPlane('XZ').revolve([0,0,1]):null;
  const inner=()=>{const sh=ring(R-rolling*(track?.7:1.02),ri,b);return track?sh.cut(track):sh;};
  const outer=()=>{const sh=ring(ro,R+rolling*(track?.7:1.02),b);return track?sh.cut(track):sh;};
  part(id+'-int','Aro interior',g,inner,z,x,y,{ref:ref+'-i'});
  part(id+'-ext','Aro exterior',g,outer,z,x,y,{ref:ref+'-o',color:palette.dark});
  for(let j=0;j<10;j++){
   const [rx,ry]=polar(R,j*Math.PI/5);
   part(id+'-r'+j,(track?'Bola ':'Rodillo ')+(j+1),g,()=>track?r.makeSphere(rolling):cyl(rolling,b*.76),z+(track?b/2:b*.12),x+rx,y+ry,{ref:ref+'-r',color:palette.gold});
  }
 }
 function flange(id,z,x,y,ri,ro,thick,n=4){
  const pts=circlePattern(ro*.85,n),rad=Math.max(1,(ro-ri)*.12);
  part(id,'Tapa de apoyo','Tapas',()=>holes(ring(ro,ri,thick),pts,rad*1.12,thick),z,x,y,{cover:true,color:palette.case});
  fastening(id+'-fix',pts.map(([a,b])=>[a+x,b+y]),z-thick*.5,rad,thick*1.5+rad*.35);
 }
 return {c,part,fastening,support,flange};
}

