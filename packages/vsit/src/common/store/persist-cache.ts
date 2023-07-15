import { resolve } from 'node:path'

import {
  existsSync,
  outputFile,
  readFile,
} from 'fs-extra'
import readYaml from 'read-yaml-file'
import writeYaml from 'write-yaml-file'

import { version } from '../../../package.json'
import {
  LOCK_FILE,
  STORE_PACKAGES_DIR,
  STORE_PATH,
} from './constants'
import { computeCacheKey } from './utils'
import { debug } from '@/common/log'

interface Options {
  storePath?: string
}

interface ResolvedLockFileOptions {
  storePath: string
  lockFilePath: string
}

export interface Package {
  id: string
  url: string
  deps?: string[]
}

interface LockFileYaml {
  version: string
  packages?: Record<string, Package>
}

export class LockFile {
  options: ResolvedLockFileOptions
  lockFile: LockFileYaml = { version }
  constructor(options: Options) {
    this.options = this.resolveOptions(options)
    debug.store('resolved lock-file options %o', this.options)
  }

  resolveOptions(options: Options): ResolvedLockFileOptions {
    const resolvedStorePath = options.storePath ?? STORE_PATH
    return {
      storePath: resolvedStorePath,
      lockFilePath: resolve(resolvedStorePath, LOCK_FILE),
    }
  }

  async init() {
    if (!existsSync(this.options.lockFilePath)) {
      await writeYaml(this.options.lockFilePath, { version })
    }
    await this.read()
  }

  async read(): Promise<LockFileYaml> {
    this.lockFile = await readYaml(this.options.lockFilePath)
    return this.lockFile as LockFileYaml
  }

  async write(data: LockFileYaml): Promise<void> {
    await writeYaml(this.options.lockFilePath, data)
  }

  async save() {
    await writeYaml(this.options.lockFilePath, this.lockFile)
  }

  async writePackage(url: string, deps: string[] = []) {
    const id = computeCacheKey(url)
    this.lockFile.packages = {
      ...this.lockFile.packages,
      [id]: {
        id,
        url,
        deps,
      },
    }
    await this.save()
  }

  async writePackages(packages: Record<string, Package> = {}) {
    this.lockFile.packages = {
      ...this.lockFile.packages,
      ...packages,
    }
    await this.save()
  }

  static async create(options: Options) {
    const instance = new LockFile(options)
    await instance.init()
    return instance
  }
}

interface ResolvedCacheOptions {
  storePath: string
  packagesPath: string
}

export class PersistCache {
  options: ResolvedCacheOptions
  lockFile?: LockFile
  constructor(options: Options = { storePath: STORE_PATH }) {
    this.options = this.resolveOptions(options)
    this.lockFile = undefined
  }

  resolveOptions(options: Options): ResolvedCacheOptions {
    const resolvedStorePath = options.storePath ?? STORE_PATH
    return {
      storePath: resolvedStorePath,
      packagesPath: resolve(resolvedStorePath, STORE_PACKAGES_DIR),
    }
  }

  static async create(options: Options = { storePath: STORE_PATH }) {
    const instance = new PersistCache(options)
    instance.lockFile = await LockFile.create(options)
    return instance
  }

  async writePackages(packages: Record<string, Package> = {}) {
    this.lockFile?.writePackages(packages)
  }

  async getCache(url: string) {
    const id = computeCacheKey(url)
    const path = resolve(this.options.packagesPath, id)
    if (existsSync(path)) {
      const content = (await readFile(path)).toString('utf-8')
      return content
    }
    return ''
  }

  async saveCache(url: string, content: string) {
    const id = computeCacheKey(url)
    const path = resolve(this.options.packagesPath, id)
    await this.lockFile?.writePackage(url)
    await outputFile(path, content)
  }
}

export const createPersistCache = () => {}
