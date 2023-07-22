
export const withQuery = (pathname: string) => {
  const params = { t: Date.now().toString() }
  const search = new URLSearchParams(params)
  return `${pathname}?${search}`
}