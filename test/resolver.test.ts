import {
  describe,
  expect,
  it,
} from 'vitest'

import { isEsmSh } from '../src/lib/resolver/is'
import { unWrapId, wrapId } from '../src/lib/resolver/normalize'

describe('utils', () => {
  it('is esm.sh', () => {
    expect(isEsmSh('\0https://esm.sh/react')).toBe(true)
    expect(isEsmSh('https://esm.sh/react')).toBe(true)
    expect(isEsmSh('https:/esm.sh/react')).toBe(true)
    expect(isEsmSh('esm.sh:react')).toBe(true)
    expect(isEsmSh('/v126/react')).toBe(true)
    expect(isEsmSh('/v126/ansi-regex@6.0.1/esnext/ansi-regex.mjs')).toBe(true)
  })
  it('resolve path to url', () => {
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
})
