const { aiou } = require('@aiou/eslint-config')

module.exports = aiou([
  {
    ignores: ['**/dist/**', '**/dist-client/**', "**/dist-electron/**", '**/vendors/**'],
  },
  {
    files: ['**/**'],
    rules: {
      'import/no-extraneous-dependencies': 'off',
      'ssr-friendly/no-dom-globals-in-module-scope': 'off',
    },
  },
])
