import { createRequire } from 'node:module'
import { dirname } from 'node:path'

const require = createRequire(import.meta.url)

export const pkgRoot = dirname(require.resolve('vit/package.json'))
