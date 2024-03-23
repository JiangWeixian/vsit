import type { Encode, Hook } from 'console-feed'

declare global {
  // eslint-disable-next-line vars-on-top, no-var
  var __rpc: {
    send: (log: any) => void
  }
  // eslint-disable-next-line vars-on-top, no-var
  var __hook: Hook
  // eslint-disable-next-line vars-on-top, no-var
  var __encode: Encode
}

export {}
