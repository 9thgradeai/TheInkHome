import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import fs from 'fs';

export default defineConfig(() => {
  return {
    base: '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
        },
        external: ['@upstash/redis', 'express', 'helmet', 'express-rate-limit'],
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true' ? { port: 0 } as any : false,
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      strictPort: false,
    },
  };
});
