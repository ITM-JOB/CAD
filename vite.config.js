import {defineConfig} from 'vite';

export default defineConfig({
  base: '/CAD/',
  worker: {format: 'es'},
  optimizeDeps: {exclude: ['replicad-opencascadejs']},
  build: {target: 'es2022'},
});
