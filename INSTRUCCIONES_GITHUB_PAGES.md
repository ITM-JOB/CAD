# Publicación de CAD en GitHub Pages

1. Extrae `CAD_base_local_limpia.zip` en una carpeta local. **No publiques las láminas PDF si careces de derechos para distribuirlas.**
2. Descomprime este parche encima de esa carpeta y acepta reemplazar `vite.config.js`, `src/main.ts`, `src/studio.ts`.
3. En https://github.com/ITM-JOB/CAD/settings/pages selecciona `Build and deployment` → `Source` → `GitHub Actions`.
4. Instala Node.js 22. En PowerShell dentro de la carpeta: `npm ci; npm test; npm run build`.
5. Publica los archivos fuente al repositorio `ITM-JOB/CAD` en la rama `main` (incluyendo `.github/workflows/deploy.yml`, `src`, `public`, `scripts`, `outputs`, `package-lock.json` y `package.json`). Nunca subas `node_modules`, `dist`, `.venv`.
6. Verifica `Actions` → `Publicar CAD en GitHub Pages` → ejecución verde.
7. Abre https://itm-job.github.io/CAD/

Importante: el flujo de CI compila también los entregables precalculados A, B y C usando `scripts/stage-outputs.mjs`; por eso incluye `outputs/A`, `outputs/B`, `outputs/C` con sus `index.html`. Los archivos fuente deben estar en la raíz del repositorio y no dentro de una carpeta contenedora adicional.

Si ya existe una aplicación diferente en el repositorio, revisa los cambios antes de sobrescribirlos. Este parche fue preparado para la copia local auditada del 13 de noviembre de 2026.
