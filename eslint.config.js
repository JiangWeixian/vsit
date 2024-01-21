const { aiou } = require('@aiou/eslint-config')

module.exports = aiou({ ssr: false }, [
  {
    ignores: ['**/dist/**', '**/dist-client/**', '**/dist-electron/**', '**/vendors/**'],
  },
  {
    files: ['**/**'],
    rules: {
      'import/no-extraneous-dependencies': 'off',
    },
  },
])
