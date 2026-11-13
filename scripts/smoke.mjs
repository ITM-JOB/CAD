import {kernel} from './kernel.mjs';
import {ring} from '../src/geometry.mjs';
import {defaults} from '../src/mechanics.mjs';
import {model,inspectSolid} from '../src/model.mjs';
await kernel();
const test=ring(12,5,9);
console.log('Boolean annulus',inspectSolid(test), 'STEP bytes',test.blobSTEP().size);
for(const key of process.argv.slice(2)){
 const start=performance.now(),m=model(key,defaults(key));
 for(const [ref,s] of m.solids){try{inspectSolid(s);}catch(e){console.error('Invalid',ref);throw e;}}
 console.log(key,m.parts.length,'parts',m.solids.size,'definitions',Math.round(performance.now()-start),'ms');
}

