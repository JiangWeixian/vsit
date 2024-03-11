import { NODE_API_PATH } from "vsit"
import { DEFAULT_PORT } from "./constants"

export const withQuery = (pathname: string) => {
  const params = { t: Date.now().toString() }
  const search = new URLSearchParams(params)
  return `${pathname}?${search}`
}

interface NormalizeOptions {
  port: number | string
  pathname: string
}

export const normalizeUrl = ({ port = DEFAULT_PORT, ...options }: NormalizeOptions = { port: DEFAULT_PORT, pathname: NODE_API_PATH }) => {
  return withQuery(`http://localhost:${port}${options.pathname}`)
}