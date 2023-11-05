import { createRequire } from 'node:module'
import { resolve } from 'node:path'

import {
  existsSync,
  outputFile,
  readFile,
} from 'fs-extra'
import readYaml from 'read-yaml-file'

import { version } from '../../../package.json'
import { pkgRoot } from '../path'
import {
  LOCK_FILE,
  STORE_PACKAGES_DIR,
  STORE_PATH,
} from './constants'
import { computeCacheKey } from './utils'
import { debug } from '@/common/log'

const require = createRequire(import.meta.url)

interface Options {
  storePath?: string
}

interface ResolvedLockFileOptions {
  /**
   * @description Virtual store path
   * @default <homedir>/<.vsit-store>
   */
  storePath: string
  /**
   * @description Virtual store lock file path
   * @default <homedir>/<.vsit-store>/vsit-lock.yaml
   */
  lockFilePath: string
}

export interface Package {
  /**
   * @description Encoded url
   */
  id: string
  /**
   * @description Remote package url
   */
  url: string
  /**
   * @description Dependent packages
   * @todo not used currently, in the future, we will outdated the persist cache, and concurrent download the packages based on deps
   */
  deps?: string[]
}

interface LockFileYaml {
  version: string
  packages?: Record<string, Package>
}

const writeYaml = require(resolve(pkgRoot, './vendors/write-yaml-file/index.cjs'))

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
