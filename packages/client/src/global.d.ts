declare global {
  namespace NodeJS {
    interface ProcessEnv {
      VITE_INSPECT: string
      IS_CLIENT: boolean
    }
  }
  interface Window {
    ipcRenderer: any
  }
  // eslint-disable-next-line vars-on-top, no-var
  var consolehook: Console
}

export {}
