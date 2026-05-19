import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

// Existing source files use the `.js` extension but contain JSX, so we
// teach esbuild and the dep optimizer to treat them as JSX. Output goes
// to `build/` so the Dockerfile's `tar -xzf client/build.tar.gz` step
// and the Express static-file serving keep working unchanged.
//
// svgr uses Vite's `?react` query: `import Foo from './foo.svg?react'`
// returns a React component, while a plain `import url from './foo.svg'`
// still returns the asset URL.
export default defineConfig({
  plugins: [react(), svgr()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'build',
    sourcemap: true,
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
  },
});
