"""Record the real WebGL viewport while the hydraulic operating cycle runs."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import subprocess,tempfile
with sync_playwright() as pw, tempfile.TemporaryDirectory() as tmp:
    browser=pw.chromium.launch(channel='chrome',headless=True,args=['--enable-unsafe-swiftshader','--use-angle=swiftshader'])
    page=browser.new_page(viewport={'width':1280,'height':800})
    page.goto('http://127.0.0.1:5178');page.wait_for_function("document.querySelector('#status').textContent.includes('Núcleo listo')",timeout=90000)
    page.check('#transparent');page.select_option('#section','long');page.click('#play')
    # Capture the canvas itself. Its alpha is composited over a light background.
    with page.expect_download(timeout=60000) as event:
        page.evaluate("""async()=>{const source=document.querySelector('#stage canvas'), dest=document.createElement('canvas');
        dest.width=960;dest.height=640;const ctx=dest.getContext('2d');const stream=dest.captureStream(20);
        const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(MediaRecorder.isTypeSupported);
        const rec=new MediaRecorder(stream,{mimeType:mime}),chunks=[];
        rec.ondataavailable=e=>chunks.push(e.data);rec.onstop=()=>{let a=document.createElement('a');a.href=URL.createObjectURL(new Blob(chunks,{type:mime}));a.download='motion.webm';a.click();};
        rec.start();const start=performance.now();await new Promise(resolve=>{function render(){
          const t=(performance.now()-start)/1000, e=Math.max(0,Math.min(1,(t-1)/2,(8-t)/2));
          document.querySelector('#eng').value=e;document.querySelector('#explode').value=.7*Math.max(0,1-t/2);
          ctx.fillStyle='#e6edeb';ctx.fillRect(0,0,960,640);let f=Math.min(960/source.width,580/source.height);
          ctx.drawImage(source,(960-source.width*f)/2,20,source.width*f,source.height*f);
          ctx.fillStyle='#203f49';ctx.font='23px Segoe UI';ctx.fillText('Hoja 281  /  '+document.querySelector('#state').textContent,26,608);
          if(t<9)requestAnimationFrame(render);else{rec.stop();resolve();}}render();});}""")
    f=Path(tmp)/'motion.webm';event.value.save_as(f);browser.close()
    subprocess.run(['ffmpeg','-loglevel','error','-y','-i',str(f),'-vf','fps=20,format=yuv420p','-c:v','libx264','-movflags','+faststart','outputs/C/operation.mp4'],check=True)

