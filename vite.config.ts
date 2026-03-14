<<<<<<< HEAD
﻿import tailwindcss from '@tailwindcss/vite';
=======
import tailwindcss from '@tailwindcss/vite';
>>>>>>> 3e7c06101ba417f843f3e83877eb3fc4c12bbb84
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
<<<<<<< HEAD
server: {
      // --- ДОБАВЛЕНО ДЛЯ РАБОТЫ ЧЕРЕЗ IIS ---
      host: '127.0.0.1', // Явно указываем слушать локальный адрес
      port: 3000,
      allowedHosts: [
        'xn--80aesikbz2g.xn--p1ai', // навикрым.рф
        '213.219.212.186',
        'localhost'
      ],
      // --------------------------------------
      
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
=======
    server: {
      // Added for IIS proxying.
      host: '127.0.0.1',
      port: 3000,
      allowedHosts: ['xn--80aesikbz2g.xn--p1ai', '213.219.212.186', 'localhost'],
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify-file watching is disabled to prevent flickering during agent edits.
>>>>>>> 3e7c06101ba417f843f3e83877eb3fc4c12bbb84
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
