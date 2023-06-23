// eslint-disable-next-line import/no-extraneous-dependencies
import 'source-map-support/register.js'

import cac from 'cac'
import consola from 'consola'

import pkg from '../package.json'

const commands = {
  hello: () => import('./commands/hello').then(m => m.hello),
  loading: () => import('./commands/loading').then(m => m.loading),
}

const cli = cac('bin-template').version(pkg.version)

const handler = (cmdName: string) => {
  return async function (...args: any[]) {
    const cmd = await commands[cmdName]()
    await cmd(...args)
  }
}

cli.command('hello [word]', 'say hello').alias('hi').action(handler('hello'))

cli
  .command('loading [ms]', 'loading')
  .option('-t, --text [text]', 'define loading text')
  .action(handler('loading'))

cli.help()

cli.parse(process.argv)

consola.wrapConsole()
process.on('unhandledRejection', err => consola.error('[unhandledRejection]', err))
process.on('uncaughtException', err => consola.error('[uncaughtException]', err))
