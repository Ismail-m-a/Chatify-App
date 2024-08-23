import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePluginStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    react(),
    VitePluginStaticCopy({
      targets: [
        {
          src: '_redirects', // The file in the root of your project
          dest: '.' // Copies to the root of the dist folder
        }
      ]
    })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://chatify-api.up.railway.app',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
