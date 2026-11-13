# Auditoría técnica preliminar — ITM-JOB/CAD
**Fecha:** 13 de noviembre de 2026  
**Bases examinadas:** `mechanical-workstation.rar`, `OneDrive_1_11-13-2026.zip`, `README.md`, `DESPIECES.md`, implementaciones locales, y repositorio remoto `ITM-JOB/CAD`.

## 1. Estado confirmado

- Nuevo repositorio público: `https://github.com/ITM-JOB/CAD`, rama `main`, commit `a7c19df` (Initial commit). Contiene solo `README.md` al momento de la consulta. La conexión GitHub utilizada tiene permisos `pull=true`, `push=false`; no se ha modificado el remoto.
- Archivo RAR: incluye fuentes de la aplicación, dependencias locales, recursos PDF, salidas CAD, pruebas y registros. Se extrajo una copia de inspección sin alterar el archivo original.
- Biblioteca: 15 hojas A4 apaisadas, digitalizadas como imagen dentro de un PDF (sin capa de texto extraíble). La biblioteca modelada tiene 22 estudios sobre 15 hojas, más la transmisión independiente A: 23 entradas en total.
- Tecnología: Vite, TypeScript 5.9.3, Three.js 0.187, replicad 1.2.1 y OpenCascade por WASM. Las salidas incluyen STEP, GLB, SVG, DXF, imágenes, CSV y vídeos.
- La validación almacenada en `outputs/despieces/validacion.json` registra 23 paquetes de despiece, 2444 instancias sumadas entre las entradas. No representa necesariamente 2444 piezas físicas distintas ni certifica sus dimensiones de fabricación.

## 2. Pruebas reproducidas en este análisis

| Validación | Resultado | Observación |
|---|---|---|
| `npm test` | **6/6 pasan** | Pruebas del modelo A/B/C y lógica mecánica específica |
| `node scripts/smoke.mjs` con los 20 modelos nuevos | **20/20 completan** | Sólidos inspeccionados por el script; no implica precisión dimensional |
| `node node_modules/typescript/bin/tsc --noEmit` | **Pasa** | Análisis estático de TypeScript |
| `npm run build` directo | **No reproducido** | Dependencias del RAR extraídas desde Windows: los ejecutables quedaron sin permiso en Linux |
| `node node_modules/vite/bin/vite.js build` | **Bloqueado por dependencia** | Falta el paquete opcional nativo `@rollup/rollup-linux-x64-gnu` en el árbol de dependencias incluido; no atribuirlo a defecto del código |
| Playwright / validación visual completa | **No reproducido aquí** | Hay resultados preexistentes en `outputs`; requieren repetición en la máquina de desarrollo |

Casos visibles de la validación de humo: hoja 60 = 29 instancias, 154 = 99, 199 = 743, 281-2 = 20, 296-2 = 20. El informe de validación anterior describe verificaciones adicionales; sus resultados se tratan como evidencia documental, no como pruebas repetidas en esta sesión.

## 3. Hallazgos técnicos con impacto didáctico

**P0 — separar apariencia geométrica de validez mecánica.** Los modelos nuevos se inspeccionan estáticamente; `studioState` desactiva reproducción, velocidades y tiempo para `isStudy(key)`. No deben describirse como simulaciones funcionales validadas. Esto contrasta con los modelos prioritarios B y C, que tienen movimiento cinemático específico y seis pruebas unitarias.

**P0 — consistencia de engrane.** En `src/geared-studies.mjs`, la hoja 154 usa módulo 4,25 mm y separación de ejes 149 mm. La pareja modelada de 62 y 16 dientes a la misma estación longitudinal exigiría una distancia entre centros estándar `a = m(z1+z2)/2 = 165,75 mm`, diferencia de **16,75 mm** respecto de 149 mm. Esto no demuestra que esas dos ruedas engranen en el mecanismo original; demuestra que el generador actual debe expresar explícitamente las relaciones de engrane válidas, las posiciones de selección y la topología de marcha. Evitar animar contactos ficticios.

**P1 — ajuste de cadena.** El generador calcula número par de segmentos redondeando longitud/paso. En la hoja 199, la geometría indicada en el código produce una longitud de recorrido aproximada de 1064,33 mm y 84 eslabones; el intervalo distribuido es aproximadamente **12,6706 mm**, frente a paso nominal de 12,7 mm. En la 89, con radio de referencia 117 mm y paso aproximado 24 mm, se obtienen 60 intervalos de unos **24,2522 mm**. Son desviaciones propias del modelo visual, no resultados de una cadena comercial o de su montaje.

**P1 — dinámica ausente.** `src/mechanics.mjs` implementa velocidades libres y bloqueo inmediato cuando el embrague cierra. No resuelve fase de deslizamiento, par transmitido dependiente de aceleración, inercia, energía disipada o calentamiento. La presión de C usa rampa prescrita. Las futuras clases de mecanismos necesitan grados de libertad, juntas, actuadores, restricciones y leyes de contacto propias.

