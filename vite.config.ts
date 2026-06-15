import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['.ngrok-free.dev', 'straddle-sulphuric-monoxide.ngrok-free.dev'],
  },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-pdf')) return 'vendor-pdf';
            if (id.includes('html2canvas')) return 'vendor-canvas';
            if (id.includes('react/') || id.includes('react-dom/')) return 'vendor-react';
            return 'vendor'; // all other dependencies
          }
        }
      }
    }
  },
});
