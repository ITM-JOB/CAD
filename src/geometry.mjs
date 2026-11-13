import * as r from 'replicad';
export const cyl=(radius,height)=>r.makeCylinder(radius,height);
export const ring=(outer,inner,height)=>cyl(outer,height).cut(cyl(inner,height+2).translateZ(-1));
export const polar=(radius,a)=>[radius*Math.cos(a),radius*Math.sin(a)];
export function polygon(points,height){
  let path=r.draw(points[0]);
  for(const p of points.slice(1)) path=path.lineTo(p);
  return path.close().sketchOnPlane('XY').extrude(height);
}
// Straight-sided drive dogs with mating flank clearance, count is provisional.
export function dogs(root,tip,count,height,halfWidth=.13){
  const edges=[],point=(rad,a)=>[...polar(rad,a),0];
  for(let j=0;j<count;j++){
    const a=2*Math.PI*j/count, step=2*Math.PI/count;
    const h=halfWidth*step,b=1.3*h;
    const l=point(root,a-b),u=point(tip,a-h),v=point(tip,a+h),q=point(root,a+b);
    edges.push(r.makeLine(l,u),r.makeThreePointArc(u,point(tip,a),v),r.makeLine(v,q),
      r.makeThreePointArc(q,point(root,a+step/2),point(root,a+step-b)));
  }
  return r.basicFaceExtrusion(r.makeFace(r.assembleWire(edges)),new r.Vector([0,0,height]));
}
export function bolt(r0,length){return cyl(r0,length).fuse(polygon(Array.from({length:6},(_,i)=>polar(r0*1.8,i*Math.PI/3)),r0*1.3).translateZ(length));}
export function helix(radius,wire,height,turns){
  const spine=r.makeHelix(height/turns,height,radius);
  const profile=r.assembleWire([r.makeCircle(wire,[radius,0,0],[0,2*Math.PI*radius,height/turns])]);
  return r.genericSweep(profile,spine,{frenet:true});
}
export function bored(shape,rad,pcd,count,z,h,phase=0){
  for(let j=0;j<count;j++){const [x,y]=polar(pcd/2,phase+2*Math.PI*j/count);shape=shape.cut(cyl(rad,h).translate(x,y,z));}
  return shape;
}
// Roller centres lie on the true pitch polygon. Circular seats are joined to
// short tooth-tip lands. Seat diameter and flank transitions remain estimates.
export function sprocket(p,bore,width){
  const a=Math.PI/p.teeth,R=p.pitch/(2*Math.sin(a)),seat=.31*p.pitch,tip=R+.27*p.pitch;
  const edges=[],v=(x,y,ang)=>[x*Math.cos(ang)-y*Math.sin(ang),x*Math.sin(ang)+y*Math.cos(ang),0];
  for(let j=0;j<p.teeth;j++){
    const t=2*a*j,L=v(R,-seat,t),M=v(R-seat,0,t),H=v(R,seat,t);
    const s=v(tip,0,t+.8*a),e=v(tip,0,t+1.2*a),next=v(R,-seat,t+2*a);
    edges.push(r.makeThreePointArc(L,M,H),r.makeLine(H,s),r.makeThreePointArc(s,v(tip,0,t+a),e),r.makeLine(e,next));
  }
  const face=r.makeFace(r.assembleWire(edges));
  return r.basicFaceExtrusion(face,new r.Vector([0,0,width])).cut(cyl(bore,width));
}
export const palette={steel:'#7d94a2',light:'#c0cbd2',dark:'#465d6d',lining:'#bd7150',oil:'#469c98',gold:'#c7a160',case:'#71929b'};
export function catalog(key){
  const parts=[],solids=new Map();
  function add(id,name,group,role,ref,shapeFn,z,options={}){
    if(!solids.has(ref)) solids.set(ref,shapeFn());
    parts.push({id,name,group,role,ref,z,x:0,y:0,angle:0,drive:'fixed',slide:0,explode:z*.55,
      color:palette.steel,axis:[0,0,1],material:'UNKNOWN · display colour only',visible:true,...options});
  }
  return {key,parts,solids,add};
}
export function bearing(c,id,z,inner,outer,width,outerDrive='output',innerDrive='input'){
  const R=(outer+inner)/2, ball=(outer-inner)*.245,common=id.split('-')[0]+'-'+[inner,outer,width].join('_');
  // The three-dimensional rings and rolling elements are independently selectable.
  const groove=r.drawCircle(ball*1.03).translate(R,width/2).sketchOnPlane('XZ').revolve([0,0,1]);
  const subassembly='Rodamiento '+id;
  c.add(id+'-inner','Inner race','Bearings','Locates the shaft radially',common+'-ir',()=>ring(R-ball*.67,inner,width).cut(groove),z,{drive:innerDrive,subassembly,subPart:'inner'});
  c.add(id+'-outer','Outer race','Bearings','Locates the barrel radially',common+'-or',()=>ring(outer,R+ball*.67,width).cut(groove),z,{drive:outerDrive,subassembly,subPart:'outer'});
  c.add(id+'-cage','Bearing cage (schematic)','Bearings','Keeps rolling elements spaced; cage geometry is interpretative',common+'-cage',()=>{
    const t=Math.max(.55,Math.min(width*.08,ball*.22));
    const rim=()=>ring(R+ball*.34,R-ball*.34,t);
    let body=rim().fuse(rim().translateZ(width-t));
    for(let j=0;j<8;j++){
      const [x,y]=polar(R,(j+.5)*Math.PI/4);
      body=body.fuse(cyl(Math.max(.4,ball*.1),width-2*t).translate(x,y,t));
    }
    return body;
  },z,{drive:id+'-cage',subassembly,subPart:'cage',color:palette.steel});
  for(let j=0;j<8;j++){
    const [x,y]=polar(R,j*Math.PI/4);
    c.add(id+'-ball-'+(j+1),'Ball '+(j+1),'Bearings','Rolling element; self-spin unresolved',common+'-ball',()=>r.makeSphere(ball),z+width/2,{x,y,drive:id+'-cage',subassembly,subPart:'rolling',color:palette.light});
  }
}
