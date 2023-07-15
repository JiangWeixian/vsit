import { createHash } from 'node:crypto'

export const computeCacheKey = (url: string) => {
  const hash = createHash('sha256').update(url).digest('hex')
  return hash
}
