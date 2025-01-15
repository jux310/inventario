import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'chart': ['chart.js', 'react-chartjs-2', 'chartjs-adapter-date-fns'],
          'vendor': ['react', 'react-dom', 'react-router-dom']
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
