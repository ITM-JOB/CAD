import {kernel} from './kernel.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {exportSTEP} from 'replicad';
import {defaults,definitions} from '../src/mechanics.mjs';
import {model,inspectSolid,metadata,placed} from '../src/model.mjs';
await kernel();
const key=process.argv[2]||'C',p=defaults(key),c=model(key,p),path='outputs/'+key;
await mkdir(path+'/parts',{recursive:true});
const checks={};
for(const [ref,s] of c.solids){
 checks[ref]=inspectSolid(s);
 await writeFile(path+'/parts/'+ref+'.step',new Uint8Array(await s.blobSTEP().arrayBuffer()));
}
const m=metadata(c,p,checks);m.parameterDefinitions=definitions[key];
await writeFile(path+'/assembly.json',JSON.stringify(m,null,2));
const blob=exportSTEP(c.parts.map(part=>({shape:placed(c,part),name:part.id,color:part.color})),{unit:'MM'});
await writeFile(path+'/assembly.step',new Uint8Array(await blob.arrayBuffer()));
console.log(key,c.parts.length,'instances',blob.size,'STEP bytes');

