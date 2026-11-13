import * as r from 'replicad';
import {cyl,ring,polar,palette,bolt} from './geometry.mjs';
import {study,turned,shaftProfile,box,holes,circlePattern,hex} from './study-solids.mjs';
const specifications={
 '209-1':{L:850,s:62,type:'motor',bear:'rodillos',out:205},
 '209-2':{L:385,s:30,type:'motor',bear:'bolas',out:105},
 '210-1':{L:860,s:52,type:'torno',bore:35,bear:'rodillos',out:104},
 '210-2':{L:630,s:33,type:'fresa',bore:10,bear:'bolas',out:112},
 '210-3':{L:440,s:39,type:'taladro',bore:12,bear:'bolas',out:76},
 '212-1':{L:765,s:37.5,type:'cadena',bear:'rodillos',out:138},
 '212-2':{L:550,s:30,type:'retorno',bear:'bolas',out:95},
 '214-1':{L:1750,s:82.5,type:'locomotora',bear:'rodillos',out:243},
 '214-2':{L:2036,s:83,type:'vagón',bear:'rodillos',out:365}
};
export function shaftMachine(key){
 const w=study(key),{part,support,flange}=w,{L,s,type,bore=0,bear,out}=specifications[key];
 const foot=(key==='214-1'||key==='212-1')?.19:.08,rs=s*.87;
 part('arbol',bore?'Husillo hueco escalonado':'Árbol escalonado','Árbol',()=>shaftProfile([[L*.04,s*.76],[L*.20,rs],[L*.52,s],[L*.20,rs],[L*.04,s*.76]],bore),0);
 for(const [end,z] of [[0,L*foot],[1,L*(1-foot)-s*.52]]){
  const ro=rs*1.75,b=s*.52;
  support('apoyo-'+end,z,0,0,rs,ro,b,bear);
  part('soporte-'+end,'Alojamiento de rodamiento','Apoyos',()=>ring(ro*1.18,ro,b),z,0,0,{cover:true,color:palette.case});
  flange('tapa-'+end,end?z+b:z-s*.16,0,0,rs+.3,ro*1.18,s*.16);
  part('obturador-'+end,'Anillo obturador','Retención',()=>ring(ro*.93,rs+.15,s*.10),end?z+b+s*.16:z-s*.26,0,0,{color:palette.oil});
 }
 if(type==='motor'){
  part('rotor','Paquete magnético del rotor','Rotor',()=>ring(out*.66,s,L*.48),L*.26,0,0,{color:palette.dark});
  part('estator','Corona del estator','Estator',()=>ring(out,out*.68,L*.52),L*.24,0,0,{color:palette.case,cover:true});
  const cageRadius=out*1.07;
  part('bastidor','Carcasa del motor','Estator',()=>ring(cageRadius,out,L*.72),L*.14,0,0,{color:palette.case,cover:true});
  for(const [j,[x,y]] of circlePattern(out*.79,12).entries())part('bobina-'+j,'Cabeza de bobina '+(j+1),'Estator',()=>r.drawRoundedRectangle(out*.13,L*.54,out*.06).cut(r.drawRoundedRectangle(out*.061,L*.50,out*.025)).sketchOnPlane('XZ').extrude(out*.07),L*.5,x,y,{ref:'bobina',angle:j*Math.PI/6,color:palette.lining});
 }else if(['vagón','locomotora','cadena','retorno'].includes(type)){
  const rail=type==='vagón'||type==='locomotora',centers=rail?(type==='vagón'?[L*.246,L*.72]:[L*.05,L*.895]):[L*.44];
  for(const [j,z] of centers.entries()){
   const width=rail?L*.055:L*.105,ri=rail&&type==='locomotora'?rs:s;
   const profile=[[ri,0],[out*.46,0],[out*.47,width*.34],[out*.83,width*.4],[out*.86,0],[out,0],[out,width*.77],[out*1.055,width*.83],[out*1.055,width],[out*.82,width],[out*.8,width*.59],[out*.47,width*.56],[out*.46,width],[ri,width]];
   part('rueda-'+j,rail?'Rueda ferroviaria '+(j+1):'Rueda del transportador','Ruedas',()=>turned(profile),z,0,0,{color:palette.dark});
  }
 }else{
  const z=L*.48,wid=L*.10;
  const profile=[[s,0],[out,0]];
  for(let j=0;j<3;j++){const a=wid*j/3;profile.push([out,a+wid*.04],[out*.91,a+wid*.11],[out*.91,a+wid*.20],[out,a+wid*.29]);}
  profile.push([out,wid],[s,wid]);
  part('manguito',type==='fresa'?'Polea acanalada':'Manguito de accionamiento','Accionamiento',()=>type==='fresa'?turned(profile):ring(out*.64,s,wid),z,0,0,{color:palette.gold});
  part('cuello','Nariz portaherramienta','Árbol',()=>turned([[rs,0],[s*1.48,0],[s*1.48,s*.3],[s*1.22,s*.65],[rs,s*.65]]),L*.86);
 }
 return w.c;
}
export function jack(){
 const w=study('60'),{part}=w;
 part('base','Placa de base con cartelas','Bastidor',()=>{
  let b=box(180,125,8);
  for(const sign of [-1,1])b=b.fuse(r.draw([0,0]).lineTo([39*sign,0]).lineTo([0,50]).close().sketchOnPlane('XZ').extrude(7).translate(sign*48,0,7.9));
  return b;
 },0,0,0,{cover:true,color:palette.case});
 part('tube','Columna tubular','Bastidor',()=>ring(50,43,260),8,0,0,{cover:true,color:palette.case});
 part('nut','Tuerca de elevación','Husillo',()=>ring(43,30.4,58),206,0,0,{color:palette.gold});
 part('screw','Husillo de elevación','Husillo',()=>shaftProfile([[170,30],[22,37],[18,25]]),105);
 part('stop','Collar de tope','Husillo',()=>ring(41,30,7),105);
 part('head','Cabezal de apoyo','Cabezal',()=>shaftProfile([[12,45],[22,55],[8,63]],25.3),295);
 w.support('axial',284,0,0,25,45,10);
 part('handle','Barra de accionamiento','Cabezal',()=>cyl(9,170).rotate(90,[0,0,0],[0,1,0]),317,-85,0);
 for(const [i,x] of [-83,83].entries())part('mando-'+i,'Tope de barra '+(i+1),'Cabezal',()=>r.makeSphere(11),317,x,0,{ref:'tope'});
 w.fastening('base',[[68,43],[-68,43],[68,-43],[-68,-43]],0,3,9);
 return w.c;
}

