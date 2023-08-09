import {
  describe,
  expect,
  it,
} from 'vitest'

import { isEsmSh } from '@/common/resolver/is'
import {
  injectConsoleHook,
  parseDeps,
  transform,
  unwrapId,
  wrapCode,
  wrapId,
} from '@/common/utils'

describe('string', () => {
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
    expect(injectConsoleHook('console.log("injected")')).toMatchInlineSnapshot(`
    "
    import { consolehook } from \\"vsit\\"
    globalThis.__hook(consolehook, (log) => {
      console.log(log)
      globalThis.__viteDevServer.ws.send({
        type: 'custom',
        data: globalThis.__encode(log),
        event: 'vsit:custom',
      })
    })
    console.log(\\"injected\\")
    "
    `)
  })

  describe('transform', () => {
    it('node file', () => {
      expect(transform('console.log("injected")', 'node')).toMatchInlineSnapshot(`
      "
      import { consolehook } from \\"vsit\\"
      globalThis.__hook(consolehook, (log) => {
        console.log(log)
        globalThis.__viteDevServer.ws.send({
          type: 'custom',
          data: globalThis.__encode(log),
          event: 'vsit:custom',
        })
      })
      consolehook.log(\\"injected\\")
      "
      `)
    })
    it('web file', () => {
      expect(transform('console.log("injected")', 'web')).toMatchInlineSnapshot('"consolehook.log(\\"injected\\")"')
    })
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
