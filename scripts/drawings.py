"""Read STEP using native OCCT. Curves are sectioned/intersected before vector sampling."""
import argparse, json, math, itertools
from pathlib import Path
from xml.etree import ElementTree as ET
import ezdxf
from OCP.STEPControl import STEPControl_Reader
from OCP.IFSelect import IFSelect_RetDone
from OCP.BRep import BRep_Tool
from OCP.BRepCheck import BRepCheck_Analyzer
from OCP.BRepGProp import BRepGProp
from OCP.GProp import GProp_GProps
from OCP.BRepAlgoAPI import BRepAlgoAPI_Section, BRepAlgoAPI_Common
from OCP.BRepAdaptor import BRepAdaptor_Curve
from OCP.BRepBuilderAPI import BRepBuilderAPI_Transform
from OCP.BRepMesh import BRepMesh_IncrementalMesh
from OCP.GCPnts import GCPnts_QuasiUniformDeflection
from OCP.HLRBRep import HLRBRep_Algo, HLRBRep_HLRToShape
from OCP.HLRAlgo import HLRAlgo_Projector
from OCP.gp import gp_Ax2,gp_Ax1,gp_Dir,gp_Pnt,gp_Pln,gp_Trsf,gp_Vec
from OCP.TopExp import TopExp_Explorer
from OCP.TopAbs import TopAbs_EDGE,TopAbs_SOLID
from OCP.TopoDS import TopoDS

def read(path):
    reader=STEPControl_Reader()
    assert reader.ReadFile(str(path))==IFSelect_RetDone,path
    reader.TransferRoots()
    return reader.OneShape()

def shapes(s,kind):
    if s is None or s.IsNull(): return
    it=TopExp_Explorer(s,kind)
    while it.More():
        yield it.Current()
        it.Next()

def volume(s):
    props=GProp_GProps()
    BRepGProp.VolumeProperties_s(s,props)
    return props.Mass()

def positioned(s,p):
    t=gp_Trsf()
    t.SetRotation(gp_Ax1(gp_Pnt(),gp_Dir(0,0,1)),p['angle'])
    t.SetTranslationPart(gp_Vec(p['x'],p['y'],p['z']))
    return BRepBuilderAPI_Transform(s,t,False).Shape()

def lines(shape,project):
    for raw in shapes(shape,TopAbs_EDGE):
        edge=TopoDS.Edge(raw)
        if BRep_Tool.Degenerated_s(edge): continue
        curve=BRepAdaptor_Curve(edge)
        sample=GCPnts_QuasiUniformDeflection(curve,0.12)
        if sample.IsDone() and sample.NbPoints()>1:
            yield [project(sample.Value(i)) for i in range(1,sample.NbPoints()+1)]

def draw(out,key,name,layers,dimensions=()):
    pts=[xy for _,_,path in layers for xy in path]
    x0,y0=map(min,zip(*pts));x1,y1=map(max,zip(*pts))
    dwg=ezdxf.new('R2010');dwg.units=4; model=dwg.modelspace()
    colors={'visible':'#213647','hidden':'#9ba8b0','section':'#203848','axis':'#af6950','dimension':'#326969'}
    for k in colors: dwg.layers.new(k)
    dwg.linetypes.new('BROKEN',dxfattribs={'pattern':[4.5,3,-1.5]})
    for layer in ('axis','hidden'):dwg.layers.get(layer).dxf.linetype='BROKEN'
    margin=19
    root=ET.Element('svg',xmlns='http://www.w3.org/2000/svg',viewBox=f'{x0-margin} {-y1-margin} {x1-x0+2*margin} {y1-y0+2*margin+8}')
    ET.SubElement(root,'rect',x=str(x0-margin),y=str(-y1-margin),width='100%',height='100%',fill='white')
    def label(x,y,text):
        ET.SubElement(root,'text',x=str(x),y=str(-y),fill='#22414b',attrib={'font-size':'4','font-family':'sans-serif'}).text=text
        model.add_text(text,dxfattribs={'height':3,'insert':(x,y),'layer':'dimension'})
    layers+= [('axis','axis',[(x0-3,0),(x1+3,0)])]
    if name.startswith('end') or name.startswith('transverse'): layers.append(('axis','axis',[(0,y0-3),(0,y1+3)]))
    for v,x,y,dx,dy in dimensions:
        layers.append(('dimension','measurement',[(x,y),(x+dx,y+dy)]))
        for xx,yy in [(x,y),(x+dx,y+dy)]:layers.append(('dimension','witness',[(xx-1.4,yy-1.4),(xx+1.4,yy+1.4)]))
        label(x+dx*.5+2,y+dy*.5+2,v)
    for layer,id,path in layers:
        attr={'points':' '.join(f'{x:.4f},{-y:.4f}' for x,y in path),'fill':'none','stroke':colors[layer],'stroke-width':'.35','data-part':id}
        if layer in ('hidden','axis'):attr['stroke-dasharray']='3 1.5'
        ET.SubElement(root,'polyline',attr)
        model.add_lwpolyline(path,dxfattribs={'layer':layer})
    label(x0,y0-11,f'{key} / {name} / mm')
    ET.ElementTree(root).write(out/(name+'.svg'),encoding='utf-8',xml_declaration=True)
    dwg.saveas(out/(name+'.dxf'))

