export const VIRUTAL_WEB_ID = 'virtual:web.ts'

export const InitialCode = `import { uniq } from "esm.sh:lodash-es@4.17.21"
const a = uniq([1, 2, 3, 3])
const b: number = 1
console.log(a, b, uniq)
`
export const FILE_PATH = '/fake.ts'
export const PKG_JSON_PATH = '/package.json'
export const NPM_ORIGIN = 'https://registry.npmjs.org'
export const ESM_SH_ORIGIN = 'https://esm.sh'