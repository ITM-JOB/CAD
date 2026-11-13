import original from './parameters.json' with {type:'json'};
import {studyKeys} from './library.mjs';
const definitions={...original,...Object.fromEntries(studyKeys.map(k=>[k,{}]))};
export {definitions};
export const defaults = key => Object.fromEntries(Object.entries(definitions[key]).map(([k,[v]])=>[k,v]));
export function validate(key,p){
  for(const [k,[,unit,,lo,hi]] of Object.entries(definitions[key])){
    if(!Number.isFinite(p[k]) || p[k]<lo || p[k]>hi) throw Error(k+' must be within '+lo+' … '+hi+' '+unit);
  }
  for(const k of ['teeth','discs','leverCount']) if(k in p && !Number.isInteger(p[k])) throw Error(k+' must be an integer');
  if(key==='C' && p.pitch/Math.sin(Math.PI/p.teeth)/2-p.pitch*.32 <= p.bearingOD/2+6) throw Error('Roller seats intersect the bearing barrel');
}
export function clutch(p,stroke){
  const n=2*p.discs, area=Math.PI*(120**2-84**2), travel=n*p.gap;
  const applied=stroke*p.pressure*area;
  const clamp=stroke>=1?Math.max(0,applied-p.returnForce):0;
  return {interfaces:n,travel,displacement:travel*stroke,area,applied,clamp,
    meanRadius:(p.frictionOD+p.frictionID)/4, torque:n*p.mu*clamp*(p.frictionOD+p.frictionID)/4000};
}
// Phase is integrated in the viewer so changing the coupling cannot jump an angle.
export function velocities(key,p,stroke,inputRPM,freeRPM){
  const coupled=key==='C' ? clutch(p,stroke).clamp>0 : key==='B' && stroke>=1;
  return {input:inputRPM*Math.PI/30,output:(coupled?inputRPM:freeRPM)*Math.PI/30};
}
export function pose(part,stroke,phase,explode){
  const z=part.z+part.slide*stroke+part.explode*explode;
  const theta=phase[part.drive]||0, a=theta+part.angle;
  return {x:Math.cos(theta)*part.x-Math.sin(theta)*part.y,y:Math.sin(theta)*part.x+Math.cos(theta)*part.y,z,a,
   scaleZ:1+(part.strain||0)*stroke,tilt:(part.tilt||0)*stroke};
}

