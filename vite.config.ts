import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      // Proxies /api requests to Cloudflare Functions during local development
      '/api': 'http://127.0.0.1:8788'
    }
  }
});