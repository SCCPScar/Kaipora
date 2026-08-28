import { defineConfig } from 'vite';

// Project is deployed to GitHub Pages at https://<user>.github.io/Kaipora/
// Override with VITE_BASE_PATH if deploying to a custom domain (use '/').
export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/Kaipora/',
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
