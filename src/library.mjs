export const sheets = {
 '60':['Gato elevador','Uniones roscadas',['60']],
 '89':['Variador de cadena','Transmisiones por fricción',['89']],
 '154':['Caja de velocidades de automóvil','Cajas de velocidades',['154']],
 '157':['Caja de torno universal 1Е610','Cajas de velocidades',['157']],
 '161':['Caja de taladradora 2А135','Cajas de velocidades',['161']],
 '164':['Caja de fresadora 6Н82','Cajas de velocidades',['164']],
 '199':['Reductor de cadena','Transmisiones por cadena',['199']],
 '209':['Árboles de máquinas eléctricas','Árboles y ejes',['209-1','209-2']],
 '210':['Árboles de máquinas-herramientas','Árboles y ejes',['210-1','210-2','210-3']],
 '212':['Árbol y eje de transportador','Árboles y ejes',['212-1','212-2']],
 '214':['Ejes de máquinas de transporte','Árboles y ejes',['214-1','214-2']],
 '263':['Acoplamiento articulado pesado','Acoplamientos',['263']],
 '280':['Embrague de automóvil','Acoplamientos',['B']],
 '281':['Embragues hidráulicos de discos','Acoplamientos',['C','281-2']],
 '296':['Embragues centrífugos','Acoplamientos',['296-1','296-2']]
};
export const variants={
 '209-1':'Árbol de motor eléctrico','209-2':'Árbol vertical de rectificadora',
 '210-1':'Husillo de torno para roscar','210-2':'Husillo de fresadora vertical','210-3':'Husillo de taladradora vertical',
 '212-1':'Árbol motriz del transportador','212-2':'Eje de retorno del transportador',
 '214-1':'Eje de locomotora diésel','214-2':'Eje de vagón','281-2':'Embrague hidráulico · figura 2',
 '296-1':'Embrague centrífugo de zapatas','296-2':'Embrague centrífugo elástico',
 A:'Transmisión coaxial',B:'Embrague de automóvil',C:'Embrague hidráulico multidisco'
};
export const sheetFor=key=>key==='B'?'280':key==='C'?'281':key==='A'?null:key.split('-')[0];
export const nameFor=key=>variants[key]||sheets[sheetFor(key)]?.[0]||key;
export const isStudy=key=>!['A','B','C'].includes(key);
export const studyKeys=Object.values(sheets).flatMap(s=>s[2]).filter(isStudy);

