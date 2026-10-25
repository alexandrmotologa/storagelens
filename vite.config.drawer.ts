import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    outDir: 'dist-drawer',
    lib: {
      entry: path.resolve(__dirname, 'src/drawer/index.ts'),
      name: 'StorageLens',
      fileName: () => 'storagelens.js',
      formats: ['iife', 'es'],
    },
    rollupOptions: {
      output: {
        extend: true,
      },
    },
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
