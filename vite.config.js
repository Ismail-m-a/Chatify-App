import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy'; // Make sure this matches the correct export name

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
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