**P1 — evidencia y dimensiones.** Los 15 PDF de la biblioteca están rasterizados, sin texto extraíble. Se deben registrar cotas con referencia al recorte de origen, unidades, incertidumbre y procedencia: impresa, deducida, parametrizada o ilustrativa. Un sólido STEP válido no demuestra equivalencia a la lámina ni viabilidad de fabricación.

**P2 — planos y documentación.** `src/exploded.ts` produce un SVG general con imagen rasterizada del visor y anotaciones vectoriales; los dibujos individuales se derivan de aristas de malla. Son adecuados para identificación, pero no sustituyen planos de taller con acotación, tolerancias y simbología normalizadas. Para fabricación utilizar vistas HLR y secciones del B-Rep y comprobar dimensiones.

**P2 — publicación y licencias.** El repositorio de GitHub es público. Antes de subir PDFs escaneados, miniaturas y referencias de terceros, verificar autorización de redistribución. El paquete local entregado preserva los recursos originales únicamente para revisión y desarrollo; no presupone permiso para publicación. Para el público se recomienda separar un paquete de recursos privados y mostrar únicamente obras autorizadas.

## 4. Arquitectura de evolución propuesta

1. **Document IR mecánico:** `sheet → views → dimensions → components → evidence → unknowns`, con referencias de fuente y unidades.
2. **Model IR de ensamblaje:** `part-definitions → part-instances → placements → joints → contacts → motion-groups → BOM`. No usar el número de instancias como equivalente a cantidad real sin validación de ensamblaje.
3. **Motor CAD:** Replicad/OpenCascade como fuente de B-Rep, mesher Three.js para representación, validaciones de interferencias, distancias, volumen y exportación STEP/GLB.
4. **Motor cinemático:** definir restricciones para revolutas, prismáticas, engranes, cadena y tornillo-tuerca; después introducir dinámica solo en casos cuya evidencia lo soporte. Para la caja 154 documentar primero qué engrana en cada marcha.
5. **Modo explicación:** identificar en la lámina → aislar/explosionar → mostrar conexión funcional → animar → dibujar fuerzas/torques/flujo de potencia → formular cálculo → contrastar cotas → cuestionario y rúbrica.
6. **Motor de planos:** distinguir 'ficha educativa sin escala' de 'plano técnico derivado del B-Rep', evitando dar dimensiones inventadas.
7. **Calidad y despliegue:** pruebas por estudio, capturas automáticas, checks de equivalencia, CI con `npm ci`, `npm test`, `tsc`, smoke de 20 estudios y compilación Vite; publicar con permisos explícitos de activos.

## 5. Secuencia recomendada

- **Etapa 0 — migración controlada:** transferir el código fuente depurado al nuevo repositorio en una rama, preservar README y exigir revisión de licencias antes de publicar las 15 láminas.
- **Etapa 1 — integridad del mecanismo:** priorizar 154, 199 y 281, con tablas de pares de engrane, paso de cadena, contactos, cotas y matriz de incertidumbre.
- **Etapa 2 — lecciones interactivas:** crear una plantilla transversal y una explicación completa por uno de los casos prioritarios; convertir selección del árbol y despiece en acciones didácticas contextualizadas.
- **Etapa 3 — ampliación:** implementar leyes de movimiento, ecuaciones de transmisión, parámetros de usuario y guardas para simulaciones físicamente inconsistentes, con pruebas reproducibles.
- **Etapa 4 — salida educativa:** informes, SVG/DXF/STEP y ManimCE con un mismo estado de modelo y versiones de parámetros.

## 6. Migración por PowerShell (solo después de comprobar derechos de publicación)

```powershell
git clone https://github.com/ITM-JOB/CAD.git
cd CAD
# Extraer CAD_base_local_limpia.zip aquí, conservando la estructura.
# Verificar .gitignore, README.md y que los PDFs puedan publicarse.
npm ci
npm test
node scripts/smoke.mjs 60 89 154 157 161 164 199 209-1 209-2 210-1 210-2 210-3 212-1 212-2 214-1 214-2 263 281-2 296-1 296-2
npm run build
# Tras revisar la licencia de los recursos y el diff:
git status
git add .
git commit -m "Import mechanical workstation and educational CAD studies"
git push origin main
```

**Alcance de la auditoría:** inspección del código fuente, lectura visual de láminas 154 y 281, revisión de 15 contenedores PDF, prueba unitaria, smoke sobre 20 generadores y chequeo de tipos. No se evaluaron exhaustivamente interferencias de todas las posiciones ni la correspondencia dimensional de cada sección. No se ha realizado push, merge, deploy ni escritura en GitHub.
