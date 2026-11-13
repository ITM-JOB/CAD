import * as r from 'replicad';
import {catalog,ring,cyl,polar,dogs,bored,bolt,bearing,sprocket,helix,palette} from './geometry.mjs';
export function hydraulic(p){
  const c=catalog('C'), add=c.add, keyed='input',drum='output', shaftR=p.shaft/2;
  const station=p.length-150, start=station-48, gap=p.gap, n=2*p.discs;
  const stack=p.discs*p.discT+(p.discs-1)*p.plateT, piston=start-9;
  const reaction=start+stack+n*gap;
  const ri=p.frictionID/2,ro=p.frictionOD/2,root=ri-8,tip=ri-2;
  const shellR=p.housingOD/2,outerDog=ro+10,teeth=8,guideR=root-7;
  const feedZ=piston-31,keyZ=feedZ-24;
  const input={drive:keyed},output={drive:drum},casing={...output,cover:true,color:palette.case};
  const seat=p.bearingOD/2,neck=shaftR+4;
  add('shaft','Drilled stepped shaft','Input','Feeds oil and carries the keyed inner hub','shaft',()=>{
    let s=cyl(20,100).fuse(cyl(shaftR,p.length-100).translateZ(100));
    s=s.cut(cyl(3,feedZ+2)).cut(r.makeCylinder(3,shaftR+1,[0,0,feedZ],[1,0,0]));
    return s.cut(r.makeBox([-4,shaftR-4,keyZ],[4,shaftR+1,keyZ+40]));
  },0,input);
  add('key','Parallel key','Input','Transfers torque between shaft and hub','key',()=>r.makeBox([-4,shaftR-4,0],[4,shaftR+4,40]),keyZ,input);
  add('hub','Keyed hub and guide dogs','Input','Guides intermediate plate and supports the reaction face','hub',()=>{
    let hub=dogs(root,tip,teeth,reaction+8-(piston-22)).cut(cyl(shaftR,reaction+9-(piston-22)));
    hub=hub.cut(r.makeBox([-4,shaftR-1,-1],[4,shaftR+4,50]));
    hub=hub.cut(ring(tip+1,root-14,9+n*gap+.4).translateZ(22));
    return bored(hub,4.8,2*guideR,3,21,reaction-piston+12);
  },piston-22,input);
  // A rotating annular cylinder opens towards the pack. The axial feed in
  // the shaft connects to a radial drilling and the annular cylinder base.
  const cylinderZ=piston-44;
  add('cylinder','Annular hydraulic cylinder','Actuator','Contains annular pressure chamber and locates piston','cylinder',()=>{
    let base=ring(124,shaftR,20).cut(r.makeBox([-4,shaftR-1,-1],[4,shaftR+4,21]));
    base=base.fuse(ring(124,120,24).translateZ(20)).fuse(ring(84,tip+1,24).translateZ(20));
    const offset=feedZ-cylinderZ;
    return base.cut(r.makeCylinder(2.6,104,[0,0,offset],[1,0,0])).cut(r.makeCylinder(2.6,22-offset,[103,0,offset],[0,0,1]));
  },cylinderZ,{...input,color:palette.dark});
  add('piston','Annular piston & pressure face','Actuator','Moves along Z to close all pack clearances','piston',()=>{
    const skirt=ring(119.8,84.2,14);
    return skirt.fuse(ring(ro,root-13,9).translateZ(14));
  },piston-14,{...input,slide:n*gap,color:palette.gold});
  let z=start+gap,j=0;
  const keyHole=h=>dogs(root+.65,tip+.65,teeth,h,.15);
  for(let i=0;i<p.discs;i++){
    add('disc-'+(i+1),'Lined friction disc '+(i+1),'Disc stack','Outer dogs engage the drum. Both faces carry friction load.','friction',()=>dogs(ro,outerDog,teeth,p.discT).cut(cyl(ri,p.discT)),z,{...output,slide:(n-1-j)*gap,color:palette.lining});
    j++; z+=p.discT+gap;
    if(i<p.discs-1){
      add('separator-'+(i+1),'Intermediate plate '+(i+1),'Disc stack','Inner dogs allow axial sliding on the shaft hub','separator',()=>cyl(ro,p.plateT).cut(keyHole(p.plateT)),z,{...input,slide:(n-1-j)*gap,color:palette.light});
      j++;z+=p.plateT+gap;
    }
  }
  add('reaction','Reaction plate','Disc stack','Axial stop on input hub','reaction',()=>cyl(ro,7).cut(keyHole(7)),reaction,input);
  add('stop','Hub retaining collar','Input','Reacts the axial clamp load at the inner plate','stop',()=>ring(ri+2,shaftR,3),reaction+8,input);
  const barrelZ=Math.max(station,reaction+13),drumZ=start-8, drumH=barrelZ-drumZ;
  add('drum','Outer drum and reaction web','Output','Axial slots carry lined discs and connect to the sprocket barrel','drum',()=>{
    const wall=cyl(shellR,drumH).cut(dogs(ro+3,outerDog+1.2,teeth,drumH,.16));
    return bored(wall.fuse(ring(shellR,neck,7).translateZ(drumH)),2.7,2*(shellR-6),6,-1,12);
  },drumZ,casing);
  const fixingRadius=shellR-6;
  add('drum-cover','Retaining end cover','Output','Removable annular cover over the drum lip','drum-cover',
    ()=>bored(ring(shellR,outerDog+2,3),2.7,2*fixingRadius,6,-1,5),drumZ-3,{...casing});
  for(let j=0;j<6;j++){
    const [x,y]=polar(fixingRadius,j*Math.PI/3);
    add('drum-washer-'+(j+1),'Arandela del tambor '+(j+1),'Tornillería','Distribuye la carga del tornillo sobre la tapa.','drum-washer',
      ()=>ring(4.4,2.6,.9),drumZ-3.9,{...output,x,y,color:palette.light});
    add('drum-screw-'+(j+1),'Tornillo del tambor '+(j+1),'Tornillería','Fija la tapa al tambor. Patrón y rosca interpretados.','drum-screw',
      ()=>bolt(2.5,12).rotate(180,[0,0,0],[1,0,0]),drumZ+8.1,{...output,x,y,color:palette.dark});
  }
  const z0=barrelZ+7,b1=z0+8,b2=p.length-39;
  add('sprocket','Duplex-track chain sprocket','Output','Two pairs of aligned tooth rows share a single bearing barrel','sprocket',()=>{
    const len=p.length-9-z0,w=7.2;
    let barrel=ring(Math.max(70,seat+4),seat,len);
    const tooth=sprocket(p,seat,w);
    // Two pairs are visible in the axial section (centres ~692,749,832,889 px).
    // Treat as two duplex tracks on one barrel, with provisional row widths.
    for(const where of [20,43,77,100])barrel=barrel.fuse(tooth.clone().translateZ(where));
    return barrel;
  },z0,{...output,color:palette.dark});
  for(const [id,bz] of [['main-L',b1],['main-R',b2]]) bearing(c,id,bz,neck,seat,21);
  add('bush','Bearing journal sleeve','Input','Sleeve bridges shaft and rolling-bearing bores','bush',()=>ring(neck,shaftR,p.length-z0),z0,input);
  for(const [id,zz] of [['seal-L',z0+1],['seal-R',b2+22]])
    add(id,'Shaft seal','Seals','Schematic annular seal outside bearing','seal',()=>ring(seat,neck+0.15,5),zz,{...output,color:palette.oil});
  // Sheet 281 shows return lamellae in variant II and a spring at a guide.
  // Guided return is prescribed. Its unknown spring rate is not identified.
  for(let i=0;i<3;i++){
    const [x,y]=polar(guideR,2*Math.PI*i/3),wire=.65,h=reaction+8-start-2*wire;
    add('return-'+i,'Return spring '+(i+1),'Actuator','Guide-bore compression spring returns piston after venting','return-coil',
      ()=>helix(3.4,wire,h,5),start+wire,{...input,x,y,slide:n*gap,strain:-n*gap/h,color:palette.gold});
  }
  add('union','Stationary oil distributor','Oil feed','Inlet housing for variant I. Rotating seals are simplified.','union',()=>{
    const body=ring(39,35,78).fuse(ring(39,20.4,6)).fuse(ring(39,20.4,6).translateZ(72));
    return body.fuse(r.makeCylinder(8,18,[0,36,39],[0,1,0])).cut(r.makeCylinder(3,30,[0,26,39],[0,1,0]));
  },0,{cover:true,color:palette.case});
  for(const [id,bz] of [['feed-L',46],['feed-R',62]])bearing(c,id,bz,20,35,8,'fixed','input');
  return c;
}

