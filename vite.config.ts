import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './app'),
      '@server': path.resolve(__dirname, './server'),
    },
  },
  server: {
    port: 3000,
    host: process.env.VITE_HOST || '127.0.0.1',
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('@shopify/polaris')) return 'vendor-polaris';
          if (id.includes('react') || id.includes('scheduler')) return 'vendor-react';
          if (
            id.includes('lucide-react') ||
            id.includes('clsx') ||
            id.includes('tailwind-merge') ||
            id.includes('qrcode')
          ) {
            return 'vendor-utils';
          }
        },
      },
    },
  },
});
