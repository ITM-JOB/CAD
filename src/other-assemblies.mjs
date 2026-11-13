import * as r from 'replicad';
import {catalog,ring,cyl,polar,dogs,bored,bolt,bearing,helix,palette} from './geometry.mjs';

export function automotive(p){
 const c=catalog('B'),add=c.add,ri=p.frictionID/2,ro=p.frictionOD/2,rs=p.shaft/2,t=p.discT,L=p.travel;
 const input={drive:'input'},output={drive:'output'}, D=20+t, coverZ=D+38;
 add('flywheel','Flywheel','Input','Engine-side inertia and first friction surface','flywheel',()=>{
   const rim=ring(ro+45,rs+11,20);
   return bored(rim,3.8,2*(ro+14),6,-1,23);
 },0,input);
 add('disc','Driven disc with splined centre','Output','Both facings drive a common web and spline hub','disc',()=>{
   const web=ring(ri+1,rs+5,3).translateZ(t/2-1.5);
   const hub=cyl(rs+11,t+14).translateZ(-7).cut(dogs(rs+.3,rs+3.3,12,t+16,.16).translateZ(-8));
   return ring(ro,ri,t).fuse(web).fuse(hub);
 },20,{...output,color:palette.lining});
 add('shaft','Splined gearbox input shaft','Output','Slides within the driven hub','shaft',()=>{
   const middle=dogs(rs+.08,rs+3,12,46).translateZ(13);
   return cyl(rs,152).fuse(middle);
 },-6,output);
 add('pressure','Pressure plate','Pressure group','Coil springs press this annulus against the driven disc','pressure',()=>ring(ro,ri,9),D+L,{...input,slide:-L,color:palette.gold});
 const springR=(ri+ro)/2;
 add('cover','Bolted spring cover','Input','Provides spring seats, lever pivots and attachment to flywheel','cover',()=>{
   let wall=ring(ro+25,ro+21,coverZ-20);
   wall=wall.fuse(ring(ro+25,ro+3,4));
   const end=ring(ro+25,42,4).translateZ(coverZ-20);
   return bored(wall.fuse(end),3.8,2*(ro+14),6,-1,coverZ+2);
 },20,{...input,cover:true,color:palette.case});
 for(let i=0;i<6;i++){
   const a=(i+.5)*Math.PI/3,[x,y]=polar(springR,a);
   const wire=1.5, h=coverZ-D-L-9-2*wire;
   const strain=L/(h+2*wire);
   add('spring-'+(i+1),'Clamp spring '+(i+1),'Pressure group','Compression spring between cover and pressure plate','coil',()=>helix(7,wire,h,5),D+L+9+wire,{...input,x,y,slide:-L+wire*strain,strain,color:palette.dark});
   const [bx,by]=polar(ro+14,i*Math.PI/3);
   add('bolt-'+(i+1),'Cover screw '+(i+1),'Input','Clamps cover flange to flywheel','bolt',()=>bolt(3.5,12),12,{...input,x:bx,y:by,angle:Math.PI/6+i*Math.PI/3});
 }
 // Tangential pivot. Lever tip and pressure-pad displacements have opposite signs.
 const pivot=ri+5, tip=34, out=pivot+14;
 for(let i=0;i<3;i++){
   const a=i*2*Math.PI/3,[x,y]=polar(pivot,a);
   add('lever-'+(i+1),'Release lever '+(i+1),'Release','Pivots about a tangential cover pin','lever',()=>{
     const body=r.makeBox([tip-pivot,-4,-3],[out-pivot,4,3]);
     return body.cut(r.makeCylinder(2,10,[0,-5,0],[0,1,0]));
   },D+L+12,{...input,x,y,angle:a,tilt:Math.asin(L/14),color:palette.dark});
   add('pin-'+(i+1),'Lever pivot '+(i+1),'Release','Fixed to cover, concentric with lever bore','pivot-pin',()=>r.makeCylinder(1.95,12,[0,-6,0],[0,1,0]),D+L+12,{...input,x,y,angle:a});
 }
 const releaseTravel=(pivot-tip)*L/14;
 add('release-bearing','Release bearing contact ring','Release','Guided axially against the three lever tips','release',()=>ring(36,rs+8,8),D+L+15,{slide:releaseTravel,color:palette.light});
 add('bell','Bell housing','Stationary','Stationary outer bell with gearbox-side bearing support','bell',()=>{
   const wall=ring(ro+61,ro+57,100);
   const back=ring(ro+61,rs+15,5).translateZ(100);
   return wall.fuse(back);
 },-3,{cover:true,color:palette.case});
 bearing(c,'gearbox-rear',94,rs,rs+15,12,'fixed','output');
 return c;
}

export function transmission(p){
 const c=catalog('A'),add=c.add,R=p.housingOD/2,s=p.shaft/2,L=p.length,off=p.offset;
 const input={drive:'input'},carrier={drive:'output'},casing={cover:true,color:palette.case};
 add('case','Foot-mounted housing','Stationary','Supports coaxial journals around the offset members','case',()=>{
   let h=ring(R,R-6,L);
   for(const sign of [-1,1])h=h.fuse(r.makeBox([sign*R*.62-10,-R-4,0],[sign*R*.62+10,-R*.62,L]));
   return h;
 },0,casing);
 for(const [id,z,bore] of [['front',-5,s+6],['rear',L,s+13]])
   add(id,id+' end cover','Stationary','Locates shaft bearing and closes housing',id,()=>bored(ring(R,bore,5),2.4,2*(R-3),6,-1,7),z,casing);
 add('input','Central input shaft','Input','Keyed shaft at the left of axial section','input',()=>{
   const sh=cyl(s,89);
   return sh.cut(r.makeBox([s-2,-2,2],[s+1,2,15]));
 },-24,input);
 const carrierR=off+15;
 add('carrier','Carrier and output journal','Output','Right side web and coaxial output shaft','carrier',()=>{
   const plate=ring(carrierR,s+1,6);
   const neck=ring(s+7,s+1,L-60).translateZ(5);
   return plate.fuse(neck).fuse(cyl(s+7,21).translateZ(L-55));
 },65,carrier);
 for(let j=0;j<3;j++){
   const a=Math.PI/2-j*2*Math.PI/3,[x,y]=polar(off,a);
   add('pin-'+j,'Offset journal '+(j+1),'Carrier members','Supports the offset rotating member','pin',()=>cyl(5,53),12,{...carrier,x,y});
   add('wheel-'+j,'Offset member '+(j+1),'Carrier members','Web, lightening holes and hub only. Peripheral engagement unresolved.','rim',()=>{
     const web=bored(ring(off*.70,5.3,5),2.4,off*.78,4,-1,7);
     return web.fuse(ring(9,5.3,15).translateZ(-5)).fuse(ring(off*.7,off*.59,11).translateZ(-3));
   },28,{...carrier,x,y,color:palette.gold});
 }
 bearing(c,'input-bearing',-5,s,s+6,5,'fixed','input');
 bearing(c,'output-bearing',L,s+7,s+13,5,'fixed','output');
 for(let i=0;i<6;i++){
   const [x,y]=polar(R-3,i*Math.PI/3);
   add('cap-screw-'+(i+1),'End cover screw '+(i+1),'Stationary','Cover clamp, thread simplified','screw',()=>bolt(2,5),L,{x,y});
 }
 return c;
}

