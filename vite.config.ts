import path from 'node:path'

import bodyparser from 'body-parser'
import {
  Decode,
  Encode,
  Hook,
} from 'console-feed'
import { parseURL, withoutLeadingSlash } from 'ufo'
import { PluginVit } from 'vit'
import { defineConfig } from 'vite'
// import { VitePluginDocument } from 'vite-plugin-document'
import inspect from 'vite-plugin-inspect'
import solid from 'vite-plugin-solid'

import { isEsmSh } from './packages/vit/src/common/resolver/is'
import {
  unWrapId,
  wrapCode,
  wrapId,
} from './packages/vit/src/common/resolver/normalize'
import { createStore } from './packages/vit/src/common/store'

import type { Plugin } from 'vite'

const store = createStore()
const ID = 'fake-node-file'
const RESOLVED_ID = `\0${ID}`
const REMOTE_RE = /^virtual:https:/
const HTTP_RE = /https?:\/\/esm\.sh/g
let content = `
import { consolehook } from "./src/lib/consolehook"
import { uniq } from "esm.sh:lodash-es@4.17.21"
import stripAnsi from "esm.sh:strip-ansi@7.1.0"

const a = uniq([1, 2, 3, 3])
const b = stripAnsi('\u001B[4mUnicorn\u001B[0m');
globalThis.__hook(consolehook, (log) => {
  console.log(log)
  globalThis.__viteDevServer.ws.send({
    type: 'custom',
    data: globalThis.__encode(log),
    event: 'vit:custom',
  })
})
consolehook.log(a, b, uniq)
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
        server.middlewares.use(bodyparser.json())
        server.middlewares.use(async (req, res, next) => {
          const url = parseURL(req.url)
          if (url.pathname === '/update-fake-node-file' && req.method === 'POST') {
            const body = (req as any).body as { content: string }
            content = `
import { consolehook } from "./src/lib/consolehook"
globalThis.__hook(consolehook, (log) => {
  console.log(log)
  globalThis.__viteDevServer.ws.send({
    type: 'custom',
    data: globalThis.__encode(log),
    event: 'vit:custom',
  })
})
${body.content}
            `
            res.end('ok')
            return
          }
          if (url.pathname === '/fake-node-file' && req.method === 'GET') {
            try {
              // console.log('request', req.url)
              // /fake-node-file?t=<timestamp>
              await server.ssrLoadModule(withoutLeadingSlash(req.url))
              const module = await server.moduleGraph.getModuleByUrl(withoutLeadingSlash(req.url))
              module && server.moduleGraph.invalidateModule(module)
              // console.log(module)
              // console.log(globalThis.__viteDevServer?.ws)
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
      resolveId(id) {
        // console.log('resolveId', id)
        if (isEsmSh(id)) {
          const resolvedId = wrapId(id)
          // console.log('resolveId', resolvedId)
          return {
            external: false,
            id: resolvedId,
          }
        }
      },
      async load(id) {
        // vite will remove duplicate slash if id starts with 'https://'
        if (isEsmSh(id)) {
          // un wrap
          const url = unWrapId(id)
          const code = await store.fetch(url)
          const resolvedCode = wrapCode(code)
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
    // vit(),
    PluginVit(),
    solid(),
    // react(),
    // Not working in solidjs
    // pages(),
    // svgrs(),
    // VitePluginDocument({ solidjs: true }),
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
