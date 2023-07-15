import { join } from 'node:path'

import { withoutLeadingSlash, withoutTrailingSlash } from 'ufo'

import { pkgRoot } from './path'
import {
  ESM_HOST,
  ESMSH_HTTP_RE,
  ESMSH_HTTP_SUB_RE,
  ESMSH_PROTOCOL,
  ESMSH_PROTOCOL_RE,
  NULL_BYTE,
  NULL_BYTE_PLACEHOLDER,
  VALID_ID_PREFIX,
  VIRTUAL_RE,
} from './resolver/constants'
import { isEsmSh } from './resolver/is'
import { computeCacheKey } from './store/utils'

import type { ModuleNode } from 'vite'
import type { Package } from './store/persist-cache'

// '\0' tell vite to not resolve this id via internal node resolver algorithm
export const wrapId = (id: string) => {
  // esm.sh:xxx -> https://esm.sh/xxx
  if (ESMSH_PROTOCOL_RE.test(id)) {
    return `\0${id.replace(ESMSH_PROTOCOL_RE, ESM_HOST)}`
  }
  // /v126/xx -> https://esm.sh/v126/xx
  if (ESMSH_HTTP_SUB_RE.test(id)) {
    return `\0${ESM_HOST}${withoutLeadingSlash(id)}`
  }
  return id
}

export const unwrapId = (id: string) => {
  let stripId = id.replace(VIRTUAL_RE, '')
  // unwrap
  // https:/esm.sh -> https://esm.sh
  // esm.sh: -> https://esm.sh
  stripId = stripId
    .replace(VALID_ID_PREFIX, '')
    .replace(NULL_BYTE_PLACEHOLDER, '')
    .replace(NULL_BYTE, '')
    .replace(ESMSH_HTTP_RE, withoutTrailingSlash(ESM_HOST))
    .replace(ESMSH_PROTOCOL_RE, ESM_HOST)
  return stripId
}

// TODO: should use es-lexer and magic-string?
export const wrapCode = (code: string) => {
  return code.replace(new RegExp(ESM_HOST, 'gi'), ESMSH_PROTOCOL)
}

export const injectConsoleHook = (content: string) => {
  const entryOfVit = process.env.TEST ? 'vsit' : join(pkgRoot, 'dist/node.mjs')
  return `
import { consolehook } from "${entryOfVit}"
globalThis.__hook(consolehook, (log) => {
  console.log(log)
  globalThis.__viteDevServer.ws.send({
    type: 'custom',
    data: globalThis.__encode(log),
    event: 'vsit:custom',
  })
})
${content}
`
}

export const parseDeps = (deps: string[] = []) => {
  return deps
    .map((dep) => {
      return unwrapId(dep)
    })
    .filter((dep) => {
      return isEsmSh(dep)
    })
}

const createPackage = (url: string, deps: string[]): Record<string, Package> => {
  if (!url) {
    return {}
  }
  const id = computeCacheKey(url)
  return {
    [id]: {
      id,
      url,
      deps,
    },
  }
}

export const parseModulesDeps = (m?: ModuleNode): Record<string, Package> => {
  if (!m || !m.id) {
    return {}
  }
  const id = unwrapId(m.id)
  const deps = parseDeps(m.ssrTransformResult?.deps)
  let records = id && isEsmSh(id) && deps.length
    ? createPackage(id, deps)
    : {}
  m.importedModules.forEach((importedModule) => {
    const result = parseModulesDeps(importedModule)
    records = {
      ...records,
      ...result,
    }
  })
  return records
}
