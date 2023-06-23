let method;
const noop = function() {
};
const methods = [
  "assert",
  "clear",
  "count",
  "debug",
  "dir",
  "dirxml",
  "error",
  "exception",
  "group",
  "groupCollapsed",
  "groupEnd",
  "info",
  "log",
  "markTimeline",
  "profile",
  "profileEnd",
  "table",
  "time",
  "timeEnd",
  "timeStamp",
  "trace",
  "warn"
];
let length = methods.length;
const consolehook = {};
while (length--) {
  method = methods[length];
  if (!consolehook[method]) {
    consolehook[method] = noop;
  }
}

export { consolehook };
//# sourceMappingURL=index.mjs.map
