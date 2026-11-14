import {PDFDocument,PDFName,PDFString,PDFArray} from 'pdf-lib';
import {pointsOf,contains} from '../mapping/schema.mjs';
import {toPdf} from './coordinates.mjs';
export function safeLinkRects(g){
 if(g.type==='rect')return [[g.x,g.y,g.x+g.w,g.y+g.h]];
 // Conservative cells entirely inside a polygon; no bounding-box links over other parts.
 const p=pointsOf(g),xs=p.map(v=>v[0]),ys=p.map(v=>v[1]),x0=Math.min(...xs),y0=Math.min(...ys),w=Math.max(...xs)-x0,h=Math.max(...ys)-y0,result=[];
 for(let i=0;i<32;i++)for(let j=0;j<32;j++){const a=x0+w*i/32,b=y0+h*j/32,c=x0+w*(i+1)/32,d=y0+h*(j+1)/32;if([[a+1e-10,b+1e-10],[c-1e-10,b+1e-10],[c-1e-10,d-1e-10],[a+1e-10,d-1e-10],[(a+c)/2,(b+d)/2]].every(q=>contains(p,q)))result.push([a,b,c,d]);}return result;
}
export async function linkedPdf(bytes,mapping,base='https://itm-job.github.io/CAD/'){
 const doc=await PDFDocument.load(bytes),pages=doc.getPages();let count=0;
 for(const r of mapping.regions.filter(r=>r.evidence.status==='verified')){
  const page=pages[r.page-1];if(!page)throw Error('Página inexistente');const b=page.getCropBox(),box=[b.x,b.y,b.x+b.width,b.y+b.height];
  const url=new URL(base);url.search=new URLSearchParams({sheet:mapping.sheetId,study:r.studyId,part:r.instanceIds[0]}).toString();
  const annots=page.node.lookupMaybe(PDFName.of('Annots'),PDFArray)||doc.context.obj([]);
  for(const [x,y,u,v] of safeLinkRects(r.geometry)){const a=toPdf([x,v],box),b=toPdf([u,y],box);const link=doc.context.obj({Type:'Annot',Subtype:'Link',Rect:[...a,...b],Border:[0,0,0],A:{Type:'Action',S:'URI',URI:PDFString.of(url.href)}});annots.push(doc.context.register(link));count++;}
  page.node.set(PDFName.of('Annots'),annots);
 }
 if(!count)throw Error('No hay correspondencias verificadas para exportar');
 return {bytes:await doc.save(),count};
}
