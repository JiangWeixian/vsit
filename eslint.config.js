const { aiou } = require('@aiou/eslint-config')

module.exports = aiou({ ssr: false }, [
  {
    ignores: ['**/dist/**', '**/dist-client/**', '**/vendors/**'],
  },
  {
    files: ['**/**.ts'],
    rules: {
      'import/no-extraneous-dependencies': 'off',
      'ssr-friendly/no-dom-globals-in-module-scope': 'off',
    },
  },
])
