import { createHash } from 'node:crypto'

import { fetch } from 'ofetch'

import { PersistCache } from './persist-cache'
import { debug } from '@/common/log'

export const createStore = async () => {
  const pool = new Map<string, Promise<string>>()
  const cacheManager = await PersistCache.create()
  const createInstance = (id: string, url: string, options?: RequestInit) => {
    const promise = (async () => {
      try {
        debug.store('start fetch %s', url)
        return fetch(url, options)
          .then(async (res) => {
            const content = await res.text()
            cacheManager.saveCache(url, content)
            pool.delete(id)
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
    cache: cacheManager,
    async clear(url: string) {
      const hash = createHash('sha256').update(url).digest('hex')
      pool.delete(hash)
    },
    async fetch(url: string, options?: RequestInit) {
      const hash = createHash('sha256').update(url).digest('hex')
      const cache = await cacheManager.getCache(url)
      if (cache) {
        debug.store('load cache %s', url)
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
