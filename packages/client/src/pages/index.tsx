/* eslint-disable react/jsx-key */
import clsx from 'clsx'
import Hook from 'console-feed/lib/Hook'
import { Decode } from 'console-feed/lib/Transform'
import { createSignal } from 'solid-js'
import { consolehook, MESSAGE_EVENT_TYPE } from 'vsit'

import { CodeMirror } from '@/components/console-feed/codemirror'
import { fromConsoleToString, removeRemainKeys } from '@/components/console-feed/from-code-to-string'
import {
  API_GET_FAKE_NODE_FILE,
  API_GET_FAKE_WEB_FILE,
  API_UPDATE_FAKE_NODE_FILE,
  API_UPDATE_FAKE_WEB_FILE,
  VIRTUAL_MODULES_ID,
} from '@/lib/constants'
import { unStripEsmsh } from '@/lib/strip-esmsh'

import type { Setter } from 'solid-js'

interface UseWSProps {
  onMessageUpdate: Setter<Message[]>
}

const useWS = (props: UseWSProps) => {
  let socket
  const importMetaUrl = new URL(import.meta.url)
  // use server configuration, then fallback to inference
  const serverHost = 'localhost:undefined/'
  const socketProtocol = null || (importMetaUrl.protocol === 'https:' ? 'wss' : 'ws')
  const hmrPort = null
  const socketHost = `${null || importMetaUrl.hostname}:${hmrPort || importMetaUrl.port}${'/'}`
  const directSocketHost = 'localhost:undefined/'
  try {
    let fallback
    // only use fallback when port is inferred to prevent confusion
    if (!hmrPort) {
      fallback = () => {
        // fallback to connecting directly to the hmr server
        // for servers which does not support proxying websocket
        socket = setupWebSocket(socketProtocol, directSocketHost, () => {
          const currentScriptHostURL = new URL(import.meta.url)
          const currentScriptHost = currentScriptHostURL.host
                      + currentScriptHostURL.pathname.replace(/@vite\/client$/, '')
          console.error('[vite] failed to connect to websocket.\n'
                      + 'your current setup:\n'
                      + `  (browser) ${currentScriptHost} <--[HTTP]--> ${serverHost} (server)\n`
                      + `  (browser) ${socketHost} <--[WebSocket (failing)]--> ${directSocketHost} (server)\n`
                      + 'Check out your Vite / network configuration and https://vitejs.dev/config/server-options.html#server-hmr .')
        })
        socket.addEventListener('open', () => {
          console.info('[vite] Direct websocket connection fallback. Check out https://vitejs.dev/config/server-options.html#server-hmr to remove the previous connection error.')
        }, { once: true })
      }
    }
    socket = setupWebSocket(socketProtocol, socketHost, fallback)
  } catch (error) {
    console.error(error)
  }
  function setupWebSocket(protocol: string, hostAndPath: string, onCloseWithoutOpen?: () => void) {
    const socket = new WebSocket(`${protocol}://${hostAndPath}`, 'vite-hmr')
    let isOpened = false
    socket.addEventListener('open', () => {
      console.log('custom socket opened')
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
      console.log('[vite] server connection lost. polling for restart...')
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
import stripAnsi from "esm.sh:strip-ansi@7.1.0"
const a = uniq([1, 2, 3, 3])
const b: number = 1
consolehook.log(a, b, uniq, stripAnsi)
`
const Home = () => {
  const [type, setType] = createSignal<'web' | 'node'>('web')
  const [code, setCode] = createSignal(InitialCode)
  const [logState, setLogState] = createSignal<Message[]>([])
  useWS({ onMessageUpdate: setLogState })
  const wrapConsole = () => {
    Hook(globalThis.consolehook, (log) => {
      setLogState(log as any ?? [])
    })
  }
  const handleClick = async () => {
    const content = code()
    if (type() === 'node') {
      const timestamp = Date.now()
      // TODO: create common fetch function
      let search = new URLSearchParams({
        t: `${timestamp}`,
      })
      let url = `/${API_UPDATE_FAKE_NODE_FILE}?${search}`
      await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
          content,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      // Why use timestamp as a query parameter for method get
      search = new URLSearchParams({
        t: `${timestamp}`,
      })
      url = `/${API_GET_FAKE_NODE_FILE}?${search}`
      fetch(url, { method: 'GET' })
      return
    }
    // update web file
    const timestamp = Date.now()
    let search = new URLSearchParams({
      t: `${timestamp}`,
    })
    let url = `/${API_UPDATE_FAKE_WEB_FILE}?${search}`
    await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        content: unStripEsmsh(content),
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    // Why use timestamp as a query parameter for method get
    search = new URLSearchParams({
      t: `${timestamp}`,
    })
    url = `/${API_GET_FAKE_WEB_FILE}?${search}`
    let script = document.getElementById(VIRTUAL_MODULES_ID) as HTMLScriptElement
    if (!script) {
      script = document.createElement('script')
      script.type = 'module'
      script.src = url
      // script.innerHTML = unStripEsmsh(content)
      script.id = VIRTUAL_MODULES_ID
      const body = document.querySelector('body')
      body?.appendChild(script)
    } else {
      script.remove()
      setLogState([])
      script = document.createElement('script')
      script.type = 'module'
      script.src = url
      // script.innerHTML = unStripEsmsh(content)
      script.id = VIRTUAL_MODULES_ID
      const body = document.querySelector('body')
      body?.appendChild(script)
    }
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
        <div class="flex-1">
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
