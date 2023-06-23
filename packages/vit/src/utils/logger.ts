// refs: https://github.com/vuejs/vue-cli/blob/v2/lib/logger.js
import { format } from 'node:util'

import pc from 'picocolors'

/**
 * Prefix.
 */
const sep = pc.gray('·')

/**
 * Log a `message` to the console.
 *
 * @param {String} message
 */

const log = (...args: [any, ...any[]]) => {
  const msg = format.apply(format, args)
  console.log(pc.bgBlue(pc.black(' info ')), sep, msg)
}

/**
 * Log an error `message` to the console and exit.
 *
 * @param {String} message
 */

const fatal = (...args: [any, ...any[]]) => {
  if (args[0] instanceof Error) {
    args[0] = args[0].message.trim()
  }
  const msg = format.apply(format, args)
  console.error(pc.bgRed(pc.black(' failed ')), sep, msg)
  process.exit(1)
}

/**
 * Log a success `message` to the console and exit.
 *
 * @param {String} message
 */

const success = (...args: [any, ...any[]]) => {
  const msg = format.apply(format, args)
  console.log(pc.bgRed(pc.black(' success ')), sep, msg)
}

export default {
  log,
  fatal,
  success,
}
