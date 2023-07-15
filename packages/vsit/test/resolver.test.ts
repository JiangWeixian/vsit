import {
  describe,
  expect,
  it,
} from 'vitest'

import { isEsmSh } from '@/common/resolver/is'

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
