import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return;
            }

            if (id.includes('react-dom') || id.includes(`${path.sep}react${path.sep}`)) {
              return 'react-core';
            }

            if (id.includes('react-leaflet') || id.includes('leaflet')) {
              return 'maps-leaflet';
            }

            if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('dompurify')) {
              return 'pdf-tools';
            }

            if (id.includes('motion')) {
              return 'motion';
            }

            if (id.includes('lucide-react')) {
              return 'icons';
            }
          },
        },
      },
    },
    server: {
      host: '127.0.0.1',
      port: 3000,
      allowedHosts: ['xn--80aesikbz2g.xn--p1ai', '213.219.212.186', 'localhost'],
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
