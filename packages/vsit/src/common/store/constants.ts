import os from 'node:os'
import path from 'node:path'

const STORE_DIR = '.vsit-store'
export const STORE_PATH = path.join(os.homedir(), STORE_DIR)
export const LOCK_FILE = 'vist-lock.yaml'
export const STORE_PACKAGES_DIR = 'packages'
