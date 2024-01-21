import { createRequire } from 'node:module'
import path from 'node:path'

import alias from '@rollup/plugin-alias'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import { defineConfig } from 'rollup'
import ce from 'rollup-plugin-condition-exports'
import esbuild from 'rollup-plugin-esbuild'
import { externals } from 'rollup-plugin-node-externals'
import size from 'rollup-plugin-size'

const require = createRequire(import.meta.url)

const plugins = [
  externals({
    devDeps: false,
    builtinsPrefix: 'add',
  }),
  commonjs(),
  replace({
    delimiters: ['', ''],
    preventAssignment: true,
    values: {
      'import \'source-map-support/register.js\';': '',
    },
  }),
  esbuild({
    minify: false,
    sourceMap: process.env.BUILD !== 'production',
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
  size(),
]

export default defineConfig([
  {
    input: {
      'write-yaml-file/index': require.resolve('write-yaml-file'),
    },
    plugins,
    output: [
      {
        entryFileNames: '[name].cjs',
        dir: 'vendors',
        chunkFileNames: 'chunks/[name].cjs',
        format: 'cjs',
      },
    ],
  },
  {
    input: 'src/cli.ts',
    preserveEntrySignatures: 'strict',
    external: ['source-map-support/register.js'],
    plugins,
    watch: {
      exclude: ['./package.json'],
    },
    output: [
      {
        sourcemap: process.env.BUILD !== 'production',
        entryFileNames: '[name].mjs',
        dir: 'dist',
        chunkFileNames: 'chunks/[name].mjs',
        format: 'esm',
      },
    ],
  },
  {
    plugins: [
      // TODO: condition field order is not correct
      ce({
        outDir: 'dist',
        declarationDir: 'dts',
      }),
      ...plugins,
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
