# Biblioteca de despieces

Las 15 hojas originales se conservan en `public/laminas`. El editor ofrece 22 estudios asociados a estas hojas. La transmisión A del proyecto anterior conserva su entrada independiente. Cada estudio se selecciona desde **Biblioteca de láminas** o desde la lista del árbol.

## Cómo inspeccionar y preparar un plano

1. Seleccione una hoja y, si tiene varias figuras, el mecanismo de interés. **PDF original** abre la lámina completa.
2. Pulse **Explosionar**. El deslizador controla la distancia global. Las líneas unen la posición de montaje con el centro desplazado. **Encuadrar** ajusta la vista actual.
3. Seleccione una superficie o busque el nombre, número de posición o identificador en el árbol. **Aislar** centra la pieza. **Mostrar todo** recupera el conjunto.
4. En **Separación individual**, elija X, Y o Z y ajuste la distancia en milímetros. Puede ajustar varias piezas sucesivamente. **Restituir pieza** devuelve la seleccionada y **Reiniciar** elimina todos los desplazamientos de presentación.
5. **Descargar plano SVG** guarda la vista visible con llamadas, denominaciones y cantidades agrupadas por geometría. **Despiece completo ZIP** añade láminas individuales numeradas de hasta 15 posiciones y la lista CSV. Las vistas de detalle están ajustadas para identificación y carecen de escala de fabricación. El SVG general contiene una imagen del modelo renderizado y anotaciones vectoriales. Las fichas individuales proyectan aristas y siluetas de la malla.
6. **Exportar → STEP pieza** entrega el sólido local seleccionado. Una cabeza y un vástago mecanizados en un mismo tornillo forman una pieza. Tornillos distintos, arandelas, aros y elementos rodantes tienen identificadores independientes cuando están modelados. El despiece altera la presentación y conserva el montaje CAD.

## Cobertura de las hojas

| Hoja | Estudio seleccionable | Alcance y simplificaciones relevantes |
|---|---|---|
| 60 | Gato elevador | Columna, base con cartelas, husillo, tuerca, cabezal, tope, barra, apoyos y fijaciones. Roscas y contacto axial esquemáticos. |
| 89 | Variador de cadena | Semipoleas, ejes, transmisión cerrada con placas, pasadores y rodillos, cárter y apoyos. La cadena es una aproximación visual a la articulación. Mando de variación y motor auxiliar pendientes. |
| 154 | Caja de automóvil | Ejes principales, ruedas, caja, palanca, apoyos y fijaciones. Faltan los detalles de sincronizadores, horquillas y tren completo de marcha atrás. |
| 157 | Caja de torno universal | Dos líneas de ejes, ruedas de varias etapas, poleas extremas, cuerpo, apoyos y tapas. Asociaciones de marcha y estrías simplificadas. |
| 161 | Caja de taladradora | Cinco líneas de ejes y trenes escalonados con polea. Carcasa interpretativa. Motor, transmisión flexible y selectores pendientes. |
| 164 | Caja de fresadora | Cinco ejes, grupos de ruedas y apoyos. El corte desarrolla ejes en un plano. La disposición transversal real y el mando quedan pendientes. |
| 199 | Reductor de cadena | Dos etapas de ruedas de 15 y 75 dientes, paso 12,7 mm, ejes, piezas de cadena y apoyos. Perfil de rodillo y cierre de cadena aproximados. Se omite el tensor. |
| 209 | Motor eléctrico y rectificadora | Dos conjuntos de eje, rotor, estator y apoyos. Bobinado y entorno electromagnético esquemáticos. |
| 210 | Torno, fresadora y taladradora | Tres husillos independientes. Diámetros, canales de polea, asientos y narices aproximados. Perfilería de conos Morse y precargas pendientes. |
| 212 | Árbol motriz y eje de retorno | Dos ejes con rueda, tapas, soportes y elementos de rodamiento. Obturación y geometría del órgano de arrastre simplificadas. |
| 214 | Locomotora y vagón | Dos ejes ferroviarios con ruedas y apoyos diferenciados. Perfil de rodadura y geometría interna de los rodamientos interpretativos. |
| 263 | Acoplamiento pesado | Bridas, manguitos, horquillas, muñones, árbol intermedio y tornillería individual. Faltan detalles internos de transmisión entre muñón y árbol. |
| 280 | Embrague de automóvil | Conserva el modelo funcional B y sus estudios anteriores. |
| 281 | Embrague con rueda de cadena y embrague de la figura 2 | La figura 1 incorpora una tapa de retención, seis tornillos y seis arandelas de patrón interpretado. La figura 2 tiene su propio estudio de pistón y paquete, sin selección de las cuatro tallas tabuladas. |
| 296 | Zapatas y variante elástica | Dos interpretaciones de la unión del cubo con la periferia de fricción, con pasadores y enlaces individuales. Los elementos elásticos y la segunda figura presentan simplificaciones sustanciales. Pendiente verificar la ley de fuerza centrífuga y cada variante de montaje. |

Las reconstrucciones nuevas se destinan a reconocer y separar elementos. El número de piezas del editor describe las instancias construidas. La cantidad real de tornillos ocultos, eslabones, rodillos y bolas, y la secuencia de desmontaje requieren documentación adicional. Las dimensiones interpretadas están en los generadores `src/*-studies.mjs` y `src/study-solids.mjs`. Las juntas de trabajo verificadas de B y C se mantienen. Las cajas y demás estudios nuevos se inspeccionan estáticamente.

## Referencia visual y comprobación

El acceso directo «AniMotionPDF - LOCAL» remite al lanzador de AniMotionTools y al proyecto local AniMotionPDF. El estudio utiliza sus colores de papel y tinta, el acento violeta #7c4dff, la tipografía de interfaz del sistema, los títulos Georgia y el tratamiento de tarjetas y bordes de su hoja de estilos global.

`scripts/check-exploded.py` recorre el selector y la biblioteca de PDF, selecciona una instancia, la aísla, aplica un desplazamiento, restituye el conjunto y descarga cada paquete por la interfaz. Comprueba que cada posición del CSV sea única, que tenga su ficha, y que cada hoja vectorial se pueda volver a leer. El registro y los paquetes se escriben en `outputs/despieces`. La validez topológica de las definiciones nuevas se comprueba con `node scripts/smoke.mjs` seguido de las claves de los estudios. Esta verificación es distinta de la validación dimensional y de interferencias del embrague prioritario.

