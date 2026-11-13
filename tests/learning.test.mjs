import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyPart,subgroupFor,bearingPartKind} from '../src/learning.mjs';
import {normalizeDrag,validRect,checkedMapping} from '../src/sheet-regions.mjs';
test('Move classification uses the bastidor reference, not a fixed-to-shaft relation',()=>{
 assert.equal(classifyPart({group:'Output',name:'Drive shaft',drive:'output'},'C').category,'moving');
 assert.equal(classifyPart({group:'Stationary',name:'Bell housing',drive:'fixed'},'C').category,'fixed');
 assert.equal(classifyPart({group:'Rodamiento eje-0',name:'Aro interior',drive:'fixed'},'154').category,'moving');
 assert.equal(classifyPart({group:'Rodamiento eje-0',name:'Aro exterior',drive:'fixed'},'154').category,'fixed');
 assert.equal(classifyPart({group:'Tornillería',name:'Tornillo 1',drive:'fixed'},'154').confidence,'por verificar');
});
test('Bearing subcomponents retain common assembly identity',()=>{
 assert.equal(subgroupFor({subassembly:'Rodamiento B'}),'Rodamiento B');
 assert.equal(bearingPartKind({id:'main-L-ball-1'}),'rolling');
 assert.equal(bearingPartKind({id:'apoyo-0-cage'}),'cage');
});
test('PDF mapping normalizes and validates a selected image rectangle',()=>{
 const r=normalizeDrag({x:.73,y:.81},{x:.12,y:.2});
 assert.deepEqual(r,{x:.12,y:.2,w:.61,h:.6100000000000001});
 assert.equal(validRect(r),true);
 assert.deepEqual(checkedMapping({version:1,sheet:'281',regions:{'C::shaft':r,'281-2::piston':r}}).sheet,'281');
 assert.equal(validRect({x:.7,y:.7,w:.4,h:.4}),false);
 assert.deepEqual(checkedMapping({version:1,sheet:'281',regions:{shaft:r}}).sheet,'281');
 assert.throws(()=>checkedMapping({version:1,sheet:'281',regions:{shaft:{x:0,y:0,w:0,h:1}}}));
});
