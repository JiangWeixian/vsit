import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { execaNode } from 'execa'
import {
  describe,
  expect,
  it,
} from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))

const cli = path.resolve(__dirname, '../bin/index.mjs')

describe('version', () => {
  it('print version should work', async () => {
    const { stdout } = await execaNode(cli, ['-v'])
    expect(stdout).toBeDefined()
  })
})
