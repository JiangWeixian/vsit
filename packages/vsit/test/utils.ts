import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  injectConsoleHook,
  parseDeps,
  unwrapId,
  wrapCode,
  wrapId,
} from '@/common/utils'

describe('normalize', () => {
  it('wrap id', () => {
    expect(wrapId('esm.sh:react')).toBe('\0https://esm.sh/react')
    expect(wrapId('/v126/react')).toBe('\0https://esm.sh/v126/react')
  })

  it('unwrap id(maybe virtual) to url', () => {
    expect(unwrapId('esm.sh:react')).toBe('https://esm.sh/react')
    expect(unwrapId('https:/esm.sh/react')).toBe('https://esm.sh/react')
    expect(unwrapId('https://esm.sh/react')).toBe('https://esm.sh/react')
    expect(unwrapId('\0esm.sh:react')).toBe('https://esm.sh/react')
    expect(unwrapId('\0https:/esm.sh/react')).toBe('https://esm.sh/react')
    expect(unwrapId('/@id/__x00__https:/esm.sh/lodash-es@4.17.21')).toBe('https://esm.sh/lodash-es@4.17.21')
  })

  it('wrap code', () => {
    expect(wrapCode(`
import { uniq } from "https://esm.sh/lodash-es@4.17.21"
import stripAnsi from "https://esm.sh/strip-ansi@7.1.0"
    `)).toMatchSnapshot()
  })

  it('inject console hook on node file', () => {
    expect(injectConsoleHook('console.log(\'injected\')')).toMatchSnapshot()
  })
})

describe('parse', () => {
  it('parse deps', () => {
    const deps = parseDeps([
      '/@fs/path/node.mjs',
      '/@id/__x00__https:/esm.sh/lodash-es@4.17.21',
      '/@id/__x00__https:/esm.sh/strip-ansi@7.1.0',
    ])
    expect(deps).toMatchObject([
      'https://esm.sh/lodash-es@4.17.21',
      'https://esm.sh/strip-ansi@7.1.0',
    ])
  })
})
