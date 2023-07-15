import { existsSync, removeSync } from 'fs-extra'
import { temporaryDirectory } from 'tempy'
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest'

import { LockFile } from '@/common/store/persist-cache'
import { computeCacheKey } from '@/common/store/utils'

describe('lock file', () => {
  let lockFile: LockFile
  const storePath = temporaryDirectory()
  beforeAll(async () => {
    lockFile = await LockFile.create({
      storePath,
    })
  })
  afterAll(() => {
    removeSync(storePath)
  })
  it('lock-file should exit after init', async () => {
    expect(existsSync(lockFile.options.lockFilePath)).toBe(true)
  })
  it('read lock-file should work', async () => {
    const content = await lockFile.read()
    expect(content).toBeDefined()
  })
  it('write lock-file should work', async () => {
    await lockFile.write({ version: '1.0.0' })
    const content = await lockFile.read()
    expect(content.version).toBe('1.0.0')
  })
  it('write packages should work', async () => {
    const url = 'https://esm.sh/lodash'
    await lockFile.writePackage('https://esm.sh/lodash')
    const key = computeCacheKey(url)
    const content = await lockFile.read()
    expect(content.packages?.[key]).toMatchSnapshot()
  })
  it('write packages should work', async () => {
    await lockFile.writePackages({
      'https://esm.sh/strip': {
        id: 'https://esm.sh/lodash',
        url: 'https://esm.sh/lodash',
        deps: [],
      },
    })
    const content = await lockFile.read()
    expect(content.packages?.['https://esm.sh/strip']).toMatchSnapshot()
  })
})
