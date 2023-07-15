import path from 'node:path'

import { defineConfig } from 'vitest/config'

const config = defineConfig({
  test: {
    environment: 'node',
    watch: !process.env.CI,
    env: {
      TEST: JSON.stringify(true),
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})

export default config
