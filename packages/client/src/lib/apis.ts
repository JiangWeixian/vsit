import { WBE_API_PATH, NODE_API_PATH, API_PARSE_IMPORTS } from 'vsit-shared/constants'
import { unStripEsmsh } from "./strip-esmsh"
import { withQuery } from "./utils"
import type { Pkg } from '../components/markdown'
import { ESM_SH_ORIGIN, NPM_ORIGIN } from './constants'

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
  },
  third: {
    async parseImports(code: string, filename: string): Promise<Pkg[]> {
      const url = API_PARSE_IMPORTS
      const data = await fetch(url, { method: 'POST', body: JSON.stringify({ code, filename }), headers: { 'Content-Type': 'application/json' } })
      return data.json()
    },
    async fetchPkgReadme(packageName: string): Promise<string> {
      const url = `${NPM_ORIGIN}/${packageName}`
      const res = await fetch(url)
      const data = await res.json()
      return data.readme
    },
  }
}