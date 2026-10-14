import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/content.ts'),
      name: 'OwnershipRadar',
      fileName: 'content',
      formats: ['iife']
    }
  },
  test: {
    globals: true,
    environment: 'happy-dom'
  }
});
