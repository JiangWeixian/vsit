import { ESMSH_HTTP_RE, ESMSH_HTTP_SUB_RE, ESMSH_PROTOCOL_RE, VIRTUAL_RE } from './constants'

export const isEsmSh = (id: string) => {
  const stripId = id.replace(VIRTUAL_RE, '')
  return ESMSH_HTTP_RE.test(stripId) || ESMSH_PROTOCOL_RE.test(stripId) || ESMSH_HTTP_SUB_RE.test(stripId)
}
