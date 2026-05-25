import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/OpPoReview/',
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'https://xyp4wkszi7.execute-api.ap-southeast-1.amazonaws.com/prod',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: true
      },
      '/api-employer': {
        target: 'https://dlidp35x33.execute-api.ap-southeast-1.amazonaws.com/prod',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-employer/, ''),
        secure: true
      },
      '/api-jobs': {
        target: 'https://dlidp35x33.execute-api.ap-southeast-1.amazonaws.com/prod',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-jobs/, ''),
        secure: true
      },
      '/api-cv': {
        target: 'https://v56v542h8f.execute-api.ap-southeast-1.amazonaws.com/prod',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-cv/, ''),
        secure: true
      },
      '/api-applications': {
        target: 'https://l1636ie205.execute-api.ap-southeast-1.amazonaws.com/prod',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-applications/, ''),
        secure: true
      }
    }
  },
  build: {
    rollupOptions: {
      external: [],
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lucide-react')) return 'vendor_lucide';
            if (id.includes('html2canvas')) return 'vendor_html2canvas';
            if (id.includes('purify')) return 'vendor_purify';
            if (id.includes('node_modules/react/')) return 'vendor_react';
            if (id.includes('node_modules/react-dom/')) return 'vendor_react_dom';
            if (id.includes('node_modules/styled-components/')) return 'vendor_styled';
            if (id.includes('node_modules/framer-motion/')) return 'vendor_framer';
            if (id.includes('node_modules/react-router')) return 'vendor_router';
            return 'vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 2000 // raise limit to reduce noisy warnings (KB)
  },
  optimizeDeps: {
    include: ['@popperjs/core']
  }
})
