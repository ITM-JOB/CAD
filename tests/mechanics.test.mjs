import test from 'node:test';import assert from 'node:assert/strict';
import {kernel} from '../scripts/kernel.mjs';
import {model,inspectSolid} from '../src/model.mjs';
import {defaults,clutch,validate,velocities,pose} from '../src/mechanics.mjs';
await kernel();
test('Each reference has unique IDs, positive valid geometry and a single global length unit',()=>{
 for(const k of 'ABC'){const m=model(k,defaults(k));assert.equal(m.parts.length,new Set(m.parts.map(i=>i.id)).size);for(const s of m.solids.values())assert.ok(inspectSolid(s).valid);}
});
test('The pack closes simultaneously without reversed gaps',()=>{
 for(const discs of [1,2,4]){
  const p={...defaults('C'),discs},m=model('C',p), stack=m.parts.filter(i=>i.group==='Disc stack' || i.id==='piston');
  for(const stroke of [0,.25,.5,.99,1]){
   const intervals=stack.map(i=>{const z=pose(i,stroke,{},0).z,b=m.solids.get(i.ref).boundingBox.bounds;return [z+b[0][2],z+b[1][2]];});
   for(let j=1;j<intervals.length;j++)assert.ok(Math.abs(intervals[j][0]-intervals[j-1][1]-(1-stroke)*p.gap)<1e-5);
   assert.equal(clutch(p,stroke).interfaces,2*discs);
  }
 }
});
test('Clamping starts at closure and subtracts return force with mm to metre conversion',()=>{
 const p=defaults('C');assert.equal(clutch(p,.99).torque,0);const h=clutch(p,1);
 assert.ok(Math.abs(h.torque-4*.12*(.32*Math.PI*(120**2-84**2)-650)*.102)<1e-9);
 assert.equal(clutch({...p,pressure:0},1).torque,0);
});
test('Open and locked speeds, and unresolved transmission ratio',()=>{
 for(const k of 'BC'){
 const p=defaults(k);assert.notEqual(velocities(k,p,0,30,4).input,velocities(k,p,0,30,4).output);
 assert.equal(velocities(k,p,1,-30,4).input,velocities(k,p,1,-30,4).output);
 }
 assert.equal(velocities('A',defaults('A'),1,30,0).output,0);
});
test('Reject non-finite inputs and fractional plate counts',()=>{
 const p=defaults('C');for(const discs of [0,NaN,2.1,5])assert.throws(()=>validate('C',{...p,discs}));
});
test('B lever follows pressure-plate displacement around a fixed pivot',()=>{
 const p=defaults('B'),m=model('B',p),lever=m.parts.find(i=>i.id==='lever-1'),plate=m.parts.find(i=>i.id==='pressure');
 assert.ok(Math.abs(-14*Math.sin(lever.tilt)-plate.slide)<1e-9);
});

