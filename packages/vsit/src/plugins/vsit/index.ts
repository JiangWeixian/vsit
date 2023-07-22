import { performance } from 'node:perf_hooks'

import bodyparser from 'body-parser'
import Hook from 'console-feed/lib/Hook'
import { Encode } from 'console-feed/lib/Transform'
import { parseURL } from 'ufo'

import { NODE_API_PATH, WBE_API_PATH } from '../../../../shared/constants'
import { debug } from '@/common/log'
import { VIRUTAL_NODE_ID, VIRUTAL_WEB_ID } from '@/common/resolver/constants'
import { isEsmSh } from '@/common/resolver/is'
import { createStore } from '@/common/store'
import {
  injectConsoleHook,
  parseModulesDeps,
  unwrapId,
  wrapCode,
  wrapId,
} from '@/common/utils'

import type { AsyncReturnType } from 'type-fest'
import type { Plugin, ViteDevServer } from 'vite'

const invalid = async (moduleName: string, server: ViteDevServer) => {
  const module = await server.moduleGraph.getModuleByUrl(moduleName)
  module && server.moduleGraph.invalidateModule(module)
}

export const PluginVit = (): Plugin[] => {
  let content = ''
  let webContent = ''
  let store: AsyncReturnType<typeof createStore>
  return [
    {
      name: 'vsit:core',
      async configResolved() {
        store = await createStore()
      },
      configureServer(server) {
        // TODO: common middlewares or standalone vite plugin
        globalThis.__viteDevServer = server
        globalThis.__encode = Encode
        // globalThis.__decode = Decode
        globalThis.__hook = Hook
        server.middlewares.use(bodyparser.json())
        server.middlewares.use(async (req, res, next) => {
          const url = parseURL(req.url)
          if (url.pathname === WBE_API_PATH && req.method === 'POST') {
            webContent = req.body.content
            res.end('ok')
            return
          }
          if (url.pathname === WBE_API_PATH && req.method === 'GET') {
            // Invalid before transformRequest, make sure transformRequest get latest content from user
            await invalid(VIRUTAL_WEB_ID, server)
            webContent = (await server.transformRequest(VIRUTAL_WEB_ID, { ssr: false }))?.code ?? ''
            res.setHeader('Content-Type', 'text/javascript')
            res.end(webContent)
            return
          }
          if (url.pathname === NODE_API_PATH && req.method === 'POST') {
            const body = req.body
            content = injectConsoleHook(body.content)
            debug.plugin('update fake node file %s', content)
            res.end(content)
            return
          }
          if (url.pathname === NODE_API_PATH && req.method === 'GET') {
            try {
              // /fake-node-file?t=<timestamp>
              await server.ssrLoadModule(VIRUTAL_NODE_ID)
              const module = await server.moduleGraph.getModuleByUrl(VIRUTAL_NODE_ID)
              const packages = parseModulesDeps(module)
              store.cache.writePackages(packages)
              // console.log([...module?.ssrTransformResult?.values()][1], [...module?.importedModules?.values()][1].ssrTransformResult?.deps)
              if (module) {
                res.setHeader('Content-Type', 'text/javascript')
                res.end(module.ssrTransformResult?.code ?? '')
              } else {
                res.end('ok')
              }
              invalid(VIRUTAL_NODE_ID, server)
            } catch (e) {
              console.error(e)
            }
            return
          }
          next()
        })
      },
      resolveId(id) {
        // Should not add \0 to id, tell vite to transform it to js(if VIRUTAL_NODE_ID is ts)
        if (id === VIRUTAL_NODE_ID) {
          return VIRUTAL_NODE_ID
        }
        if (id === VIRUTAL_WEB_ID) {
          return VIRUTAL_WEB_ID
        }
        return null
      },
      async load(id) {
        if (id === VIRUTAL_NODE_ID) {
          return content
        }
        if (id === VIRUTAL_WEB_ID) {
          return webContent
        }
        return null
      },
    },
    {
      name: 'vsit:esmsh',
      resolveId(id) {
        if (isEsmSh(id)) {
          const resolvedId = wrapId(id)
          debug.plugin('resolved esmsh id from %s to %s', id, resolvedId, resolvedId[0])
          return resolvedId
        }
        return null
      },
      async load(id, options) {
        // vite will remove duplicate slash if id starts with 'https://'
        if (isEsmSh(id)) {
          if (!options?.ssr) {
            debug.plugin('skip load esmsh id %s on non-ssr mode', id)
            return ''
          }
          // un wrap
          const now = performance.now()
          const url = unwrapId(id)
          const code = await store.fetch(url)
          const resolvedCode = wrapCode(code)
          debug.benchmark('load url %s took', url, `${(performance.now() - now) / 1000}ms`)
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
