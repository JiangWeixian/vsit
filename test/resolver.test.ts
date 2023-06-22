import {
  describe,
  expect,
  it,
} from 'vitest'

import { isEsmSh } from '../src/lib/resolver/is'
import {
  unWrapId,
  wrapCode,
  wrapId,
} from '../src/lib/resolver/normalize'

describe('utils', () => {
  it('is esm.sh', () => {
    expect(isEsmSh('\0https://esm.sh/react')).toBe(true)
    expect(isEsmSh('https://esm.sh/react')).toBe(true)
    expect(isEsmSh('https:/esm.sh/react')).toBe(true)
    expect(isEsmSh('esm.sh:react')).toBe(true)
    expect(isEsmSh('/v126/react')).toBe(true)
    expect(isEsmSh('/v126/ansi-regex@6.0.1/esnext/ansi-regex.mjs')).toBe(true)
  })
})

describe('normalize', () => {
  it('wrap id', () => {
    expect(wrapId('esm.sh:react')).toBe('\0https://esm.sh/react')
    expect(wrapId('/v126/react')).toBe('\0https://esm.sh/v126/react')
  })

  it('unwrap id(maybe virtual) to url', () => {
    expect(unWrapId('esm.sh:react')).toBe('https://esm.sh/react')
    expect(unWrapId('https:/esm.sh/react')).toBe('https://esm.sh/react')
    expect(unWrapId('https://esm.sh/react')).toBe('https://esm.sh/react')
    expect(unWrapId('\0esm.sh:react')).toBe('https://esm.sh/react')
    expect(unWrapId('\0https:/esm.sh/react')).toBe('https://esm.sh/react')
  })

  it('wrap code', () => {
    expect(wrapCode(`
import { uniq } from "https://esm.sh/lodash-es@4.17.21"
import stripAnsi from "https://esm.sh/strip-ansi@7.1.0"
    `)).toBe(`
import { uniq } from "esm.sh:lodash-es@4.17.21"
import stripAnsi from "esm.sh:strip-ansi@7.1.0"
    `)
  })
})
