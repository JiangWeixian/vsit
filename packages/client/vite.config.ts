import path from 'node:path'

import { defineConfig } from 'vite'
// import { VitePluginDocument } from 'vite-plugin-document'
import inspect from 'vite-plugin-inspect'
// import { VitePWA } from 'vite-plugin-pwa'
import solid from 'vite-plugin-solid'
import { vsit } from 'vsit'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vsit(),
    solid(),
    // Use injectManifest just cache from esm.sh
    // VitePWA({
    //   srcDir: 'src',
    //   filename: 'sw.ts',
    //   strategies: 'injectManifest',
    //   injectRegister: false,
    //   manifest: false,
    //   devOptions: {
    //     enabled: false,
    //     type: 'module',
    //   },
    //   injectManifest: {
    //     injectionPoint: undefined,
    //   },
    // }),
    // Not working in solidjs
    // pages(),
    // svgrs(),
    // VitePluginDocument({ solidjs: true }),
    !!process.env.VITE_INSPECT && inspect(),
  ],
  build: {
    minify: false,
    outDir: 'dist-client',
  },
  resolve: {
    alias: [
      {
        find: '@',
        replacement: path.resolve(__dirname, 'src'),
      },
    ],
  },
  define: {
    'process.env.IS_CLIENT': JSON.stringify(false),
  },
})
