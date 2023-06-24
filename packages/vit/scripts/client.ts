import path from 'node:path'

import { copySync } from 'fs-extra'

const src = path.resolve(__dirname, '../../client/dist')
const dest = path.resolve(__dirname, '../dist-client')
copySync(src, dest)
