/* eslint-disable react/jsx-key */
import clsx from 'clsx'
import Hook from 'console-feed/lib/Hook'
import { Decode } from 'console-feed/lib/Transform'
import { createSignal } from 'solid-js'
import { consolehook, MESSAGE_EVENT_TYPE } from 'vsit'

import { WBE_API_PATH } from '../../../shared/constants'
import { CodeMirror } from '@/components/console-feed/codemirror'
import { fromConsoleToString, removeRemainKeys } from '@/components/console-feed/from-code-to-string'
import { apis } from '@/lib/apis'
import { VIRUTAL_WEB_ID } from '@/lib/constants'
import { withQuery } from '@/lib/utils'

import type { Setter } from 'solid-js'

interface UseWSProps {
  onMessageUpdate: Setter<Message[]>
}

const useWS = (props: UseWSProps) => {
  let socket
  const importMetaUrl = new URL(import.meta.url)
  // use server configuration, then fallback to inference
  const socketProtocol = null || (importMetaUrl.protocol === 'https:' ? 'wss' : 'ws')
  const hmrPort = null
  const socketHost = `${null || importMetaUrl.hostname}:${hmrPort || importMetaUrl.port}${'/'}`
  try {
    let fallback
    // only use fallback when port is inferred to prevent confusion
    // eslint-disable-next-line unused-imports/no-unused-vars
    socket = setupWebSocket(socketProtocol, socketHost, fallback)
  } catch (error) {
    console.error(error)
  }
  function setupWebSocket(protocol: string, hostAndPath: string, onCloseWithoutOpen?: () => void) {
    const socket = new WebSocket(`${protocol}://${hostAndPath}`, 'vite-hmr')
    let isOpened = false
    socket.addEventListener('open', () => {
      console.log('[vit] websocket opened')
      isOpened = true
    }, { once: true })
    // Listen for messages
    socket.addEventListener('message', async ({ data }) => {
      const result = JSON.parse(data)
      if (result.event === MESSAGE_EVENT_TYPE) {
        const encodeMessage = Decode(Array.isArray(result.data) ? result.data[0] : result.data)
        props.onMessageUpdate?.([encodeMessage])
      }
    })
    // ping server
    socket.addEventListener('close', async ({ wasClean }) => {
      if (wasClean) {
        return
      }
      if (!isOpened && onCloseWithoutOpen) {
        onCloseWithoutOpen()
        return
      }
      console.log('server connection lost. polling for restart...')
      // await waitForSuccessfulPing(protocol, hostAndPath);
      location.reload()
    })
    return socket
  }
}

globalThis.consolehook = consolehook
type Message = ReturnType<typeof Decode>
const InitialCode = `
import { uniq } from "esm.sh:lodash-es@4.17.21"
const a = uniq([1, 2, 3, 3])
const b: number = 1
consolehook.log(a, b, uniq)
`
const Home = () => {
  const [type, setType] = createSignal<'web' | 'node'>('web')
  const [code, setCode] = createSignal(InitialCode)
  const [logState, setLogState] = createSignal<Message[]>([])
  useWS({ onMessageUpdate: setLogState })
  /**
   * @description Wrap console.log with console-feed
   */
  const wrapConsole = () => {
    Hook(globalThis.consolehook, (log) => {
      setLogState(log as any ?? [])
    })
  }
  const handleClick = async () => {
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
      script?.remove()
      setLogState([])
      script = script ?? document.createElement('script')
      script.type = 'module'
      const url = withQuery(WBE_API_PATH)
      script.src = url
      // script.innerHTML = unStripEsmsh(content)
      script.id = VIRUTAL_WEB_ID
      const body = document.querySelector('body')
      body?.appendChild(script)
    }
    injectWebScript()
    wrapConsole()
  }
  const handleSwitchType = (type: 'web' | 'node') => {
    setLogState([])
    setType(type)
  }
  return (
    <div class="bg-base-200 h-full">
      <div class="flex items-center justify-between p-2">
        <button class="btn btn-sm" onClick={handleClick}>run</button>
        <div class="tabs tabs-boxed p-2">
          <a class={clsx('tab', { 'tab-active': type() === 'web' })} onClick={() => handleSwitchType('web')}>Web</a>
          <a class={clsx('tab', { 'tab-active': type() === 'node' })} onClick={() => handleSwitchType('node')}>Node</a>
        </div>
      </div>
      <div class="items-top flex">
        <div class="max-w-[50%] flex-1">
          <CodeMirror
            code={InitialCode}
            initMode="immediate"
            showLineNumbers={false}
            fileType="ts"
            readOnly={false}
            onCodeUpdate={code => setCode(code)}
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
                  initMode="immediate"
                  showLineNumbers={false}
                  fileType="ts"
                  readOnly={true}
                />
              )
            })
          })}
        </div>
      </div>
    </div>
  )
}

export default Home
