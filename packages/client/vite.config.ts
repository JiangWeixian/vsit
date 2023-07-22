import path from 'node:path'

import { defineConfig } from 'vite'
// import { VitePluginDocument } from 'vite-plugin-document'
import inspect from 'vite-plugin-inspect'
import { VitePWA } from 'vite-plugin-pwa'
import solid from 'vite-plugin-solid'
import { PluginVit } from 'vsit'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    PluginVit(),
    solid(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'generateSW',
      selfDestroying: process.env.NODE_ENV === 'development',
      devOptions: {
        enabled: true,
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/esm\.sh\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'esm-sh',
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
    // Not working in solidjs
    // pages(),
    // svgrs(),
    // VitePluginDocument({ solidjs: true }),
    !!process.env.VITE_INSPECT && inspect(),
  ],
  build: {
    minify: false,
  },
  resolve: {
    alias: [
      {
        find: '@',
        replacement: path.resolve(__dirname, 'src'),
      },
    ],
  },
})
