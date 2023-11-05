// eslint-disable-next-line import/no-extraneous-dependencies
import 'source-map-support/register.js'

import cac from 'cac'
import consola from 'consola'

// eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
// @ts-ignore -- ignore package out of dir
import { version } from '../package.json'

const commands = {
  main: () => import('./commands/main').then(m => m.main),
}

const cli = cac('vsit').version(version)

const handler = (cmdName: string) => {
  return async function (...args: any[]) {
    const cmd = await commands[cmdName]()
    await cmd(...args)
  }
}

cli.command('', 'JavaScript playground').alias('hi').action(handler('main'))

cli.help()

cli.parse(process.argv)

consola.wrapConsole()
process.on('unhandledRejection', err => consola.error('[unhandledRejection]', err))
process.on('uncaughtException', err => consola.error('[uncaughtException]', err))
