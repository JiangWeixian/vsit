import path from 'node:path'

import { PluginVit } from 'vit'
import { defineConfig } from 'vite'
// import { VitePluginDocument } from 'vite-plugin-document'
import inspect from 'vite-plugin-inspect'
import solid from 'vite-plugin-solid'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    PluginVit(),
    solid(),
    // react(),
    // Not working in solidjs
    // pages(),
    // svgrs(),
    // VitePluginDocument({ solidjs: true }),
    !!process.env.VITE_INSPECT && inspect(),
  ],
  resolve: {
    alias: [
      {
        find: '@',
        replacement: path.resolve(__dirname, 'src'),
      },
    ],
  },
})
