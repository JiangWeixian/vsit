import { WBE_API_PATH, NODE_API_PATH } from 'vist-shared/constants'
import { unStripEsmsh } from "./strip-esmsh"
import { withQuery } from "./utils"

export const apis = {
  web: {
    async update(content: string) {
      const url = withQuery(WBE_API_PATH)
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
      const url = withQuery(NODE_API_PATH)
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
      const url = withQuery(NODE_API_PATH)
      fetch(url, { method: 'GET' })
    }
  }
}