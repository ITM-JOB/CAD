"""Check source dimensions against reimported STEP surfaces and independent GLB/DXF readers."""
import csv,json,math,struct,hashlib,subprocess
from pathlib import Path
import numpy as np
import trimesh, ezdxf
from OCP.TopAbs import TopAbs_FACE
from OCP.GeomAbs import GeomAbs_Cylinder
from OCP.BRepAdaptor import BRepAdaptor_Surface
from OCP.Bnd import Bnd_Box
from OCP.BRepBndLib import BRepBndLib
from drawings import read,shapes,TopoDS,TopAbs_SOLID,BRepCheck_Analyzer
from xml.etree import ElementTree as ET

def cylinders(shape):
    result=[]
    for face in shapes(shape,TopAbs_FACE):
        s=BRepAdaptor_Surface(TopoDS.Face(face))
        if s.GetType()!=GeomAbs_Cylinder:continue
        c=s.Cylinder();loc=c.Location();dr=c.Axis().Direction()
        if abs(dr.Z())>.999999:result.append((c.Radius(),loc.X(),loc.Y()))
    return result

def record(key,tol=.05):
    folder=Path('outputs')/key;source=Path('public/references')/(key+'.png')
    m=json.loads((folder/'assembly.json').read_text());parts=m['parts']
    solids={s.stem:read(s) for s in (folder/'parts').glob('*.step')}
    c={k:cylinders(s) for k,s in solids.items()}
    def diameter(part,target):
        rr=[r*2 for r,x,y in c[part] if math.hypot(x,y)<1e-5]
        return min(rr,key=lambda d:abs(d-target))
    table=[]
    def row(label,ref,value,unit='mm',note=''):
        diff=None if ref is None or value is None else abs(ref-value)
        table.append(dict(feature=label,reference=ref,cad=value,unit=unit,absoluteDifference=diff,
            relativeErrorPercent=100*diff/ref if diff is not None else None,
            status='UNKNOWN' if ref is None else 'UNASSIGNED' if value is None else 'PASS' if diff<=(0 if unit=='teeth' else tol) else 'FAIL',note=note))
    if key=='C':
        b=Bnd_Box();BRepBndLib.AddOptimal_s(solids['shaft'],b,False,False)
        row('Axial datum span',380,b.CornerMax().Z()-b.CornerMin().Z(),note='Truncated shaft ends at the union and sleeve datums')
        for part,name,d in [('shaft','Distributor journal',40),('union','Distributor race seat',70),('shaft','Main shaft journal',60),('sprocket','Bearing outer seat',110),('sprocket','Barrel diameter between tooth rows',140),('drum','Outside drum',310)]:
            row(name,d,diameter(part,d))
        seats={(round(x,6),round(y,6)) for r,x,y in c['sprocket'] if math.hypot(x,y)>10}
        seats=sorted(seats,key=lambda a:math.atan2(a[1],a[0]))
        row('Unique equally spaced roller-seat axes per row',30,len(seats),'teeth')
        row('Pitch chord between adjacent roller-seat axes',20,sum(math.dist(v,seats[i-1]) for i,v in enumerate(seats))/len(seats))
        row('Reduced view A, inner callout',160,None,note='Unresolved witness; retained independent of assumed friction ID')
        row('Reduced view A, intermediate callout',240,None,note='Unresolved witness; retained independent of assumed piston OD')
        for name,count in [('browser-assembly',len(parts)),('browser-disc',1)]:
            s=read(folder/(name+'.step'));assert len(list(shapes(s,TopAbs_SOLID)))==count and BRepCheck_Analyzer(s).IsValid()
    elif key=='B':
        row('Outer friction face',240,diameter('disc',240))
        row('Inner facing boundary',145,diameter('disc',145))
        row('Left-side mounting annotation',65,None,note='Witness assignment unresolved')
    else:row('Absolute scale',None,None,note='No legible source length. Ratios of pixel lengths do not validate absolute scale.')
    assert not any(r['status']=='FAIL' for r in table)
    with (folder/'dimensions.csv').open('w',newline='',encoding='utf-8') as f:
        wr=csv.DictWriter(f,fieldnames=table[0]);wr.writeheader();wr.writerows(table)
    (folder/'dimensions.json').write_text(json.dumps({'sourceSHA256':hashlib.sha256(source.read_bytes()).hexdigest(),'absoluteTolerance_mm':tol,'records':table},indent=2))
    glb=(folder/'assembly.glb').read_bytes();magic,version,size=struct.unpack('<4sII',glb[:12]);assert magic==b'glTF' and version==2 and size==len(glb)
    n,typ=struct.unpack('<II',glb[12:20]);doc=json.loads(glb[20:20+n])
    scene=trimesh.load(folder/'assembly.glb',force='scene')
    assert len(scene.graph.nodes_geometry)==len(parts) and np.all(scene.extents>0) and np.max(scene.extents)<1.0
    ids={n.get('extras',{}).get('partId') for n in doc['nodes'] if 'mesh' in n};assert ids=={i['id'] for i in parts}
    clips=doc['animations'];assert clips and clips[0]['channels']
    drawings={}
    for file in folder.glob('*.dxf'):
        dx=ezdxf.readfile(file);audit=dx.audit();assert not audit.errors
        ET.parse(file.with_suffix('.svg'));drawings[file.stem]=len(dx.modelspace())
    assert len(drawings)==5
    report={'STEP':'see step-validation.json','GLB':{'independentReader':'trimesh','geometryNodes':len(ids),'clips':len(clips),'animationChannels':len(clips[0]['channels']),'bounds_m':scene.extents.tolist()},'DXF_entities':drawings}
    (folder/'formats-validation.json').write_text(json.dumps(report,indent=2))
    print(key,len(ids),'GLB nodes;',sum(r['status']=='PASS' for r in table),'dimension matches;',len(drawings),'DXFs')
if __name__=='__main__':
    import argparse
    ap=argparse.ArgumentParser();ap.add_argument('--tolerance-mm',type=float,default=.05);a=ap.parse_args()
    if a.tolerance_mm<0:ap.error('Negative tolerance')
    for key in 'CBA':record(key,a.tolerance_mm)

