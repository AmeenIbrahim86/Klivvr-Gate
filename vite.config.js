import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [],
  base: process.env.VITE_BASE || '/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        kitchen: resolve(__dirname, 'kitchen.html')
      }
    }
  }
});