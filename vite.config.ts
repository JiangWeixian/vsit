import path from 'node:path'

import { svgrs } from '@svgr-rs/svgrs-plugin/vite'
import react from '@vitejs/plugin-react'
import {
  Decode,
  Encode,
  Hook,
} from 'console-feed'
import { fetch } from 'ofetch'
import { defineConfig } from 'vite'
import { VitePluginDocument } from 'vite-plugin-document'
import inspect from 'vite-plugin-inspect'
import pages from 'vite-plugin-pages'

import type { Plugin } from 'vite'

const ID = 'fake-node-file'
const RESOLVED_ID = `\0${ID}`
const REMOTE_RE = /^virtual:https:/
const HTTP_RE = /https?:\/\/esm\.sh/g
const content = `
import { uniq } from "virtual:https://esm.sh/lodash-es@4.17.21"
const a = uniq([1, 2, 3, 3])
globalThis.__hook(console, (log) => {
  globalThis.__viteDevServer.ws.send({
    type: 'custom',
    data: log,
    event: 'vit:custom',
  })
})
console.log(uniq)
`

const vit = (): Plugin[] => {
  return [
    {
      name: 'vit',
      configureServer(server) {
        globalThis.__viteDevServer = server
        globalThis.__encode = Encode
        globalThis.__decode = Decode
        globalThis.__hook = Hook
        server.middlewares.use(async (req, res, next) => {
          console.log('request', req.url)
          if (req.url === '/node-container') {
            try {
              await server.ssrLoadModule(ID)
              console.log(globalThis.__viteDevServer?.ws)
            } catch (e) {
              console.error(e)
            }
            res.end('ok')
            return
          }
          next()
        })
      },
      resolveId(id) {
        if (id === ID) {
          return RESOLVED_ID
        }
      },
      async load(id) {
        if (id === RESOLVED_ID) {
          return content
        }
      },
    },
    // {
    //   name: 'proxy-middleware',
    //   async resolveId(id) {
    //     if (id.startsWith('virtual:https://esm.sh')) {
    //       return id // Return the virtual URL as is
    //     }
    //   },
    //   async load(id) {
    //     if (id.startsWith('virtual:https://esm.sh')) {
    //       const url = id.replace('virtual:https://esm.sh', 'https://esm.sh')
    //       const response = await fetch(url)
    //       const code = await response.text()
    //       return code
    //     }
    //   },
    // },
    {
      name: 'remote-module',
      moduleParsed(info) {
        console.log('moduleParsed', info)
      },
      resolveId(id) {
        console.log('load', id)
        if (id.includes('esm.sh')) {
          // '\0' tell vite to not resolve this id via internal node resolver algorithm
          const resolvedId = `\0${id.replace('virtual:', '')}`
          console.log('resolveId', resolvedId)
          return {
            external: false,
            id: resolvedId,
          }
        }
      },
      async load(id) {
        console.log('load', id)
        // vite will remove duplicate slash
        if (id.slice(1).includes('esm.sh')) {
          const url = id.slice(1).replace('https:/', 'https://')
          console.log('load', url)
          const response = await fetch(url, { method: 'GET' })
          const code = await response.text()
          const resolvedCode = code.replace(HTTP_RE, 'virtual:https://esm.sh')
          // console.log('load code', resolvedCode)
          return {
            code: resolvedCode,
            moduleSideEffects: false,
          }
        }
      },
    },
  ]
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vit(),
    react(),
    pages(),
    svgrs(),
    VitePluginDocument(),
    !!process.env.VITE_INSPECT && inspect(),
  ],
  ssr: {
    noExternal: [HTTP_RE],
  },
  optimizeDeps: {
    force: true,
  },
  resolve: {
    alias: [
      {
        find: '@',
        replacement: path.resolve(__dirname, 'src'),
      },
      {
        find: 'https:',
        replacement: path.resolve(__dirname, 'src'),
      },
    ],
  },
})
