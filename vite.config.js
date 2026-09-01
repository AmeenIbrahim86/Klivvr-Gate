import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // لو هتنشر على GitHub Pages تحت اسم repo، خلّي base = '/company-portal/'
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
