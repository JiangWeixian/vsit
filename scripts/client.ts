import path from 'node:path'

import { copySync } from 'fs-extra'

const src = path.resolve(__dirname, '../packages/client/dist')
const dest = path.resolve(__dirname, '../packages/vsit/dist-client')
copySync(src, dest)
