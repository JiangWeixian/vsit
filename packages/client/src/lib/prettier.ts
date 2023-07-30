import type { Options } from 'prettier'
import { VIRUTAL_WEB_ID } from './constants'

const defaultOptions: Options = {
  semi: false,
  singleQuote: false,
  jsxSingleQuote: false,
  filepath: VIRUTAL_WEB_ID,
  parser: 'typescript',
}

export const format = async (content: string) => {
  const prettier = await import('prettier/standalone')
  const plugins = await Promise.all([
    await import('prettier/plugins/typescript'),
    // @ts-expect-error -- ignore
    await import('prettier/plugins/estree'),
  ])
  return prettier.format(content, { ...defaultOptions, plugins: (defaultOptions.plugins ?? []).concat(plugins) })
}