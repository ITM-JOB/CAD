"""End-to-end tests through ordinary viewer controls, downloads and WebGL picking."""
from pathlib import Path
import argparse,json,time,math
from playwright.sync_api import sync_playwright
out=Path('outputs')
def run(base):
 results=[]
 with sync_playwright() as pw:
    browser=pw.chromium.launch(channel='chrome',headless=True,args=['--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1536,'height':1000},accept_downloads=True)
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(base,wait_until='domcontentloaded')
    def ready():
        page.wait_for_function("document.querySelector('#status').textContent.includes('Núcleo listo') || document.querySelector('#error').textContent.length>0",timeout=100000)
        assert not page.locator('#error').inner_text(),page.locator('#error').inner_text()
    def slider(id,v):
        page.locator('#'+id).evaluate("(el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}))}",str(v))
    def expand(summary):
        d=page.locator('details').filter(has=page.locator('summary',has_text=summary)).last
        d.evaluate("d=>d.open=true")
    def download(id,dest):
        with page.expect_download(timeout=90000) as got:page.locator('#'+id).click()
        got.value.save_as(dest)
    ready()
    for key in 'CBA':
        if key!='C':page.select_option('#assembly',key);ready()
        tab=out/key;tab.mkdir(exist_ok=True,parents=True)
        assert page.locator('.node').count()>20
        page.select_option('#view','Axial');page.click('#fit')
        page.select_option('#section','long');page.check('#transparent')
        slider('eng',1);page.wait_for_timeout(150)
        if key!='A':page.wait_for_function("document.querySelector('#state').textContent==='Acoplado'")
        page.locator('#stage').screenshot(path=tab/'axial.png')
        page.select_option('#section','none');page.uncheck('#transparent');page.select_option('#view','Isométrica')
        # A pick must change the property panel (ignore a miss in the empty bore).
        previous=page.locator('#part-name').inner_text()
        canvas=page.locator('canvas');bb=canvas.bounding_box()
        for fx,fy in [(.49,.43),(.45,.51),(.56,.47),(.59,.54),(.37,.5)]:
            canvas.click(position={'x':bb['width']*fx,'y':bb['height']*fy})
            if page.locator('#part-name').inner_text()!=previous:break
        assert page.locator('#part-name').inner_text()!=previous,'No successful viewport pick'
        page.click('#isolate');page.click('#hide');page.click('#show');page.check('#wire');page.uncheck('#wire')
        page.click('#play');page.wait_for_function("parseFloat(document.querySelector('#time').textContent)>0");page.click('#play')
        assert float(page.locator('#time').inner_text().split()[0])>0
        page.click('#reset');slider('timeline',3.5)
        page.wait_for_function("document.querySelector('#time').textContent.startsWith('3.5')")
        slider('explode',.65);page.check('#transparent');page.wait_for_timeout(200)
        page.screenshot(path=tab/'workstation.png');page.locator('#stage').screenshot(path=tab/'exploded.png')
        slider('explode',0);page.uncheck('#transparent');page.click('#reset')
        expand('Comparación');page.select_option('#refView','aligned');page.wait_for_timeout(100)
        assert page.locator('#overlay').evaluate("e=>e.style.backgroundImage.includes('.png')")
        page.locator('#stage').screenshot(path=tab/'comparison.png')
        page.select_option('#refView','end')
        assert page.locator('#overlay').evaluate("e=>e.style.backgroundImage.includes('.png')")
        page.locator('#stage').screenshot(path=tab/'comparison-end.png')
        page.select_option('#refView','off');page.select_option('#view','Isométrica')
        expand('Exportar')
        download('glb',tab/'assembly.glb');download('png',tab/'assembled.png')
        if key=='C':
            download('step',tab/'browser-assembly.step')
            page.locator('.node[data-id="disc-1"]').click()
            download('partstep',tab/'browser-disc.step')
            expand('Parámetros del ensamble')
            page.fill('#p-discs','0');page.click('#apply')
            assert 'discs' in page.locator('#error').inner_text()
            count=page.locator('.node').count()
            page.fill('#p-discs','3');page.click('#apply');ready()
            assert page.locator('.node').count()==count+2
            page.fill('#p-discs','2');page.click('#apply');ready()
        results.append({'assembly':key,'instances':page.locator('.node').count(),'viewportPick':True,'timeline':True,'GLB_bytes':(tab/'assembly.glb').stat().st_size})
        print(key,'browser OK',flush=True)
    assert not errors,errors
    (out/'browser-validation.json').write_text(json.dumps({'browser':browser.version,'cases':results,'pageErrors':errors},indent=2))
    browser.close()
if __name__=='__main__':
    a=argparse.ArgumentParser();a.add_argument('url',nargs='?',default='http://127.0.0.1:5178');run(a.parse_args().url)

