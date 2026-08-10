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
        target: process.env.CV_AI_PROXY_TARGET || 'https://mrag7hkw11.execute-api.ap-southeast-1.amazonaws.com/prod',
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
        target: 'https://ygabt1q860.execute-api.ap-southeast-1.amazonaws.com/prod',
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
        target: 'https://fhkig55p32.execute-api.ap-southeast-1.amazonaws.com/prod',
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
        target: 'https://mrag7hkw11.execute-api.ap-southeast-1.amazonaws.com/prod',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-lambda-candidates/, ''),
        secure: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
          });
        }
      },
      '/api-lambda-applications': {
        target: 'https://x1yrkadmaa.execute-api.ap-southeast-1.amazonaws.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-lambda-applications/, '/prod'),
        secure: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
          });
        }
      },
      '/api-cv': {
        target: 'https://w2yc3x4mw8.execute-api.ap-southeast-1.amazonaws.com/prod',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-cv/, ''),
        secure: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // API Gateway protects every CV route with the Cognito JWT authorizer.
            // Vite's changeOrigin can drop the browser Authorization header, so
            // explicitly forward the Bearer token to the upstream API.
            proxyReq.removeHeader('authorization');
            proxyReq.removeHeader('Authorization');
            const auth = req.headers.authorization || req.headers.Authorization;
            if (auth) proxyReq.setHeader('Authorization', auth);
          });
        }
      },
      '/api-applications': {
        target: 'https://x1yrkadmaa.execute-api.ap-southeast-1.amazonaws.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-applications/, '/prod/applications'),
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
        target: 'https://mrag7hkw11.execute-api.ap-southeast-1.amazonaws.com/prod',
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
      // Candidate profile API. The API Gateway currently returns NO CORS
      // headers, so authenticated browser requests (which trigger a preflight because of
      // the Authorization header) are blocked. Routing through this same-origin dev proxy
      // avoids CORS entirely so candidate profiles load/save in local development.
      // NOTE: This only fixes DEV. In production the API Gateway CORS must be re-enabled.
      '/api-profile': {
        target: 'https://mrag7hkw11.execute-api.ap-southeast-1.amazonaws.com/prod',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-profile/, ''),
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
      // Candidate experience API. Proxying in DEV avoids the deployed API's
      // missing CORS headers for authenticated browser requests.
      '/api-experience': {
        target: 'https://eifv256cee.execute-api.ap-southeast-1.amazonaws.com/prod',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-experience/, ''),
        secure: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            const auth = req.headers['authorization'] || req.headers['Authorization'];
            if (auth) proxyReq.setHeader('Authorization', auth);
          });
        }
      },
      '/api-ekyc': {
        target: 'https://mrag7hkw11.execute-api.ap-southeast-1.amazonaws.com/prod',
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
      '/api-packages': {
        target: 'https://u7lp3ox2e5.execute-api.ap-southeast-1.amazonaws.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-packages/, ''),
        secure: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
          });
        }
      },
      '/api-quick-jobs': {
        target: 'https://i3ce0izl59.execute-api.ap-southeast-1.amazonaws.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-quick-jobs/, '/prod'),
        secure: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
          });
        }
      },
      '/api-notifications': {
        target: 'https://o8dkf6kx7b.execute-api.ap-southeast-1.amazonaws.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-notifications/, ''),
        secure: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            const auth = req.headers['authorization'] || req.headers['Authorization'];
            if (auth) proxyReq.setHeader('Authorization', auth);
          });
        }
      },
      // QUAN TRỌNG: '/api' phải đứng CUỐI CÙNG vì nó match tất cả path bắt đầu bằng /api
      // (bao gồm cả /api-applications, /api-cv, v.v.). Vite proxy dùng first-match,
      // nên các rule cụ thể hơn phải đứng trước rule chung '/api'.
      '/api': {
        target: 'https://mrag7hkw11.execute-api.ap-southeast-1.amazonaws.com/prod',
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
