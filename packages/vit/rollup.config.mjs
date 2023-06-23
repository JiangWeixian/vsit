import path from 'node:path'

import alias from '@rollup/plugin-alias'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
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
    input: 'src/cli.ts',
    preserveEntrySignatures: 'strict',
    external: ['source-map-support/register.js'],
    plugins: [
      externals({
        devDeps: false,
        builtinsPrefix: 'ignore',
      }),
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
        customResolver: nodeResolve({ extensions: ['.tsx', '.ts'] }),
        entries: Object.entries({
          '@/*': ['./src/*'],
        }).map(([alias, value]) => ({
          find: new RegExp(`${alias.replace('/*', '')}`),
          replacement: path.resolve(process.cwd(), `${value[0].replace('/*', '')}`),
        })),
      }),
      commonjs(),
      nodeResolve({ preferBuiltins: true }),
      json(),
      size(),
    ],
    watch: {
      exclude: ['./package.json'],
    },
    output: [
      {
        sourcemap: process.env.BUILD !== 'production',
        entryFileNames: '[name].mjs',
        dir: 'lib',
        chunkFileNames: 'chunks/[name].mjs',
        format: 'esm',
      },
    ],
  },
  {
    preserveEntrySignatures: 'strict',
    plugins: [
      ce({
        outDir: 'lib',
        declarationDir: 'lib',
      }),
      externals({
        devDeps: false,
        builtinsPrefix: 'ignore',
      }),
      esbuild({
        minify: false,
        sourceMap: true,
        target: 'es2021',
      }),
      alias({
        customResolver: nodeResolve({ extensions: ['.tsx', '.ts'] }),
        entries: Object.entries({
          '@/*': ['./src/*'],
        }).map(([alias, value]) => ({
          find: new RegExp(`${alias.replace('/*', '')}`),
          replacement: path.resolve(process.cwd(), `${value[0].replace('/*', '')}`),
        })),
      }),
      commonjs(),
      nodeResolve({ preferBuiltins: true }),
      json(),
      size(),
    ],
    watch: {
      exclude: ['./package.json'],
    },
    output: [
      {
        sourcemap: true,
        entryFileNames: '[name].mjs',
        dir: 'lib',
        chunkFileNames: 'chunks/[name].mjs',
        format: 'esm',
      },
    ],
  },
])
