from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from threading import Thread
from playwright.sync_api import sync_playwright
import json
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
http=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory='dist'))
thread=Thread(target=http.serve_forever,daemon=True);thread.start()
try:
    url=f'http://127.0.0.1:{http.server_port}'
    with sync_playwright() as pw:
        b=pw.chromium.launch(channel='chrome',args=['--enable-unsafe-swiftshader','--use-angle=swiftshader']);page=b.new_page()
        page.goto(url);page.wait_for_function("document.querySelector('#status').textContent.includes('Núcleo listo')",timeout=90000)
        assert page.locator('.node').count()==len(json.loads(Path('outputs/C/assembly.json').read_text())['parts'])
        for k in 'ABC':
            page.goto(url+'/outputs/'+k+'/index.html');urls=page.locator('a').evaluate_all('(links)=>links.map(a=>a.href)')
            for u in urls:assert page.request.head(u).ok,u
        b.close()
    print('Built site: CAD worker loaded, hydraulic inventory matches STEP catalog, linked files reachable.')
finally:http.shutdown()

