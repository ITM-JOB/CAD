import init from 'replicad-opencascadejs';
import wasm from 'replicad-opencascadejs/wasm?url';
import * as r from 'replicad';
import {model,inspectSolid,placed,metadata} from './model.mjs';
const ready=init({locateFile:()=>wasm}).then(r.setOC);
let current;
self.onmessage=async({data})=>{
 try{
  await ready;
  if(data.action==='build'){
    const c=model(data.key,data.p),geometries={},checks={};
    for(const [id,s] of c.solids){
      checks[id]=inspectSolid(s);
      geometries[id]=s.mesh({tolerance:.35,angularTolerance:.25});
    }
    current=c;
    self.postMessage({action:'built',meta:metadata(c,data.p,checks),geometries});
  }else if(data.action==='step'){
    const part=current.parts.find(p=>p.id===data.id);
    const file=part?current.solids.get(part.ref).blobSTEP():r.exportSTEP(current.parts.map(p=>({name:p.id,color:p.color,shape:placed(current,p)})),{unit:'MM'});
    self.postMessage({action:'file',file,name:(part?.id||current.key+'-assembly')+'.step'});
  }
 }catch(e){self.postMessage({action:'error',error:String(e?.message||e)});}
};

