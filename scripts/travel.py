"""Sample every pair at stroke 0.5 and 1. Springs use displayed axial scaling."""
import math,json,itertools
from pathlib import Path
from drawings import *
from OCP.gp import gp_GTrsf,gp_Mat,gp_XYZ
from OCP.BRepBuilderAPI import BRepBuilderAPI_GTransform
from OCP.Bnd import Bnd_Box
from OCP.BRepBndLib import BRepBndLib
def run(k):
    out=Path('outputs')/k
    parts=json.loads((out/'assembly.json').read_text())['parts'];local={f.stem:read(f) for f in (out/'parts').glob('*.step')}
    report={}
    for stroke in [.5,1]:
        world=[];hits=[]
        for p in parts:
            s=local[p['ref']]
            if p.get('strain'):
                z=1+p['strain']*stroke;t=gp_GTrsf(gp_Mat(1,0,0,0,1,0,0,0,z),gp_XYZ(0,0,0));s=BRepBuilderAPI_GTransform(s,t,True).Shape()
            if p.get('tilt'):
                t=gp_Trsf();t.SetRotation(gp_Ax1(gp_Pnt(),gp_Dir(0,1,0)),p['tilt']*stroke);s=BRepBuilderAPI_Transform(s,t,False).Shape()
            shape=positioned(s,{**p,'z':p['z']+stroke*p['slide']})
            box=Bnd_Box();BRepBndLib.AddOptimal_s(shape,box,False,False)
            world.append((p,shape,box))
        for (a,x,ba),(b,y,bb) in itertools.combinations(world,2):
            if ba.IsOut(bb):continue
            if not (a['slide'] or b['slide'] or a.get('tilt') or b.get('tilt')):continue
            v=volume(BRepAlgoAPI_Common(x,y).Shape())
            if abs(v)>.05:hits.append([a['id'],b['id'],round(v,3)])
        report[str(stroke)]=hits
        print(k,stroke,'moving-pair overlaps >0.05 mm3',hits,flush=True)
    (out/'travel-validation.json').write_text(json.dumps({'phase_rad':0,'strokeFractions':report,'threshold_mm3':.05},indent=2))
if __name__=='__main__':
    import sys
    for k in sys.argv[1:] or ['C','B']:run(k)

