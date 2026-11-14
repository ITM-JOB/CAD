// Normalized coordinates use the unrotated PDF CropBox, top-left origin.
export function forward([x,y],rotation=0){switch((rotation%360+360)%360){case 90:return [1-y,x];case 180:return [1-x,1-y];case 270:return [y,1-x];default:return [x,y];}}
export function inverse(point,rotation=0){return forward(point,360-rotation);}
export function toPdf([x,y],box){return [box[0]+x*(box[2]-box[0]),box[3]-y*(box[3]-box[1])];}
export function fromPdf([x,y],box){return [(x-box[0])/(box[2]-box[0]),(box[3]-y)/(box[3]-box[1])];}
