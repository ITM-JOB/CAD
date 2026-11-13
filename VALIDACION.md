# Registro de ejecución inicial

La ampliación posterior añadió 13 instancias al conjunto C (72 en total), 15 láminas en la biblioteca y despieces por figura. Los resultados vigentes están en outputs/despieces/validacion.json y en los registros JSON por conjunto. Las cifras de la tabla siguiente documentan la primera entrega.

Windows, Node 22.23.4, npm 10.9.9 y Python 3.12.10. Las pruebas se ejecutaron en la carpeta de este proyecto. Las figuras de referencia proceden de los tres PNG facilitados en el chat. Las salidas de validación legibles por máquina se encuentran en `outputs`.

| Etapa | Ejecución y resultado | Archivo o incertidumbre |
|---|---|---|
| Interpretación | Inspección de las tres imágenes y ampliación del paquete y del perfil de cadena de C. Calibración independiente de sus vistas principal y reducida. | `scripts/reference-data.json`, PNG originales e inventarios por conjunto. A carece de escala absoluta. |
| Núcleo | `node scripts/smoke.mjs C B A` y verificación por conjunto. Una corona Ø24/Ø10 × 9 mm dio 3364,646 mm³ y un STEP de 9341 bytes. Se corrigieron el alambre del perfil de cadena y una unión coincidente del eje estriado. | Prueba de Booleanas, mallado posterior en el navegador y verificación nativa del STEP. |
| Hidráulico | `node scripts/export.mjs C`. 21 definiciones geométricas y 59 instancias. Se modelaron dos discos revestidos, cuatro caras activas y dos pares de coronas dentadas. | `outputs/C/assembly.step`, `parts/`, `assembly.json`. Diámetro de rodillo y geometría detallada de acoplamiento pendientes. |
| Editor | `python scripts/browser.py` terminó con C, B y A correctos. Comprobó selección por rayo, vistas, explosión, reproducción, cursor de tiempo, superposiciones y descarga. C rechazó cero discos y regeneró tres discos, aumentando de 59 a 61 instancias. | `outputs/browser-validation.json` y capturas por conjunto. |
| Comparación | `.venv/Scripts/python scripts/drawings.py C --interference` y los casos A/B produjeron 15 pares SVG/DXF. En la comparación se corrigieron la orientación de la vista axial y la cantidad de coronas visibles. | `comparison.png`, `comparison-end.png`, `dimensions.csv`. Las formas de fundición y varios detalles ampliados siguen aproximados. |
| A y B | `node scripts/export.mjs A` y `node scripts/export.mjs B`. 37 y 35 instancias, respectivamente, con 14 geometrías distintas en cada conjunto. La reimportación detectó una palanca partida; se corrigió su espesor. Se corrigieron interferencias de la tapa y tornillos de B. | Los pasos de la generación son reutilizables. La relación de A permanece sin identificar. |
| Animación | `python scripts/movie.py` y `python -m manim -ql --media_dir .manim scripts/lessons.py Hydraulic Automotive Transmission`. Se generaron el ciclo WebGL de C y tres vídeos explicativos con secciones del mismo STEP. Se decodificaron fotogramas de los cuatro vídeos. | `outputs/media-validation.json`. Las velocidades, el cierre y la compresión elástica visual son prescritos. |
| Validación final | `npm test` aprobó 6 de 6 pruebas. `scripts/travel.py B C` no encontró interferencias mayores a 0,05 mm³ en las posiciones media y final ensayadas. `scripts/audit.py` reabrió 131 nodos de geometría GLB y los quince DXF, y corroboró nueve referencias de C y dos de B en los STEP. | Los casos sin correspondencia se conservan en los CSV. El muestreo no cubre todas las combinaciones paramétricas o fases angulares. |
| Distribución local | `npm run build` y `python scripts/production-check.py` pasaron. Chrome cargó el trabajador WASM del sitio compilado y se verificaron los enlaces de las tres fichas empaquetadas. | `dist/` y los fuentes del proyecto. |

## Límites del alcance ejecutado

El editor reproduce tres interpretaciones codificadas de estas referencias. La importación automática de un plano nuevo, el reconocimiento general de cotas o símbolos, la reconstrucción de superficies arbitrarias y el ajuste automático de geometría a contornos permanecen fuera de la implementación. La comparación de los detalles ampliados solo pudo hacerse cualitativamente. El usuario puede repetir la evaluación de las vistas principales con superposición. El dibujo de fabricación, los ajustes normalizados, el ensayo de potencia y el dimensionamiento de seguridad necesitan evidencia adicional.

