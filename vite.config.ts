import { createHash } from 'node:crypto'
import path from 'node:path'

import {
  Decode,
  Encode,
  Hook,
} from 'console-feed'
import { fetch } from 'ofetch'
import { parseURL, withoutLeadingSlash } from 'ufo'
import { defineConfig } from 'vite'
// import { VitePluginDocument } from 'vite-plugin-document'
import inspect from 'vite-plugin-inspect'
import solid from 'vite-plugin-solid'

import type { Plugin } from 'vite'

const ID = 'fake-node-file'
const RESOLVED_ID = `\0${ID}`
const REMOTE_RE = /^virtual:https:/
const HTTP_RE = /https?:\/\/esm\.sh/g
const content = `
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

const Cache = new Map()

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
          const url = parseURL(req.url)
          if (url.pathname === '/fake-node-file') {
            try {
              console.log('request', req.url)
              // /fake-node-file?t=<timestamp>
              await server.ssrLoadModule(withoutLeadingSlash(req.url))
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
        console.log('resolveId', id)
        if (id.startsWith('esm.sh:')) {
          // '\0' tell vite to not resolve this id via internal node resolver algorithm
          const resolvedId = `\0${id.replace('esm.sh:', 'https://esm.sh/')}`
          // console.log('resolveId', resolvedId)
          return {
            external: false,
            id: resolvedId,
          }
        }
        // esm.sh url will startswith v124 or v125
        if (id.startsWith('/v124/') || id.startsWith('/v125/')) {
          // '\0' tell vite to not resolve this id via internal node resolver algorithm
          // some files imported files from /v124/xxx not https://esm.sh/v124/xxx
          const resolvedId = `\0https://esm.sh${id}`
          // console.log('resolveId', resolvedId)
          return {
            external: false,
            id: resolvedId,
          }
        }
      },
      async load(id) {
        // vite will remove duplicate slash if id starts with 'https://'
        const stripId = id.slice(1)
        if (stripId.startsWith('esm.sh:') || stripId.startsWith('https://esm.sh') || stripId.startsWith('https:/esm.sh')) {
          // un wrap
          const url = stripId
            .replace('https:/', 'https://')
            .replace('esm.sh:', 'https://esm.sh/')
          const hash = createHash('sha256').update(url).digest('hex')
          if (Cache.get(hash)) {
            console.log('load cache', url)
            return {
              code: Cache.get(hash),
              moduleSideEffects: false,
            }
          }
          const response = await fetch(url, { method: 'GET' })
          const code = await response.text()
          // wrap
          const resolvedCode = code.replace(HTTP_RE, 'esm.sh:')
          console.log('load code', resolvedCode)
          Cache.set(hash, resolvedCode)
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
