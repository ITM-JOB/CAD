# M2 — Interpretación de elementos de máquina: despiece, movilidad y plano

**Repositorio de destino:** ITM-JOB/CAD · rama `main` · aplicación real de Three.js + Replicad/OpenCascade.

## Funcionalidad implementada

1. **Árbol cinemático.** Dos ramas generales: «Fijos respecto al bastidor» y «Móviles». Buscador, filtro de movilidad y colores didácticos opcionales (gris/violeta). El inspector indica la base de la clasificación y el grado de certeza.
2. **Rodamientos con jaula.** Los generadores ahora construyen aros interior/exterior, elementos rodantes y jaula geométrica de dos aros unidos por puentes. Cada elemento tiene identificador y sólido individual. Sin añadir sellos ni geometrías de fabricación que no estén sustentadas en la lámina.
3. **Despiece jerárquico.** El explosionado global anterior queda intacto. El despiece de subensamble agrega selección de rodamiento, aislamiento, desplazamiento independiente y reproducción de una secuencia: aro exterior → jaula → bolas/rodillos → aro interior. El desplazamiento animado es de presentación, no representa un procedimiento aprobado de desmontaje.
4. **Correspondencia de plano.** Botón «Plano ↔ 3D» abre la hoja digitalizada de la lámina PDF original junto al renderizador 3D. El PDF íntegro sigue accesible mediante enlace. El usuario puede seleccionar una pieza en el árbol, activar «Marcar región» y arrastrar una región sobre el dibujo. La marca permite seleccionar de regreso la pieza 3D.
5. **Intercambio de anotaciones.** Exportar e importar JSON por hoja. Las regiones se identifican por `estudio::identificador` para evitar confundir las dos figuras de una misma hoja. Las anotaciones locales se mantienen en `localStorage`. Para publicarlas a todos los estudiantes, colocar el JSON exportado en `public/mappings/<hoja>.json` del repositorio.

## Uso docente recomendado

1. Seleccione **Hoja 281, embrague C**.
2. Active «Colores didácticos». Compare un componente fijo al bastidor con el árbol, tambor y pistón.
3. Seleccione un aro en la sección Rodamientos; el selector de subensamble señalará su rodamiento.
4. Use «Aislar rodamiento», lleve el control «Separar aros, jaula y elementos rodantes» a 100 % o pulse «Animar piezas».
5. Abra «Plano ↔ 3D», seleccione la pieza en el árbol y marque su zona sobre la reproducción de la lámina original. Repita para las piezas que pueda identificar con evidencia suficiente.
6. Exporte el JSON, compruébelo y súbalo a `public/mappings/281.json`. Una vez publicado en GitHub Pages, las regiones estarán visibles para todos los estudiantes.

## Precisión técnica y limitaciones

- «Fijo» se define **respecto al bastidor**; una chaveta fija al eje rotativo es móvil respecto a ese marco.
- Para **A, B y C** la categoría procede de las relaciones cinemáticas definidas en el generador; para los **20 estudios nuevos** es una hipótesis funcional sujeta a verificación.
- Los rodamientos continúan siendo esquemáticos: se incorpora una jaula plausible, pero todavía no se determinan su designación normalizada, número real de elementos rodantes, holguras, perfiles de pista exactos, tapas ni sellos.
- La vista de la hoja en el panel es una **imagen fiel derivada del PDF original**; el botón PDF abre el archivo íntegro. Las marcas no son entidades vectoriales extraídas automáticamente del PDF ni prueban cotas.
- No se incluyen correspondencias finas inventadas para piezas ocultas. Cada correspondencia precisa requiere anotación manual y revisión de la fuente.
- El despiece interno es un movimiento pedagógico de separación espacial y no una secuencia autorizada de desmontaje real.
- Los paquetes precalculados A/B/C de `outputs/` no forman parte de este parche; continúan siendo opcionales para el editor principal y se gestionan como en M1.

## Control de calidad

Se ejecutaron con éxito `node --test tests/*.test.mjs`, `node node_modules/typescript/bin/tsc --noEmit`, y `node scripts/smoke.mjs` con **A, B, C y los 20 estudios** (salvo si se indica lo contrario en el registro). La compilación de Vite en este contenedor no se pudo efectuar por falta del binario opcional nativo `@rollup/rollup-linux-x64-gnu` en las dependencias del archivo original; un `npm ci` en GitHub Actions (Linux) lo instala normalmente. **Se debe verificar el despliegue remoto y el navegador después del commit.**

## Publicación

1. Aplique los archivos del ZIP del parche a la raíz del repositorio local, **sin eliminar los demás**.
2. Confirme que `src/learning.mjs`, `src/sheet-link.ts`, `public/mappings/281.json` y el resto de rutas del parche están presentes.
3. Ejecute `npm ci`, `npm test` y `npm run build` en una instalación con acceso a NPM.
4. Confirme y publique en `main`. El flujo existente `.github/workflows/deploy.yml` actualizará GitHub Pages automáticamente.
5. Compruebe `https://itm-job.github.io/CAD/`: barra lateral, subdespiece, hoja PDF original, marcado/importación de JSON y comportamiento en móvil.
