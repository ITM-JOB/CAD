"""Walk the live library, exercise isolated and global offsets, verify all exported SVG/CSV instances."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from xml.etree import ElementTree as ET
from zipfile import ZipFile
import csv,io,json,math,sys
out=Path('outputs/despieces');out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='chrome',headless=True,args=['--enable-unsafe-swiftshader','--use-angle=swiftshader'])
 page=b.new_page(viewport={'width':1500,'height':950},accept_downloads=True)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:5178',wait_until='domcontentloaded')
 def ready():page.wait_for_function("document.querySelector('#status').textContent.includes('Núcleo listo') || document.querySelector('#error').textContent.length",timeout=120000)
 ready();page.click('#library-open');assert page.locator('.sheet-grid article').count()==15
 page.screenshot(path=out/'biblioteca.png')
 for link in page.locator('.card-links a').all():assert page.request.head(link.evaluate('a=>a.href')).status==200
 page.click('#library-close')
 keys=page.locator('#assembly option').evaluate_all('opts=>opts.map(o=>o.value)')
 report_path=out/'validacion.json'
 if sys.argv[1:]:keys=sys.argv[1:]
 result=json.loads(report_path.read_text()) if sys.argv[1:] and report_path.exists() else {}
 for k in keys:
  page.select_option('#assembly',k);ready();err=page.locator('#error').inner_text();assert not err,(k,err)
  assert page.locator('#assembly').input_value()==k,k
  nodes=page.locator('.node');n=nodes.count();assert n>=10
  node=nodes.nth(min(n-1,5));id=node.get_attribute('data-id')
  page.fill('#part-search',id);page.locator('.node[data-id="'+id+'"]').click()
  page.click('#isolate');page.select_option('#shift-axis','X')
  page.locator('#shift').evaluate("s=>{s.value=27;s.dispatchEvent(new Event('input'))}")
  assert page.locator('#shift-value').inner_text()=='27 mm'
  page.click('#shift-reset');page.click('#show');page.fill('#part-search','')
  page.click('#exploded-toggle');assert page.locator('#exploded-toggle').get_attribute('aria-pressed')=='true'
  with page.expect_download(timeout=120000) as d:page.click('#book')
  file=out/(k+'-despiece.zip');d.value.save_as(file)
  with ZipFile(file) as z:
   files=z.namelist();rows=list(csv.reader(io.StringIO(z.read('lista-de-piezas.csv').decode('utf-8-sig')),delimiter=';'))[1:]
   assert len(rows)==n and len({r[1] for r in rows})==n
   drawings=[f for f in files if f.endswith('.svg')]
   assert len(drawings)==1+math.ceil(n/15)
   for f in drawings:
    doc=ET.fromstring(z.read(f))
    if f.startswith('piezas'):assert all(p.get('d') for p in doc.iter('{http://www.w3.org/2000/svg}path'))
   if k=='C':(out/'281-fig1-explosionado.svg').write_bytes(z.read('00-conjunto.svg'))
  result[k]={'parts':n,'svg':len(drawings),'bytes':file.stat().st_size}
  if k in ['60','157','199','263','C']:page.screenshot(path=out/(k+'-explosion.png'))
  print(k,n,len(drawings),flush=True)
 assert not errors,errors
 (out/'validacion.json').write_text(json.dumps(result,indent=2))
 b.close()

