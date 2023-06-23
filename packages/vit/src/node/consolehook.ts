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
const consolehook: any = {}

while (length--) {
  method = methods[length]

  // Only stub undefined methods.
  if (!consolehook[method]) {
    consolehook[method] = noop
  }
}

export { consolehook }
