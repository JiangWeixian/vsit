import path from 'node:path'

import alias from '@rollup/plugin-alias'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import resolve from '@rollup/plugin-node-resolve'
import { defineConfig } from 'rollup'
import ce from 'rollup-plugin-condition-exports'
import esbuild from 'rollup-plugin-esbuild'
import { externals } from 'rollup-plugin-node-externals'
import size from 'rollup-plugin-size'

export default defineConfig([
  // CommonJS (for Node) and ES module (for bundlers) build.
  // (We could have three entries in the configuration array
  // instead of two, but it's quicker to generate multiple
  // builds from a single configuration where possible, using
  // an array for the `output` option, where we can specify
  // `file` and `format` for each target)
  {
    plugins: [
      externals({
        devDeps: false,
        builtinsPrefix: 'add',
      }),
      commonjs(),
      esbuild({
        minify: false,
        sourceMap: true,
        target: 'es2021',
      }),
      alias({
        customResolver: resolve({ extensions: ['.tsx', '.ts'] }),
        entries: Object.entries({
          '@/*': ['./src/*'],
        }).map(([alias, value]) => ({
          find: new RegExp(`${alias.replace('/*', '')}`),
          replacement: path.resolve(process.cwd(), `${value[0].replace('/*', '')}`),
        })),
      }),
      resolve({ browser: false, exportConditions: ['node', 'default'] }),
      json(),
      ce({
        outDir: 'dist',
        declarationDir: 'dts',
      }),
      size(),
    ],
    watch: {
      exclude: ['./package.json'],
    },
    output: [
      {
        sourcemap: true,
        entryFileNames: '[name].mjs',
        dir: 'dist',
        chunkFileNames: 'chunks/[name].mjs',
        format: 'esm',
      },
      {
        sourcemap: true,
        entryFileNames: '[name].cjs',
        dir: 'dist',
        chunkFileNames: 'chunks/[name].cjs',
        format: 'cjs',
      },
    ],
  },
])
