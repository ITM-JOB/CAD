import {cp,access} from 'node:fs/promises';
for(const key of 'ABC'){
 try{await access('outputs/'+key+'/index.html');}catch{console.log('Optional legacy outputs unavailable:',key);continue;}
 await cp('outputs/'+key,'dist/outputs/'+key,{recursive:true,filter:p=>!p.includes('browser-')&&!p.endsWith('/parts')&&!p.endsWith('\\parts')});
}

