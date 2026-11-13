"""Educational motion diagrams generated from the actual STEP section curves."""
from manim import *
from pathlib import Path
from xml.etree import ElementTree as ET
import json,math
ROOT=Path(__file__).resolve().parents[1]
class MechanismLesson(Scene):
    key='C'
    def construct(self):
        self.camera.background_color='#152a34'
        folder=ROOT/'outputs'/self.key
        meta=json.loads((folder/'assembly.json').read_text());parts=meta['parts'];p=meta['parameters']
        keys={q['id']:q for q in parts}
        root=ET.parse(folder/'longitudinal.svg').getroot()
        curves=[]
        for line in root.iter('{http://www.w3.org/2000/svg}polyline'):
            id=line.get('data-part')
            if id not in keys:continue
            pts=[tuple(map(float,v.split(','))) for v in line.get('points').split()]
            curves.append((id,[(x,-y) for x,y in pts]))
        pts=[v for _,path in curves for v in path];xmin,ymin=map(min,zip(*pts));xmax,ymax=map(max,zip(*pts))
        scale=min(7.2/(xmax-xmin),4.8/(ymax-ymin))
        def project(z,x):return np.array([-2.6+(z-(xmin+xmax)/2)*scale,.15+(x-(ymin+ymax)/2)*scale,0])
        groups={}
        for id,path in curves:
            v=VMobject(stroke_width=1.5,color=keys[id]['color'])
            v.set_points_as_corners([project(x,y) for x,y in path])
            groups.setdefault(id,VGroup()).add(v)
        title={'C':'Embrague hidráulico multidisco','B':'Embrague de automóvil','A':'Transmisión coaxial'}[self.key]
        def label(s,size=25):return Text(s,font='Segoe UI',font_size=size,color='#e1eeec')
        head=label(title,37).to_edge(UP);sub=label('Sección longitudinal obtenida del STEP',19).next_to(head,DOWN,buff=.13)
        self.add(head,sub,*groups.values())
        if self.key=='C':
            h=math.pi*(120**2-84**2)*p['pressure'];f=max(0,h-p['returnForce']);torque=2*p['discs']*p['mu']*f*(p['frictionOD']+p['frictionID'])/4000
            lines=['Presión en el pistón',f"p = {p['pressure']:.2f} MPa",f'F = pA = {h:,.0f} N',f'Apriete neto = {f:,.0f} N',f'T = n μ F Rm = {torque:.0f} N·m']
            states=['Presión liberada · discos separados','El pistón cierra las holguras','Contacto · capacidad ideal de par','Descarga · retorno del pistón']
        elif self.key=='B':
            lines=['Volante → dos caras de fricción','Disco → cubo estriado → eje','La palanca gira en su apoyo','El plato se desplaza axialmente']
            states=['Liberado · velocidades independientes','Las palancas permiten cerrar el plato','Acoplado · entrada y salida solidarias','Liberación del plato']
        else:
            lines=['Ejes principales coaxiales','Miembros con ejes desplazados','Portador común','Relación de velocidades desconocida']
            states=['Sección axial y apoyos','Eje central de entrada','Portador y salida coaxial','El dentado requiere evidencia adicional']
        info=VGroup(*[label(t,20) for t in lines]).arrange(DOWN,aligned_edge=LEFT,buff=.24).move_to([3.7,.2,0])
        self.play(FadeIn(info),run_time=.6)
        captions=[label(s,24).to_edge(DOWN,buff=.65) for s in states]
        self.add(captions[0]);self.wait(.6)
        # Preserve the exact displacement scale of the computed CAD assembly.
        motion=[]
        for id,g in groups.items():
            part=keys[id];g.save_state()
            if part['slide']:
                motion.append(g.animate.shift(RIGHT*part['slide']*scale))
        if self.key=='A':motion=[groups['input'].animate.set_color('#ffcb79')]
        self.play(ReplacementTransform(captions[0],captions[1]),*motion,run_time=1.6)
        highlights=[groups[k] for k in ({'C':['piston','disc-1','reaction'],'B':['flywheel','disc','pressure'],'A':['carrier','pin-0']}[self.key]) if k in groups]
        self.play(ReplacementTransform(captions[1],captions[2]),*[g.animate.set_color('#ffe5af') for g in highlights],run_time=.8);self.wait(1.3)
        self.play(ReplacementTransform(captions[2],captions[3]),*[Restore(g) for g in groups.values() if keys[next(k for k,v in groups.items() if v is g)]['slide'] or g in highlights],run_time=1.4)
        self.wait(.8)

class Hydraulic(MechanismLesson):key='C'
class Automotive(MechanismLesson):key='B'
class Transmission(MechanismLesson):key='A'

