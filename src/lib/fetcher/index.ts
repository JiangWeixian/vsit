import { fetch } from 'ofetch'

export const createFetcher = () => {
  const pool = new Map<string, Promise<string>>()
  const globalCache = new Map<string, string>()
  const createInstance = (url: string, options?: RequestInit) => {
    const promise = (async () => {
      try {
        return fetch(url, options)
          .then(async res => {
            const content = await res.text()
            globalCache.set(url, content)
            pool.delete(url)
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
      globalCache.delete(url)
      pool.delete(url)
    },
    async fetch(url: string, options?: RequestInit) {
      const cache = globalCache.get(url)
      if (cache) {
        return Promise.resolve(cache)
      }
      let instance = pool.get(url)
      if (instance) {
        return instance
      }
      instance = createInstance(url, options)
      instance && pool.set(url, instance)
      return instance
    }
  }
}
