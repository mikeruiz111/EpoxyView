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
      '/api': 'https://epoxycam.com'
    }
  }
});
// Minor change to trigger deployment