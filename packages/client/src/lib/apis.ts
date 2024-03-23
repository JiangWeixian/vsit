import { WBE_API_PATH, NODE_API_PATH } from 'vsit'
import { unStripEsmsh } from "./strip-esmsh"
import { normalizeUrl, withQuery } from "./utils"
import { DEFAULT_PORT } from './constants'

export const apis = {
  web: {
    async update(content: string) {
      const url = normalizeUrl({ pathname: WBE_API_PATH, port: window.vsit.port })
      await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
          content: unStripEsmsh(content),
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
    },
  },
  node: {
    async update(content: string) {
      const url = normalizeUrl({ pathname: WBE_API_PATH, port: window.vsit.port })
      await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
          content,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
    },
    async get() {
      const url = normalizeUrl({ pathname: NODE_API_PATH, port: window.vsit.port })
      fetch(url, { method: 'GET' })
    }
  }
}