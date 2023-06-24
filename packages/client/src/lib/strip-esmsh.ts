const HTTP_RE = /https?:\/\/esm\.sh/g

export const stripEsmsh = (code: string) => {
  return code.replace(HTTP_RE, 'esm.sh:')
}

export const unStripEsmsh = (code: string) => {
  return code.replace(/esm\.sh:/g, 'https://esm.sh/')
}