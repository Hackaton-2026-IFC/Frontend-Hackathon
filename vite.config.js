import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        id: 'com.hackathon-2026',
        name: 'Hackathon 2026',
        short_name: 'Hackathon',
        description: 'Aplicativo feito no hackathon 2026 no IFC Araquari',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/momentum-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/momentum-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/momentum-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
