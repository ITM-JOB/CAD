"""Build a local, human-readable index alongside each release and its evidence."""
from pathlib import Path
import json, html, hashlib
from zipfile import ZipFile,ZIP_DEFLATED
refs=json.loads(Path('scripts/reference-data.json').read_text(encoding='utf8'))
def esc(s):return html.escape(str(s))
style='body{font:16px/1.5 system-ui,sans-serif;color:#243a42;background:#f6f8f5;margin:32px auto;padding:0 20px;max-width:1100px}h1,h2{line-height:1.18}h2{margin-top:32px}a{color:#16685f}td,th{border-bottom:1px solid #cdd7d5;text-align:left;padding:6px}table{border-collapse:collapse;font-size:14px}.figs{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}figure{margin:0}img{width:100%;max-height:420px;object-fit:contain}code{overflow-wrap:anywhere}'
for k,data in refs.items():
    out=Path('outputs')/k;meta=json.loads((out/'assembly.json').read_text());dims=json.loads((out/'dimensions.json').read_text());qa=json.loads((out/'formats-validation.json').read_text());step=json.loads((out/'step-validation.json').read_text())
    members=meta['parts'];title=data['drawing']
    rep={'reference':data,'parameters':meta['parameterDefinitions'],'sourceSHA256':dims['sourceSHA256'],'referenceDimensions':dims['records'],'components':members}
    (out/'interpretation.json').write_text(json.dumps(rep,ensure_ascii=False,indent=2),encoding='utf8')
    with ZipFile(out/'parts.zip','w',ZIP_DEFLATED) as z:
        for p in sorted((out/'parts').glob('*.step')):z.write(p,p.name)
    def link(f,label):return f'<a href="{f}">{esc(label)}</a>'
    s=[f'<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>{esc(title)}</title><style>{style}</style><body><h1>{esc(title)}</h1>']
    s+=['<p>'+ ' · '.join(link(f,l) for f,l in [('assembly.step','STEP de ensamble'),('parts.zip','STEP de piezas'),('assembly.glb','GLB animado'),('assembly.json','Jerarquía y juntas'),('lesson.mp4','Lección MP4')]+([('operation.mp4','Operación 3D MP4')] if k=='C' else []))+'</p>']
    s+=['<h2>Interpretación</h2><p>'+esc(data['evidence'])+'</p><dl>']
    for n,t in data['views'].items():s+=[f'<dt><b>{esc(n)}</b></dt><dd>{esc(t)}</dd>']
    s+=['</dl><h2>Comparación con la lámina</h2><div class="figs">']
    for f,caption in [('comparison.png','Superposición axial calibrada'),('workstation.png','Editor local con selección y explosión')]:
        s+=['<figure>'+link(f,'<image>').replace('&lt;image&gt;',f'<img src="{f}" alt="{caption}">')+'<figcaption>'+caption+'</figcaption></figure>']
    s+=['</div><p>'+link('dimensions.csv','Tabla descargable CSV')+' · '+link('interpretation.json','Inventario completo y procedencia')+'</p><table><tr><th>Referencia</th><th>Cota</th><th>CAD</th><th>|Δ|</th><th>Error %</th><th>Estado</th></tr>']
    for d in dims['records']:
        fmt=lambda x:'—' if x is None else f'{x:.5g}'
        s+=['<tr>'+''.join(f'<td>{esc(value)}</td>' for value in [d['feature'],fmt(d['reference']),fmt(d['cad']),fmt(d['absoluteDifference']),fmt(d['relativeErrorPercent']),d['status']])+'</tr>']
    s+=['</table><h2>Vistas calculadas</h2><table>']
    for view,label in [('longitudinal','Sección longitudinal'),('transverse','Sección transversal'),('side','Proyección lateral'),('end','Proyección de extremo'),('detail','Detalle individual')]:
        s+=['<tr><td>'+label+'</td><td>'+link(view+'.svg','Abrir SVG')+'</td><td>'+link(view+'.dxf','Descargar DXF')+'</td></tr>']
    s+=['</table><h2>Validación</h2><p>'+str(step['assemblySolids'])+' sólidos reimportados · '+str(qa['GLB']['geometryNodes'])+' nodos de geometría en GLB · '+str(len(step['intersections']))+' interferencias por encima de 0,05 mm³ en posición inicial.</p><p>'+link('step-validation.json','Volúmenes y topología')+' · '+link('formats-validation.json','Lectura GLB y DXF')+(' · '+link('travel-validation.json','Muestreo de carrera') if k!='A' else '')+'</p><h2>Datos pendientes</h2><ul>']
    s+=['<li>'+esc(t)+'</li>' for t in data['omissions']]
    s+=['</ul></body></html>']
    (out/'index.html').write_text('\n'.join(s),encoding='utf8')

