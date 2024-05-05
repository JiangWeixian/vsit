import { compact } from 'lodash-es'
import rs from 'rs-module-lexer'

import { ESM_PROTOCOL_PKG_RE } from './resolver/constants'

const parsePkgInfo = (id?: string) => {
  if (!id) {
    return
  }
  const matches = id.match(ESM_PROTOCOL_PKG_RE)
  if (!matches) {
    return
  }
  const [_, name, version] = matches
  return {
    name,
    version,
  }
}

export const parseImports = (code: string, filename: string) => {
  try {
    const result = rs.parse({
      input: [
        {
          filename,
          code,
        },
      ],
    })
    const imports = compact(
      result.output
        .map((output) => {
          return output.imports.map(i => i.n)
        })
        .flat()
        .map(id => parsePkgInfo(id)),
    )
    return imports
  } catch (err) {
    console.log('parse error: ', err)
    return []
  }
}
