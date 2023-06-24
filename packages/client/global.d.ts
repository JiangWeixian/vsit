import type { ViteDevServer } from 'vite'

declare global {
  // eslint-disable-next-line vars-on-top, no-var
  var __viteDevServer: ViteDevServer | undefined
}

export {}
