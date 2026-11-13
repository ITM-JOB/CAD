# Estación de reconstrucción mecánica

El editor integra 15 láminas PDF con 22 estudios y conserva la transmisión A anterior. La [guía de despieces](DESPIECES.md) detalla cómo aislar piezas, preparar planos y consultar las simplificaciones por hoja. El caso prioritario es el embrague hidráulico de la hoja 281. Su definición paramétrica en JavaScript genera sólidos OpenCascade en un trabajador web. Three.js utiliza las mallas de esos mismos sólidos para selección, inspección y animación. La reconstrucción es educativa. La identificación de variantes, los ajustes dimensionales y la dinámica transitoria requieren información adicional para ingeniería de fabricación.

## Abrir

Con Node 22 y las dependencias instaladas en esta carpeta:

```powershell
npm run dev -- --port 5178
```

Abra http://127.0.0.1:5178. Para una instalación nueva, ejecute primero `npm ci`. Después de instalar, la aplicación y las referencias funcionan sin servicios externos. `npm run build` genera un sitio estático en `dist` con los paquetes precalculados. Para probar ese sitio, ejecute `npm exec vite -- preview --host 127.0.0.1 --port 4178`.

## Primer recorrido

1. Abra C. Seleccione **Disco de fricción revestido 1** en el árbol o pulse sobre una superficie del modelo. El inspector muestra su envolvente, volumen, grupo, función y junta.
2. Seleccione **Axial**, active **Longitudinal** y marque **Carcasa translúcida**. Mueva **Acoplamiento**. El pistón recorre 2,4 mm con la configuración inicial. Los discos y el separador consumen las cuatro holguras hasta contactar la placa de reacción.
3. En **Velocidades y sentido**, fije las rpm de salida libre. Al cerrar el paquete, la salida adopta la velocidad de entrada si existe apriete. Las fases se integran en el tiempo. El salto de velocidad al imponer el bloqueo es una idealización cinemática. La barra de tiempo reposiciona el modelo usando los ajustes actuales.
4. Para cotejar la fuente, abra **Comparación con la lámina** y seleccione la sección axial alineada o la vista de extremo. Ajuste la opacidad. Gire el modelo en vista isométrica para volver a la inspección libre.
5. Cambie **Discos revestidos** a 3, regenere y revise el separador adicional. El STEP y el GLB de la interfaz usan la geometría regenerada. El STEP se guarda en posición de referencia, el GLB contiene un ciclo prescrito de ocho segundos y el PNG captura el estado del visor. Los SVG, DXF, informes y vídeos enlazados en cada ficha corresponden a los parámetros de fábrica. Para otras cotas, modifique la definición fuente y vuelva a ejecutar la generación por lotes.

## Entregables

| Carpeta | Contenido |
|---|---|
| `public/references` | Los tres PNG originales. Cada informe dimensional registra su SHA-256. |
| `src/parameters.json` | Parámetros editables, valor inicial, unidad, procedencia y límites de trabajo. Las dimensiones auxiliares geométricas se encuentran en los tres generadores de código. |
| `src/model.mjs`, `src/hydraulic.mjs`, `src/other-assemblies.mjs`, `src/geometry.mjs` | Definición paramétrica de sólidos y relaciones por instancia. |
| `src/mechanics.mjs`, `src/viewport.ts`, `src/cad.worker.js` | Ley de movimiento, visualización y núcleo aislado. |
| `outputs/A`, `outputs/B`, `outputs/C` | Abra `index.html` para los planos, imágenes, vídeo, informes y descargas. Cada carpeta incluye STEP por geometría reutilizada, STEP ensamblado, GLB animado, lista de piezas y matrices, tabla dimensional CSV y JSON, cinco pares SVG/DXF y capturas reales. |
| `outputs/C/operation.mp4` | Grabación del ciclo del embrague en el visor WebGL. |
| `outputs/{A,B,C}/lesson.mp4` | Explicación ManimCE a partir de los contornos calculados por intersección con un plano. |
| `scripts/reference-data.json`, `outputs/{A,B,C}/interpretation.json` | Interpretación por vista, componentes, funciones, relaciones, evidencia disponible e incertidumbres. |
| `outputs/browser-validation.json`, `outputs/{A,B,C}/*validation.json` | Ensayos ejecutados y verificaciones independientes. |

## Interpretación y calibración

**C · Hoja 281.** Eje Z de izquierda a derecha. La cota de 380 mm calibra los 930 píxeles entre las dos referencias axiales. El Ø60 calibra unos 144 píxeles en sentido radial. Estas escalas independientes corrigen una diferencia de aproximadamente 2 % en la reproducción digital. La vista A reducida usa su propia escala diametral. La sección muestra dos discos con material de fricción por ambas caras, un separador, pistón y reacción. La zona dentada muestra cuatro coronas en dos pares. El perfil C–C y la leyenda sostienen una geometría de cadena. Las coronas incorporan asientos circulares y un paso cordal de 20 mm. El diámetro de rodillo, los flancos, la anchura y la disposición axial son interpretativos. Las dos variantes de alimentación se mantienen identificadas. Se modeló un distribuidor esquemático inspirado en la variante I.

