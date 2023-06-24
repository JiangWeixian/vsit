import { defineConfig } from 'vitest/config'

const config = defineConfig({
  test: {
    environment: 'node',
    watch: false,
    env: {
      TEST: JSON.stringify(true),
    },
  },
})

export default config
