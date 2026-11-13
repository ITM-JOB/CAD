import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import init from 'replicad-opencascadejs';
import {setOC} from 'replicad';
const require=createRequire(import.meta.url);
export async function kernel(){
 const wasmBinary=await readFile(require.resolve('replicad-opencascadejs/wasm'));
 setOC(await init({wasmBinary}));
}

