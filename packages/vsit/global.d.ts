import type { Encode, Hook } from 'console-feed'
import type { ViteDevServer } from 'vite'

declare global {
  // eslint-disable-next-line vars-on-top, no-var
  var __viteDevServer: ViteDevServer | undefined
  // eslint-disable-next-line vars-on-top, no-var
  var __hook: Hook
  // eslint-disable-next-line vars-on-top, no-var
  var __encode: Encode
}

export {}
