import { createHash } from 'node:crypto'
import { performance } from 'node:perf_hooks'

import Debug from 'debug'
import { fetch } from 'ofetch'

const debug = Debug('vit:store')

export const createStore = () => {
  const pool = new Map<string, Promise<string>>()
  const globalCache = new Map<string, string>()
  const createInstance = (id: string, url: string, options?: RequestInit) => {
    const promise = (async () => {
      try {
        const now = performance.now()
        return fetch(url, options)
          .then(async (res) => {
            const content = await res.text()
            globalCache.set(id, content)
            pool.delete(id)
            debug('load url %s took', url, `${(performance.now() - now) / 1000}ms`)
            return content
          })
      } catch (e) {
        // TODO: add retry
        console.error(e)
        return Promise.reject(e)
      }
    })()
    return promise
  }
  return {
    async clear(url: string) {
      const hash = createHash('sha256').update(url).digest('hex')
      globalCache.delete(hash)
      pool.delete(hash)
    },
    async fetch(url: string, options?: RequestInit) {
      debug('start fetch %s', url)
      const hash = createHash('sha256').update(url).digest('hex')
      const cache = globalCache.get(hash)
      if (cache) {
        debug('load cache %s', url)
        return Promise.resolve(cache)
      }
      let instance = pool.get(hash)
      if (instance) {
        return instance
      }
      instance = createInstance(hash, url, options)
      instance && pool.set(hash, instance)
      return instance
    },
  }
}
