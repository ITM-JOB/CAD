"""Production-browser acceptance. Run after vite build --base=/CAD/."""
import asyncio,json,os,pathlib,subprocess,hashlib
from playwright.async_api import async_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1];OUT=ROOT/'docs/m3/browser';OUT.mkdir(parents=True,exist_ok=True)
async def main():
 server=subprocess.Popen(['node','node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','5179'],cwd=ROOT,stdout=subprocess.DEVNULL)
 results=[];errors=[]
 try:
  async with async_playwright() as pw:
   b=await pw.chromium.launch(headless=True,args=['--enable-unsafe-swiftshader'])
   page=await b.new_page(viewport={'width':1600,'height':1000},device_scale_factor=1.5)
   page.on('pageerror',lambda e:errors.append(str(e)))
   async def ready(study,sheet,part):
    await page.goto(f'http://127.0.0.1:5179/CAD/?sheet={sheet}&study={study}&part={part}')
    await page.wait_for_function("document.querySelector('#status')?.textContent.includes('Núcleo listo')",timeout=90000)
    await page.locator('.pdf-region').first.wait_for(timeout=30000)
    assert await page.locator('#pdf-page').get_attribute('width')!='0'
    assert part in await page.locator('#properties').inner_text()
   await ready('C','281','shaft');await page.screenshot(path=str(OUT/'split-workspace.png'));results.append('deep-link C shaft / original PDF render')
   # PDF -> CAD exact ID, tree and inspector; screenshot includes real source.
   await page.locator('[data-region="281-C-piston-3"]').click()
   assert 'C::piston' in await page.locator('#properties').inner_text()
   await page.screenshot(path=str(OUT/'pdf-to-cad.png'));results.append('PDF piston -> CAD inspector')
   await page.locator('.node[data-id="shaft"]').click()
   assert await page.locator('.pdf-region.active').count()==2
   await page.screenshot(path=str(OUT/'cad-to-pdf.png'));results.append('Tree/CAD shaft -> two PDF regions')
   await page.get_by_role('button',name='Aislar',exact=True).click()
   bb=await page.locator('#stage').bounding_box();await page.mouse.click(bb['x']+bb['width']/2+10,bb['y']+bb['height']/2)
   assert await page.locator('#properties').get_attribute('data-selection-origin')=='cad'
   await page.get_by_role('button',name='Mostrar todo',exact=True).click();results.append('Real Three.js mesh raycast -> PDF associations')
   for zoom in ['150','250','75']:
    await page.get_by_label('Zoom PDF',exact=True).fill(zoom);await page.get_by_label('Zoom PDF',exact=True).press('Tab')
    await page.locator('[data-region="281-C-piston-3"]').click()
    assert 'C::piston' in await page.locator('#properties').inner_text()
   await page.get_by_role('button',name='Girar 90°',exact=True).click()
   await page.locator('[data-region="281-C-shaft-0"]').click();assert 'C::shaft' in await page.locator('#properties').inner_text();results.append('Zoom/rotation alignment')
   await page.get_by_role('button',name='Explosionar',exact=True).click();assert await page.locator('.pdf-region.active').count()==2
   await page.get_by_role('button',name='Aislar',exact=True).click();await page.get_by_role('button',name='Mostrar todo',exact=True).click();results.append('Explosion / isolate regression')
   async with page.expect_download() as dl:await page.get_by_role('button',name='Descargar PDF interactivo',exact=True).click()
   download=await dl.value;await download.save_as(str(OUT/'281-interactive.pdf'));results.append('Real linked PDF download')
   import fitz
   pdf=fitz.open(str(OUT/'281-interactive.pdf'));uri=pdf[0].get_links()[0]['uri']
   await page.goto(uri.replace('https://itm-job.github.io/CAD/','http://127.0.0.1:5179/CAD/'))
   await page.wait_for_function("document.querySelector('#status')?.textContent.includes('Núcleo listo')",timeout=90000)
   await page.locator('.pdf-region.active').first.wait_for();assert 'C::shaft' in await page.locator('#properties').inner_text();results.append('Downloaded PDF URI -> exact CAD part')
   await page.get_by_role('button',name='Página',exact=True).click()
   # Editor is opt-in, drafts do not replace shared mappings until explicitly loaded.
   assert not await page.locator('#map-edit-tools').is_visible()
   await page.get_by_role('button',name='Editor de correspondencias',exact=True).click()
   await page.get_by_role('button',name='Rectángulo',exact=True).click()
   box=await page.locator('#plane-regions').bounding_box();x=box['x']+box['width']*.25;y=box['y']+box['height']*.30
   await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+25,y+25);await page.mouse.up()
   before=await page.locator('.pdf-region').count();assert before==7
   await page.get_by_role('button',name='Deshacer',exact=True).click();assert await page.locator('.pdf-region').count()==6
   await page.get_by_role('button',name='Rehacer',exact=True).click();assert await page.locator('.pdf-region').count()==7
   results.append('Editor creation / undo / redo')
   await ready('B','280','shaft');await page.locator('[data-region="280-B-pressure-1"]').click();assert 'B::pressure' in await page.locator('#properties').inner_text();results.append('280 B bidirectional mapping')
   await ready('281-2','281','piston');await page.locator('[data-region="281-281-2-cylinder-6"]').click();assert '281-2::cylinder' in await page.locator('#properties').inner_text();results.append('281 figure 2 mapping')
   # Verify all studies can change PDF without stale document/worker errors.
   studies={'60':'60','89':'89','154':'154','157':'157','161':'161','164':'164','199':'199','209-1':'209','209-2':'209','210-1':'210','210-2':'210','210-3':'210','212-1':'212','212-2':'212','214-1':'214','214-2':'214','263':'263','296-1':'296','296-2':'296'}
   for study,sheet in studies.items():
    await page.locator('#assembly').select_option(study)
    await page.wait_for_function("s=>document.querySelector('#status')?.textContent.includes('Núcleo listo')&&document.querySelector('#assembly').value===s",arg=study,timeout=90000)
    await page.wait_for_function("s=>document.querySelector('#drawing-pdf')?.href.endsWith('/'+s+'.pdf')",arg=sheet)
    await page.wait_for_timeout(600)
    assert 'PDF' not in (await page.locator('#error').inner_text())
   results.append('All 22 studies: CAD regeneration and PDF switching')
   await ready('C','281','shaft')
   for button,name in [('partstep','shaft.step'),('glb','assembly.glb')]:
    await page.locator('#'+button).evaluate('(el)=>el.closest("details").open=true')
    async with page.expect_download(timeout=90000) as dl:await page.locator('#'+button).click()
    await (await dl.value).save_as(str(OUT/name))
    content=(OUT/name).read_bytes();assert content.startswith(b'ISO-10303-21') if name.endswith('.step') else content[:4]==b'glTF'
   results.append('STEP and GLB downloads')
   await page.set_viewport_size({'width':390,'height':844});await page.get_by_role('button',name='Página',exact=True).click();await page.screenshot(path=str(OUT/'mobile.png'));results.append('Mobile layout render')
   assert not errors,errors
   await b.close()
 finally:
  server.terminate();(OUT/'results.json').write_text(json.dumps({'passed':results,'pageErrors':errors},indent=2))
 print(json.dumps(results,indent=2))
asyncio.run(main())
