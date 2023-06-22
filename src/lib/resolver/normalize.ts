import { ESMSH_PROTOCOL_RE, ESMSH_HTTP_SUB_RE, ESMSH_HTTP_RE, ESM_HOST, VIRTUAL_RE, ESMSH_PROTOCOL } from "./constants"
import { withoutLeadingSlash, withoutTrailingSlash } from 'ufo'

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

export const unWrapId = (id: string) => {
  let stripId = id.replace(VIRTUAL_RE, '')
  // unwrap
  // https:/esm.sh -> https://esm.sh
  // esm.sh: -> https://esm.sh
  stripId = stripId
    .replace(ESMSH_HTTP_RE, withoutTrailingSlash(ESM_HOST))
    .replace(ESMSH_PROTOCOL_RE, ESM_HOST)
  return stripId
}

// TODO: should use es-lexer and magic-string?
export const wrapCode = (code: string) => {
  return code.replace(new RegExp(ESM_HOST, 'gi'), ESMSH_PROTOCOL)
}