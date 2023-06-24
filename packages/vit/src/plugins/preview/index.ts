import path from 'node:path'

import sirv from 'sirv'

import { pkgRoot } from '@/common/path'

import type { Plugin } from 'vite'

const clientDir = 'dist-client'
export const PluginPreview = (): Plugin => {
  return {
    name: 'vit:preview',
    configureServer(server) {
      const resolvedStaticPath = path.resolve(pkgRoot, clientDir)
      const client = sirv(resolvedStaticPath, { dev: true })
      server.middlewares.use('/', client)
    },
  }
}
