import * as r from 'replicad';
import {cyl,ring,polar,palette,sprocket} from './geometry.mjs';
import {study,box,gear,holes,shaftProfile,turned,circlePattern} from './study-solids.mjs';

// Axes are parallel to Z. Each gear entry defines its own station, tooth count
// and module. Counts transcribed from labelled gears; unlabelled stations are
// interpreted. No ratio is enforced across the selectors.
const trains={
 '154':{length:330,spacing:[0,149],m:4.25,rows:[[[35,27],[112,23],[170,37],[230,47],[285,62]],[[35,43],[112,47],[170,33],[230,22],[285,16]]],names:['Eje principal','Contraeje'],r:20},
 '157':{length:270,spacing:[0,65],m:2,rows:[[[36,40],[80,35],[122,30],[159,25],[202,18],[237,38]],[[36,25],[80,30],[122,35],[159,40],[202,42],[237,27]]],names:['Husillo','Eje secundario'],r:11},
 '161':{length:290,spacing:[0,114,214,309,405],m:3,rows:[[[42,68],[115,55],[170,61],[215,48]],[[42,17],[115,21],[170,24],[215,28]],[[70,34],[128,53],[195,28]],[[70,21],[128,21],[195,27]],[[70,48],[195,27]]],names:['Husillo','Eje IV','Eje III','Eje II','Eje I'],r:15},
 '164':{length:460,spacing:[0,120,230,360,540],m:4,rows:[[[52,26],[170,19]],[[52,34],[110,28],[170,22]],[[82,39],[142,28],[205,18]],[[82,26],[142,37],[205,47],[368,22]],[[82,37],[368,71]]],names:['Eje I','Eje II','Eje III','Eje IV','Husillo V'],r:20}
};
export function gearbox(key){
 const s=study(key),{part,support,flange}=s,t=trains[key],L=t.length,half=t.m*Math.max(...t.rows.flat().map(p=>p[1]))/2+12,centres=t.spacing.map(v=>[v,0]),mid=t.spacing.at(-1)/2;
 const w=mid*2+half*2+12,h=half*2+14;
 part('cuerpo','Cuerpo de la caja','Carcasa',()=>box(w,h,L).cut(box(w-12,h-12,L+2).translateZ(-1)),0,mid,0,{cover:true,color:palette.case});
 for(const [i,[x,y]] of centres.entries()){
  const rad=t.r*(i===t.rows.length-1&&key==='164'?1.5:1),group=t.names[i],z0=t.rows[i][0][0];
  part('eje-'+i,group,group,()=>shaftProfile([[20,rad*.84],[L+24,rad],[20,rad*.84]]),-32,x,y);
  for(const [j,[z,n]] of t.rows[i].entries()){
   const ref='rueda-'+n+'-'+rad,wd=t.m*4;
   part('e'+i+'-g'+j,'Rueda dentada · '+n+' dientes',group,()=>gear(n,t.m,wd,rad+.12),z,x,y,{ref,color:j%2?palette.light:palette.gold});
  }
  for(const [end,z] of [[0,0],[1,L-14]]){
   support('e'+i+'-'+end,z,x,y,rad,rad*1.65,14);
   flange('tapa-'+i+'-'+end,end?L:-5,x,y,rad+1,rad*2.25,5);
  }
  if(key==='157'&&i===0||key==='161'&&i===3){
   const R=key==='157'?90:100;
   for(const [j,z] of (key==='157'?[-64,L+8]:[L+8]).entries()){
    const points=[[rad*.84,0],[R,0]];
    for(let k=0;k<3;k++)points.push([R,2+k*8],[R-6,4+k*8],[R-6,6+k*8],[R,8+k*8]);
    points.push([R,28],[rad*.84,28]);
    part('polea-'+j,'Polea de canales','Accionamiento',()=>turned(points),z,x,y,{color:palette.dark});
   }
  }
 }
 if(key==='154'){
  part('palanca','Palanca de cambios','Selector',()=>cyl(4,96).rotate(90,[0,0,0],[1,0,0]),64,mid,-half);
  part('pomo','Pomo de mando','Selector',()=>r.makeSphere(10),64,mid,-half-96);
 }
 return s.c;
}
// Open-belt common tangents and wrap arcs. Each pitch interval has separate
// side plates and roller. Chain dimensions except printed pitch are estimated.
function chain(s,id,a,b,ra,rb,pitch,z){
 const dist=b-a,phi=Math.acos((ra-rb)/dist),ta=polar(ra,phi),tb=polar(rb,phi),span=Math.hypot(b+tb[0]-a-ta[0],tb[1]-ta[1]);
 const arcB=2*phi*rb,arcA=(2*Math.PI-2*phi)*ra,per=2*span+arcA+arcB;
 function point(d){
  const mix=(u,v,f)=>u.map((x,i)=>x+(v[i]-x)*f);
  if(d<span)return mix([a+ta[0],ta[1]],[b+tb[0],tb[1]],d/span);
  d-=span;if(d<arcB){const [x,y]=polar(rb,phi-d/rb);return [b+x,y];}
  d-=arcB;if(d<span)return mix([b+tb[0],-tb[1]],[a+ta[0],-ta[1]],d/span);
  const [x,y]=polar(ra,-phi-(d-span)/ra);return [a+x,y];
 }
 const N=Math.round(per/pitch/2)*2;
 for(let j=0;j<N;j++){
  const P=point(j*per/N),Q=point((j+1)%N*per/N),dx=Q[0]-P[0],dy=Q[1]-P[1],angle=Math.atan2(dy,dx),group='Cadena '+id;
  const l=Math.round(Math.hypot(dx,dy)*10)/10,r0=pitch*.21,th=pitch*.10;
  // Capsule plate with two pin holes; alternating offsets distinguish inner and outer links.
  for(const side of [-1,1]){
   s.part(id+'-'+j+'p'+(side+1),'Placa de eslabón '+(j+1),group,()=>{
    const d=r.drawRoundedRectangle(l+2*r0,2*r0,r0*.98).sketchOnPlane('XY').extrude(th);
    return holes(d,[[-l/2,0],[l/2,0]],pitch*.10,th);
   },z+side*(pitch*.27+(j%2)*th*1.15), (P[0]+Q[0])/2,(P[1]+Q[1])/2,{ref:'link-'+pitch+'-'+l,angle,color:j%2?palette.dark:palette.steel});
  }
  s.part(id+'-'+j+'pin','Pasador '+(j+1),group,()=>cyl(pitch*.096,pitch*.93),z-pitch*.41,...P,{ref:'pin-'+pitch});
  s.part(id+'-'+j+'roll','Rodillo '+(j+1),group,()=>ring(pitch*.28,pitch*.105,pitch*.42),z-pitch*.21,...P,{ref:'roller-'+pitch,color:palette.gold});
 }
}
export function chainDrive(key){
 const s=study(key),{part,support}=s,isVar=key==='89',pitch=isVar?24:12.7,D=isVar?360:210,centres=isVar?[0,D]:[0,D,0],levels=isVar?[0]:[0,42];
 const outer=isVar?163:175,w=D+2*outer+35,h=2*outer+35,L=isVar?114:105;
 part('carcasa','Cárter de transmisión','Carcasa',()=>box(w,h,L).cut(box(w-14,h-14,L+2).translateZ(-1)),-35,D/2,0,{cover:true,color:palette.case});
 for(const [j,z] of levels.entries()){
  const teeth=isVar?[0,0]:j?[75,15]:[15,75],rad=teeth.map(n=>isVar?117:pitch/(2*Math.sin(Math.PI/n)));
  for(const [i,x] of [0,D].entries()){
   if(isVar){
    for(const dir of [-1,1])part('cono-'+i+'-'+dir,'Semipolea cónica '+(dir<0?'izquierda':'derecha'),'Variador',()=>turned([[16,0],[44,0],[155,dir*20],[155,dir*24],[16,dir*24]]),z+dir*5,x,0,{color:palette.gold});
   }else part('rueda-'+j+'-'+i,'Estrella de '+teeth[i]+' dientes','Etapa '+(j+1),()=>sprocket({pitch,teeth:teeth[i]},15.2,5.2),z-2.6,x,0,{color:palette.gold});
  }
  chain(s,'E'+(j+1),0,D,rad[0],rad[1],pitch,z);
 }
 for(const [i,x] of centres.entries()){
  const start=!isVar&&i===2?28:-50,end=!isVar&&i===0?24:96;
  part('arbol-'+i,['Árbol de entrada','Árbol intermedio','Árbol de salida'][i],'Ejes',()=>cyl(15,end-start),start,x);
  const z=i===2?65:-30;
  support('apoyo-'+i,z,x,0,15,28,11);s.flange('tapa-'+i,z-5,x,0,15.3,38,5);
 }
 return s.c;
}

