import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // the React app calls /api/... and /uploads/... ; in development they go to the Node server
    proxy: {
      '/api': 'http://localhost:4000',
      '/uploads': 'http://localhost:4000',
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