La presión impresa de 3–3,5 kg/cm² se interpreta como kgf/cm². Equivale a aproximadamente 0,294–0,343 MPa. El valor de trabajo inicial es 0,32 MPa. El área activa corresponde a la corona nominal de radios estimados 120 y 84 mm. El pistón tiene juego radial de visualización. La presión sigue una rampa prescrita junto con la carrera. El contacto de todas las caras habilita el apriete `max(pA − Fretorno, 0)`. La hipótesis de desgaste uniforme da `Rm = (Ro + Ri)/2`. La capacidad ideal se calcula con `n μ F Rm`, con radios en metros para N·m. Las dimensiones del área efectiva, los 650 N de retorno y μ = 0,12 son supuestos. El modelo no determina fugas, aceleración por fricción, trabajo disipado, calentamiento, lubricación ni tiempo real de acoplamiento.

**B · Hoja 280.** Disco único con dos caras de fricción, resortes helicoidales de presión y palancas de desembrague. Los Ø240 y Ø145 se asignaron a la banda de fricción. El Ø65 queda registrado con su asignación pendiente. Calibración radial de la sección por Ø240. La escala axial de B y la correspondencia frontal son aproximadas. El disco queda a la velocidad libre con el plato retirado. El apoyo tangencial de la palanca fija el sentido opuesto de los desplazamientos de sus extremos. La carrera y el aparejo de liberación son esquemáticos.

**A · Transmisión.** Los ejes coaxiales, los centros desplazados y los costados del portador son compatibles con una arquitectura epicíclica. La lámina carece de cotas métricas legibles y no identifica el contacto ni la cuenta de dientes. Los elementos desplazados representan los cubos, almas perforadas y aros discernibles. La periferia de transmisión y la relación cinemática quedan abiertas. La entrada y el portador pueden inspeccionarse y girarse independientemente.

Las tres láminas usan ejes de trazo y punto, contornos visibles, líneas de indicación, y rayados alternados de cuerpos seccionados. El patrón de rayado separa piezas adyacentes, pero por sí solo no identifica materiales. Las bolas se reconocen por su símbolo en corte. El número de bolas y su diámetro son ilustrativos. Las pistas tienen gargantas geométricas. El movimiento orbital usa velocidades de las pistas y radios de contacto simplificados, y omite el giro propio y la jaula. La deformación de cada resorte en pantalla escala su hélice en Z. Las piezas con material de fricción reúnen cara, soporte y acoplamiento en un sólido equivalente por disco.

## Ensayos y reproducción

El visor requiere únicamente Node para servirlo. La preparación de dibujos y la verificación independiente utilizan Python 3.12, `requirements-validation.txt` y OCP nativo. Chrome y Playwright permiten repetir las pruebas de interfaz. La creación de vídeos usa ManimCE 0.20.1 y FFmpeg. Los archivos ya generados se pueden abrir sin estas herramientas.

```powershell
npm ci
npm test
node scripts/smoke.mjs C B A
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements-validation.txt
foreach ($case in 'C','B','A') {
    node scripts/export.mjs $case
    .venv\Scripts\python scripts/drawings.py $case --interference
}
.venv\Scripts\python scripts/travel.py B C
# Con el servidor en 5178, Python con Playwright instalado y Chrome disponible
python scripts/browser.py
python scripts/movie.py
.venv\Scripts\python scripts/audit.py --tolerance-mm 0.05
python -m manim -ql --media_dir .manim scripts/lessons.py Hydraulic Automotive Transmission
Copy-Item .manim/videos/lessons/480p15/Hydraulic.mp4 outputs/C/lesson.mp4 -Force
Copy-Item .manim/videos/lessons/480p15/Automotive.mp4 outputs/B/lesson.mp4 -Force
Copy-Item .manim/videos/lessons/480p15/Transmission.mp4 outputs/A/lesson.mp4 -Force
python scripts/catalog.py
npm run build
```

La comparación de dimensiones usa superficies cilíndricas reimportadas del STEP y la cuerda entre centros de asientos consecutivos. Una coincidencia confirma la reproducción de esa cota en el sólido. No constituye evidencia independiente de las dimensiones estimadas. El umbral de interferencia es 0,05 mm³. El barrido comprueba la posición inicial y, para los embragues, las posiciones media y final a fase angular cero. El ensayo de holguras cubre cinco posiciones y tres tamaños del paquete. Una envolvente completa de movimiento, un ajuste de cadena según norma y un análisis de tolerancias están pendientes.

Las secciones SVG/DXF proceden de intersecciones geométricas en OCP. Las vistas laterales, de extremo y de detalle separan líneas visibles y ocultas mediante HLR. Las curvas se discretizan en la salida vectorial con una flecha nominal de 0,12 mm. La sección interactiva del visor recorta triángulos. El STEP y la fuente conservan la geometría sólida y paramétrica, respectivamente. GLB usa metros y conserva grupos, identificadores, materiales visuales y pistas de movimiento.

Las escalas de las vistas B–B, C–C, D–D, E–E y los detalles sin cotas se tratan por separado en los informes. La verificación implementada cubre las dos vistas principales, las dimensiones asignadas y los detalles generados. Permanecen pendientes la correspondencia dimensional de cada detalle ampliado, el ajuste completo de contornos, la forma exacta de fundición y la identificación de los elementos omitidos de cada lámina.

