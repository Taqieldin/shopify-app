import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-oxc';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'app'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://127.0.0.1:3001',
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
