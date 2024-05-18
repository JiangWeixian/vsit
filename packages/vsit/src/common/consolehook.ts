// Avoid `console` errors in environments that lack a console.
let method
const noop = function () {}
const methods = [
  'assert',
  'clear',
  'count',
  'debug',
  'dir',
  'dirxml',
  'error',
  'exception',
  'group',
  'groupCollapsed',
  'groupEnd',
  'info',
  'log',
  'markTimeline',
  'profile',
  'profileEnd',
  'table',
  'time',
  'timeEnd',
  'timeStamp',
  'trace',
  'warn',
]
let length = methods.length
const consolehook: Console = {} as Console

while (length--) {
  method = methods[length] as keyof Console

  // Only stub undefined methods.
  if (!consolehook[method]) {
    // @ts-expect-error -- ignore
    consolehook[method] = noop
  }
}

export { consolehook }
