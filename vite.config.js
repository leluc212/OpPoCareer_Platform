import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const packageProxyTarget = process.env.PACKAGE_SUBSCRIPTIONS_PROXY_TARGET || process.env.VITE_PACKAGE_SUBSCRIPTIONS_PROXY_TARGET || '';

export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api-cv-ai': {
        target: process.env.CV_AI_PROXY_TARGET || 'https://sd7ds72m8g.execute-api.ap-southeast-1.amazonaws.com/prod',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-cv-ai/, ''),
        secure: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
          });
        }
      },
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
            const auth = req.headers['authorization'] || req.headers['Authorization'];
            if (auth) proxyReq.setHeader('Authorization', auth);
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
            // Explicitly remove then re-set to prevent duplication from changeOrigin
            proxyReq.removeHeader('authorization');
            proxyReq.removeHeader('Authorization');
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
      },
      // eKYC Mock Server (local dev) — đổi target thành API Gateway khi deploy AWS
      '/api-ekyc': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-ekyc/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
          });
        }
      },
      // QUAN TRỌNG: '/api' phải đứng CUỐI CÙNG vì nó match tất cả path bắt đầu bằng /api
      // (bao gồm cả /api-applications, /api-cv, v.v.). Vite proxy dùng first-match,
      // nên các rule cụ thể hơn phải đứng trước rule chung '/api'.
      '/api': {
        target: 'https://xyp4wkszi7.execute-api.ap-southeast-1.amazonaws.com/prod',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/candidates'),
        secure: true,
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
            // Use regex-style matching to handle both / and \ path separators (Windows vs Unix)
            if (/node_modules[/\\]react[/\\]/.test(id)) return 'vendor_react';
            if (/node_modules[/\\]react-dom[/\\]/.test(id)) return 'vendor_react_dom';
            if (/node_modules[/\\]scheduler[/\\]/.test(id)) return 'vendor_react_dom'; // scheduler must co-locate with react-dom
            if (/node_modules[/\\]styled-components[/\\]/.test(id)) return 'vendor_styled';
            if (/node_modules[/\\]framer-motion[/\\]/.test(id)) return 'vendor_framer';
            if (id.includes('react-router')) return 'vendor_router';
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
