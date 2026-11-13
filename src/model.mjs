import * as r from 'replicad';
import {validate} from './mechanics.mjs';
import {hydraulic} from './hydraulic.mjs';
import {automotive,transmission} from './other-assemblies.mjs';
import {isStudy,sheetFor} from './library.mjs';
import {studyModel} from './studies.mjs';
export function model(key,p){
 validate(key,p);
 if(isStudy(key))return studyModel(key);
 return ({A:transmission,B:automotive,C:hydraulic})[key](p);
}
export function placed(c,part){
 return c.solids.get(part.ref).clone().rotate(part.angle*180/Math.PI,[0,0,0],[0,0,1]).translate(part.x,part.y,part.z);
}
export function inspectSolid(shape){
 const oc=r.getOC(),check=new oc.BRepCheck_Analyzer(shape.wrapped,true);
 try{
  const valid=check.IsValid(),volume=r.measureVolume(shape);
  if(!valid || !(volume>0)) throw Error('OpenCascade rejected solid: validity='+valid+', volume='+volume);
  return {valid,volume,bounds:shape.boundingBox.bounds};
 }finally{check.delete();}
}
export function metadata(c,p,checks){
 return {key:c.key,units:'mm',frame:'right handed, +Z along shaft from left to right on axial reference',parameters:p,
  state:'free / datum',parts:c.parts.map(part=>({...part,parent:c.key+'/'+part.group,geometry:part.ref,
   associatedViews: c.key==='A'?['axial','A–A']:c.key==='B'?['axial','A–A']:['axial',...(part.id==='sprocket'?['C–C']:[])],
   confidence:part.id.includes('ball')?'symbol confirms bearing; internal geometry estimated':'interpretive geometry; see reference report',
   connections:part.drive==='fixed'?'stationary support':part.drive+' group; see assembly hierarchy and joint',
   missing:['material specification','manufacturing tolerances','complete feature dimensions'],
   reference:isStudy(c.key)?'/laminas/'+sheetFor(c.key)+'.pdf':c.key+'.png',localFrame:'right handed XYZ',joint:part.tilt?'revolute lever':part.slide?'coaxial slider':part.drive==='fixed'?'fixed':'revolute follower',
   matrix:[Math.cos(part.angle),Math.sin(part.angle),0,0,-Math.sin(part.angle),Math.cos(part.angle),0,0,0,0,1,0,part.x,part.y,part.z,1],
   cad:checks[part.ref]}))};
}

