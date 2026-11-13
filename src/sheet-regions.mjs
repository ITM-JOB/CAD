/** Normalized image rectangles, not manufacturing dimensions. */
export function validRect(r) {
 return r && ['x','y','w','h'].every(k=>Number.isFinite(r[k]))
  && r.x>=0 && r.y>=0 && r.w>0 && r.h>0
  && r.x+r.w<=1.00001 && r.y+r.h<=1.00001;
}
export function normalizeDrag(start, end) {
 const x=Math.max(0,Math.min(1,Math.min(start.x,end.x)));
 const y=Math.max(0,Math.min(1,Math.min(start.y,end.y)));
 return {x,y,w:Math.max(0,Math.min(1,Math.max(start.x,end.x))-x),h:Math.max(0,Math.min(1,Math.max(start.y,end.y))-y)};
}
export function checkedMapping(data) {
 if (!data || data.version!==1 || !data.sheet || typeof data.regions!=='object' || !data.regions || Array.isArray(data.regions))throw Error('Archivo de correspondencias inválido.');
 const regions={};
 for(const [key,r] of Object.entries(data.regions)){
  if(!/^[a-zA-Z0-9_\-.:]+$/.test(key) || !validRect(r))throw Error('Región inválida: '+key);
  regions[key]={x:r.x,y:r.y,w:r.w,h:r.h};
 }
 return {version:1,sheet:String(data.sheet),regions};
}
