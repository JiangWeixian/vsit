export const VIRUTAL_WEB_ID = 'virtual:web.ts'

export const InitialCode = `import { uniq } from "esm.sh:lodash-es@4.17.21"
const a = uniq([1, 2, 3, 3])
const b: number = 1
console.log(a, b, uniq)
`