def run(key,interference):
    out=Path('outputs')/key
    meta=json.loads((out/'assembly.json').read_text());parts=meta['parts'];p=meta['parameters']
    assembly=read(out/'assembly.step');individual={f.stem:read(f) for f in (out/'parts').glob('*.step')}
    placed={i['id']:positioned(individual[i['ref']],i) for i in parts}
    report={'reader':'native OCCT (OCP), STEP round trip','parts':{},'intersections':[]}
    for ref,s in individual.items():
        solid=list(shapes(s,TopAbs_SOLID))
        report['parts'][ref]={'valid':BRepCheck_Analyzer(s).IsValid(),'solids':len(solid),'volume_mm3':volume(s)}
        assert len(solid)==1 and volume(s)>0 and report['parts'][ref]['valid'],(key,ref,report['parts'][ref])
    report['assemblySolids']=len(list(shapes(assembly,TopAbs_SOLID)))
    assert report['assemblySolids']==len(parts)
    if interference:
        for a,b in itertools.combinations(parts,2):
            # Test only pairs whose transformed bounds overlap in all three directions.
            def bbox(i):
                lo,hi=i['cad']['bounds'];angle=i['angle'];ca,sa=math.cos(angle),math.sin(angle)
                corners=[(ca*x-sa*y+i['x'],sa*x+ca*y+i['y'],z+i['z']) for x,y,z in itertools.product(*zip(lo,hi))]
                return list(map(min,zip(*corners))),list(map(max,zip(*corners)))
            aa,bb=bbox(a),bbox(b)
            if min(min(aa[1][d],bb[1][d])-max(aa[0][d],bb[0][d]) for d in range(3))<1e-5:continue
            common=BRepAlgoAPI_Common(placed[a['id']],placed[b['id']])
            v=volume(common.Shape())
            if abs(v)>.05:report['intersections'].append([a['id'],b['id'],round(v,3)])
    (out/'step-validation.json').write_text(json.dumps(report,indent=2))
    print(key,'round trip',report['assemblySolids'],'intersections',report['intersections'],flush=True)
    dx=lambda v:(v.Z(),v.X())
    end=lambda v:(v.X(),v.Y())
    planeZ=next(i['z'] for i in parts if i['id']=={'A':'wheel-0','B':'disc','C':'disc-1'}[key])+1
    for name,normal,origin,project in [('longitudinal',(0,1,0),(0,0,0),dx),('transverse',(0,0,1),(0,0,planeZ),end)]:
        layers=[]
        for id,s in placed.items():
            op=BRepAlgoAPI_Section(s,gp_Pln(gp_Pnt(*origin),gp_Dir(*normal)),False);op.Build()
            layers.extend(('section',id,line) for line in lines(op.Shape(),project))
        dims=[(f"{p['length']:g} mm",0,-p['housingOD']/2-4,p['length'],0)] if key=='C' and name=='longitudinal' else []
        draw(out,key,name,layers,dims)
    for name,s,direction,xdir in [('side',assembly,(0,1,0),(0,0,1)),('end',assembly,(0,0,1),(1,0,0)),('detail',individual[{'A':'rim','B':'disc','C':'sprocket'}[key]],(0,0,1),(1,0,0))]:
        hlr=HLRBRep_Algo();hlr.Add(s);hlr.Projector(HLRAlgo_Projector(gp_Ax2(gp_Pnt(),gp_Dir(*direction),gp_Dir(*xdir))));hlr.Update();hlr.Hide()
        edges=HLRBRep_HLRToShape(hlr); layers=[]
        for typ,getter in [('hidden',edges.HCompound),('visible',edges.VCompound)]:
            layers.extend((typ,name,line) for line in lines(getter(),end))
        draw(out,key,name,layers)
    print(key,'five vector views',flush=True)

if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('key',choices='ABC');ap.add_argument('--interference',action='store_true')
    args=ap.parse_args();run(args.key,args.interference)

