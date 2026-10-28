import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

function registerSW() {
  if (process.env.NODE_ENV === "production") {
    return {
      pages: ["/"],
    };
  }
}

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
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'motion-vendor': ['motion'],
            'ui-vendor': ['lucide-react'],
          },
        },
        external: ['express', 'helmet', 'express-rate-limit', 'compression', '@upstash/redis'],
      },
      chunkSizeWarningLimit: 1000,
      sourcemap: false,
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    ...registerSW(),
  };
});
