/* eslint-disable react/jsx-key */
import clsx from 'clsx'
import Hook from 'console-feed/lib/Hook'
import { createSignal } from 'solid-js'
// eslint-disable-next-line import/no-extraneous-dependencies
import { consolehook, WBE_API_PATH } from 'vsit'

import { VsitCmdk } from '@/components/cmdk'
import { CodeMirror } from '@/components/console-feed/codemirror'
import { fromConsoleToString, removeRemainKeys } from '@/components/console-feed/from-code-to-string'
import { VsitProvider } from '@/components/vsit-context'
import { useRPC } from '@/hooks/use-rpc'
import { useWS } from '@/hooks/use-ws'
import { apis } from '@/lib/apis'
import { VIRUTAL_WEB_ID } from '@/lib/constants'
import { format } from '@/lib/prettier'
import { normalizeUrl } from '@/lib/utils'

import type { Decode } from 'console-feed/lib/Transform'

globalThis.consolehook = consolehook
type Message = ReturnType<typeof Decode>
const InitialCode = `import { uniq } from "esm.sh:lodash-es@4.17.21"
const a = uniq([1, 2, 3, 3])
const b: number = 1
console.log(a, b, uniq)
`
const Home = () => {
  const [type, setType] = createSignal<'node' | 'web'>('web')
  const [code, setCode] = createSignal(InitialCode)
  const [logState, setLogState] = createSignal<Message[]>([])
  process.env.IS_CLIENT
    // eslint-disable-next-line react-hooks/rules-of-hooks -- IS_CLIENT is always be true in electron dist
    ? useRPC({ onMessageUpdate: setLogState })
    // eslint-disable-next-line react-hooks/rules-of-hooks
    : useWS({ onMessageUpdate: setLogState })
  const editorRef: {
    setCode?: (code: string) => void
  } = {}
  /**
   * @description Wrap console.log with console-feed
   */
  const wrapConsole = () => {
    Hook(globalThis.consolehook, (log) => {
      setLogState(log as any ?? [])
    })
  }
  const handleExec = async () => {
    const content = code()
    if (type() === 'node') {
      await apis.node.update(content)
      // Why use timestamp as a query parameter for method get
      // Call fetch after update, make sure vite side exec node module
      apis.node.get()
      return
    }
    await apis.web.update(content)
    /**
     * @description Inject script src=<VIRUTAL_WEB_ID> will get trasformed results from vite
     */
    const injectWebScript = () => {
      let script = document.getElementById(VIRUTAL_WEB_ID) as HTMLScriptElement
      if (script) {
        script?.remove()
        setLogState([])
      }
      // Should always create new script element make sure browser re-fetch script again
      script = document.createElement('script')
      script.type = 'module'
      const url = normalizeUrl({ pathname: WBE_API_PATH, port: window.vsit.port })
      script.src = url
      // script.innerHTML = unStripEsmsh(content)
      script.id = VIRUTAL_WEB_ID
      const body = document.querySelector('body')
      body?.appendChild(script)
    }
    injectWebScript()
    wrapConsole()
  }
  const handleSwitchType = (type: 'node' | 'web') => {
    setLogState([])
    setType(type)
  }
  const handleFormat = async () => {
    const formattedCode = await format(code())
    editorRef.setCode?.(formattedCode)
  }
  return (
    <VsitProvider value={{ handleFormat, handleExec }}>
      <div class="bg-base-200 h-full">
        <div class="flex items-center justify-between p-2">
          <button
            class="btn btn-sm"
          >
            <span class="mr-2 capitalize">
              Open Command
            </span>
            <kbd class="kbd kbd-xs">⌘</kbd> <kbd class="kbd kbd-xs">j</kbd>
          </button>
          <div class="tabs tabs-boxed p-2">
            <a class={clsx('tab', { 'tab-active': type() === 'web' })} onClick={() => handleSwitchType('web')}>Web</a>
            <a class={clsx('tab', { 'tab-active': type() === 'node' })} onClick={() => handleSwitchType('node')}>Node</a>
          </div>
        </div>
        <div class="items-top flex">
          <div class="max-w-[50%] flex-1">
            <CodeMirror
              code={InitialCode}
              showLineNumbers={false}
              fileType="ts"
              readOnly={false}
              apis={{
                format,
                exec: handleExec,
              }}
              onCodeUpdate={code => setCode(code)}
              onImperativehandle={(ref) => {
                editorRef.setCode = ref.setCode
              }}
            />
          </div>
          <div class="flex-1">
            {logState().map(({ data }, logIndex, references) => {
              return removeRemainKeys(data)?.map((msg) => {
                const fixReferences = references.slice(
                  logIndex,
                  references.length,
                )
                return (
                  <CodeMirror
                    code={fromConsoleToString(msg, fixReferences)}
                    showLineNumbers={false}
                    fileType="ts"
                    readOnly={true}
                  />
                )
              })
            })}
          </div>
        </div>
        <VsitCmdk />
      </div>
    </VsitProvider>
  )
}

export default Home
