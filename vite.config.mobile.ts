import { defineConfig } from 'vite';

// Build used only for the native (Capacitor) shells — assets are served from
// the app's own bundle root there, unlike the GitHub Pages deploy which lives
// under /Kaipora/. See vite.config.ts for the web build.
export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist-mobile',
    sourcemap: false
  }
});
