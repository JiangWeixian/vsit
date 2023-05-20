import path from 'node:path'

import { svgrs } from '@svgr-rs/svgrs-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePluginDocument } from 'vite-plugin-document'
import inspect from 'vite-plugin-inspect'
import pages from 'vite-plugin-pages'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), pages(), svgrs(), VitePluginDocument(), !!process.env.VITE_INSPECT && inspect()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
