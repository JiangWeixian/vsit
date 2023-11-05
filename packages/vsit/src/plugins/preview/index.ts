import path from 'node:path'

import sirv from 'sirv'

import { pkgRoot } from '@/common/path'

import type { Plugin } from 'vite'

const clientDir = 'dist-client'
const resolvedClientDir = path.resolve(pkgRoot, clientDir)
export const PluginPreview = (): Plugin => {
  return {
    name: 'vsit:preview',
    config() {
      return {
        // if prod, use dist-client as root
        root: resolvedClientDir,
        // prevent throw pre-bundling warnings on preview and prod
        optimizeDeps: {
          disabled: true,
        },
      }
    },
    configureServer(server) {
      const client = sirv(resolvedClientDir, { dev: true })
      server.middlewares.use('/', client)
    },
  }
}
