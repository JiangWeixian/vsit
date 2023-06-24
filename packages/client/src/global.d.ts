declare global {
  namespace NodeJS {
    interface ProcessEnv {
      VITE_INSPECT: string
    }
  }
  // eslint-disable-next-line vars-on-top, no-var
  var consolehook: Console
}

export {}
