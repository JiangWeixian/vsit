import bodyparser from 'body-parser'
import { Hook } from 'console-feed'
import { parseURL, withoutLeadingSlash } from 'ufo'

import { RESOLVED_NODE_ID, VIRUTAL_NODE_ID } from '@/common/resolver/constants'
import { isEsmSh } from '@/common/resolver/is'
import {
  unWrapId,
  wrapCode,
  wrapId,
} from '@/common/resolver/normalize'
import { createStore } from '@/common/store'

import type { Plugin } from 'vite'

export const vit = (): Plugin[] => {
  let content = ''
  const store = createStore()
  return [
    {
      name: 'vit:core',
      configureServer(server) {
        globalThis.__viteDevServer = server
        // globalThis.__encode = Encode
        // globalThis.__decode = Decode
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
        if (id === VIRUTAL_NODE_ID) {
          return RESOLVED_NODE_ID
        }
        return null
      },
      async load(id) {
        if (id === RESOLVED_NODE_ID) {
          return content
        }
        return id
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
        return null
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
        return null
      },
    },
  ]
}
