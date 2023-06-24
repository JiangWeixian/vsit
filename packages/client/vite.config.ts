import path from 'node:path'

import { defineConfig } from 'vite'
// import { VitePluginDocument } from 'vite-plugin-document'
import inspect from 'vite-plugin-inspect'
import solid from 'vite-plugin-solid'
import { PluginVit } from 'vsit'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    PluginVit(),
    solid(),
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
