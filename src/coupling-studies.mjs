import * as r from 'replicad';
import {cyl,ring,polar,palette,helix,polygon} from './geometry.mjs';
import {study,turned,box,holes,circlePattern} from './study-solids.mjs';
export function articulated(){
 const s=study('263'),{part}=s,R=152;
 for(const [i,z] of [[0,0],[1,658]]){
  part('manguito-'+i,'Manguito chaveteado '+(i+1),'Terminales',()=>ring(R,73,105).cut(box(22,20,108).translate(0,74,-1)),z);
  const pcd=circlePattern(152,8);
  part('brida-'+i,'Brida atornillada '+(i+1),'Terminales',()=>holes(ring(175,75,22),pcd,6.5,22),z+(i?100:0),0,0,{color:palette.dark});
  s.fastening('brida-'+i,pcd,z+(i?88:-12),6,36,'Tornillería',true);
  const fork=()=>{const foot=ring(122,73,22);let body=foot;
   for(const sign of [-1,1])body=body.fuse(box(32,90,90).translate(sign*95,0,20));
   return body.cut(r.makeCylinder(23,245,[-122,0,86],[1,0,0]));
  };
  part('horquilla-'+i,'Horquilla '+(i+1),'Articulación',()=>i?fork().rotate(180,[0,0,0],[1,0,0]):fork(),i?z:z+105);
  const jointZ=i?z-86:z+191;
  part('cruceta-'+i,'Muñón transversal '+(i+1),'Articulación',()=>r.makeCylinder(22,226,[-113,0,0],[1,0,0]),jointZ,0,0,{ref:'munon',color:palette.gold});
 }
 part('arbol','Árbol intermedio','Transmisión',()=>cyl(64,340),216);
 return s.c;
}
export function clutchStudy(key){
 const s=study(key),{part}=s;
 if(key==='281-2'){
  const N=6,ri=63.5,ro=125;
  part('hub','Cubo interior','Entrada',()=>ring(ri,35,104),0);
  part('drum','Tambor exterior','Salida',()=>ring(145,ro+2,91).fuse(ring(145,ri+1,8)),0,0,0,{cover:true,color:palette.case});
  for(let j=0;j<N;j++){
   part('fric-'+j,'Disco revestido '+(j+1),'Paquete de discos',()=>ring(ro+2,ri+3,4),16+j*9,0,0,{ref:'fric',color:palette.lining});
   part('placa-'+j,'Placa intermedia '+(j+1),'Paquete de discos',()=>ring(ro,ri,4),20.5+j*9,0,0,{ref:'placa'});
  }
  part('piston','Pistón anular','Accionamiento',()=>turned([[ri+1,0],[ro,0],[ro,7],[115,7],[115,19],[ri+1,19]]),71,0,0,{color:palette.gold});
  part('cylinder','Cilindro hidráulico','Accionamiento',()=>ring(141,115.4,26).fuse(ring(141,ri+1,5).translateZ(26)),78,0,0,{cover:true,color:palette.dark});
  for(const [j,[x,y]] of circlePattern(52,4).entries())part('spring-'+j,'Muelle de retorno '+(j+1),'Retorno',()=>helix(3,0.65,20,5),78,x,y,{ref:'spring',color:palette.gold});
 }else if(key==='296-2'){
  // Fig. 2b: an axial section through the spider and opposing clutch half.
  // The construction of the elastic coupling elements is schematic.
  const pivots=circlePattern(50,3);
  part('cubo-motor','Cubo motor acanalado','Entrada',()=>ring(28,16,50),-12);
  part('plato-motor','Plato portabrazos','Entrada',()=>holes(ring(64,28,7),pivots,4.2,7),0);
  part('cubo-salida','Cubo conducido','Salida',()=>ring(27,17,45),38);
  part('plato-conducido','Plato conducido','Salida',()=>holes(ring(73,27,6),circlePattern(61,3),3.3,6),38,0,0,{cover:true,color:palette.case});
  part('aro','Aro de cierre','Salida',()=>ring(73,69,31),7,0,0,{cover:true,color:palette.dark});
  for(const [j,[x,y]] of pivots.entries()){
   const a=j*2*Math.PI/3;
   part('bulon-'+j,'Bulón del brazo '+(j+1),'Articulaciones',()=>cyl(4,28),-2,x,y,{ref:'bulon'});
   part('brazo-'+j,'Brazo oscilante '+(j+1),'Brazos',()=>holes(r.drawRoundedRectangle(36,14,6).sketchOnPlane('XY').extrude(8),[[-10,0],[10,0]],4.2,8),8,x+10*Math.sin(a),y-10*Math.cos(a),{ref:'brazo',angle:a-Math.PI/2});
   part('elemento-'+j,'Casquillo elástico '+(j+1),'Brazos',()=>ring(8,4.25,15),18,x,y,{ref:'casquillo',color:palette.oil});
  }
  s.fastening('reten',circlePattern(61,3),26,3,19);
 }else{
  const count=3,R=80;
  part('tambor','Tambor conducido','Salida',()=>ring(86,R,38).fuse(ring(86,20,5).translateZ(38)),0,0,0,{cover:true,color:palette.case});
  part('hub','Cubo de entrada','Entrada',()=>ring(38,17,12).fuse(ring(23,17,25).translateZ(-15)),0);
  for(let j=0;j<count;j++){
   const a=j*2*Math.PI/count,points=[];
   for(let i=0;i<=16;i++)points.push(polar(78,a+.1+i*1.72/16));
   for(let i=16;i>=0;i--)points.push(polar(61,a+.1+i*1.72/16));
   part('shoe-'+j,'Zapata '+(j+1),'Zapatas',()=>polygon(points,22),11,0,0,{color:palette.lining});
   const pts=[polar(29,a),polar(65,a+.44)],dx=pts[1][0]-pts[0][0],dy=pts[1][1]-pts[0][1],l=Math.hypot(dx,dy);
   for(const [n,P] of pts.entries())part('pin-'+j+'-'+n,'Pasador '+(j*2+n+1),'Articulaciones',()=>cyl(4,29),5,...P,{ref:'pin',color:palette.gold});
   part('bieleta-'+j,'Bieleta '+(j+1),'Articulaciones',()=>holes(r.drawRoundedRectangle(l+14,14,6).sketchOnPlane('XY').extrude(4),[[-l/2,0],[l/2,0]],4.15,4),31,(pts[0][0]+pts[1][0])/2,(pts[0][1]+pts[1][1])/2,{ref:'bieleta',angle:Math.atan2(dy,dx)});
  }
 }
 return s.c;
}

