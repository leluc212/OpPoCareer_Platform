import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Optional dev-only proxy target for package subscriptions API. Set
// PACKAGE_SUBSCRIPTIONS_PROXY_TARGET or VITE_PACKAGE_SUBSCRIPTIONS_PROXY_TARGET
// in your environment if you want to forward `/api-packages` to the real API
// to avoid CORS while developing.
const packageProxyTarget = process.env.PACKAGE_SUBSCRIPTIONS_PROXY_TARGET || process.env.VITE_PACKAGE_SUBSCRIPTIONS_PROXY_TARGET || '';

export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      // Lambda Function URL proxies (bypasses browser CORS)
      '/api-payments': {
        target: 'https://es3yq2niph.execute-api.ap-southeast-1.amazonaws.com/prod',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-payments/, ''),
        secure: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
          });
        }
      },
      '/api-employer': {
        target: 'https://dlidp35x33.execute-api.ap-southeast-1.amazonaws.com/prod',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-employer/, ''),
        secure: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
          });
        }
      },
      '/api-lambda-candidates': {
        target: 'https://gvxkjnavgu4lelloct5chgyjaa0jmyab.lambda-url.ap-southeast-1.on.aws',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-lambda-candidates/, ''),
        secure: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('authorization');
            proxyReq.removeHeader('Authorization');
          });
        }
      },
      '/api-lambda-applications': {
        target: 'https://65fnfwjx5m7iq5ilmoj5ea7nwq0cespm.lambda-url.ap-southeast-1.on.aws',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-lambda-applications/, ''),
        secure: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('authorization');
            proxyReq.removeHeader('Authorization');
          });
        }
      },
      '/api': {
        target: 'https://xyp4wkszi7.execute-api.ap-southeast-1.amazonaws.com/prod',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/candidates'),
        secure: true,
        
      },
      '/api-cv': {
        target: 'https://v56v542h8f.execute-api.ap-southeast-1.amazonaws.com/prod',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-cv/, ''),
        secure: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('authorization');
            proxyReq.removeHeader('Authorization');
          });
        }
      },
      '/api-applications': {
        target: 'https://l1636ie205.execute-api.ap-southeast-1.amazonaws.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-applications/, '/applications'),
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
          });
        }
      },
      '/api-report': {
        target: 'https://sd7ds72m8g.execute-api.ap-southeast-1.amazonaws.com/prod',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-report/, ''),
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
          });
        }
      }
    },
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
    chunkSizeWarningLimit: 2000
  },
  optimizeDeps: {
    include: ['@popperjs/core']
  }
})
