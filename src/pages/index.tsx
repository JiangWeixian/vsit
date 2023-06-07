import clsx from 'clsx'
import {
  Console,
  Decode,
  Hook,
} from 'console-feed'
import { useRef, useState } from 'react'

import { unStripEsmsh } from '../lib/strip-esmsh'

let socket
let setLogStateInCompnent
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
    if (result.event === 'vit:custom') {
      // console.log(result)
      setLogStateInCompnent?.(prev => prev ? [...prev, Decode(result.data)] : [Decode(result.data)])
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

const VIRTUAL_MODULES_ID = 'fake-web-files'
const Home = () => {
  const [type, setType] = useState<'web' | 'node'>('web')
  const contentRef = useRef<HTMLDivElement>(null)
  const [logState, setLogState] = useState<any[]>([])
  setLogStateInCompnent = setLogState
  const wrapConsole = () => {
    Hook(window.console, (log) => {
      setLogState([Decode(log)])
    })
  }
  const handleClick = () => {
    if (type === 'node') {
      fetch('/node-container', { method: 'GET' })
      return
    }
    if (contentRef.current) {
      const content = contentRef.current.innerText
      let script = document.getElementById(VIRTUAL_MODULES_ID) as HTMLScriptElement
      if (!script) {
        script = document.createElement('script')
        script.type = 'module'
        script.innerHTML = unStripEsmsh(content)
        script.id = VIRTUAL_MODULES_ID
        const body = document.querySelector('body')
        body?.appendChild(script)
      } else {
        script.remove()
        setLogState([])
        script = document.createElement('script')
        script.type = 'module'
        script.innerHTML = unStripEsmsh(content)
        script.id = VIRTUAL_MODULES_ID
        const body = document.querySelector('body')
        body?.appendChild(script)
        script.innerHTML = unStripEsmsh(content)
      }
      wrapConsole()
    }
  }
  const handleSwitchType = (type: 'web' | 'node') => {
    setType(type)
  }
  return (
    <div className="h-full bg-base-200">
      <div className="tabs tabs-boxed">
        <a className={clsx('tab', { 'tab-active': type === 'web' })} onClick={() => handleSwitchType('web')}>Web</a>
        <a className={clsx('tab', { 'tab-active': type === 'node' })} onClick={() => handleSwitchType('node')}>Node</a>
      </div>
      {/* https://stackoverflow.com/questions/49639144/why-does-react-warn-against-an-contenteditable-component-having-children-managed */}
      <pre
        contentEditable={true}
        ref={contentRef}
        className="code-editor"
        dangerouslySetInnerHTML={{
          __html: `
import { uniq } from "esm.sh:lodash-es@4.17.21"
const a = uniq([1, 2, 3, 3])
console.log(a)
        `,
        }}
      />
      <button className="btn" onClick={handleClick}>run</button>
      <Console logs={logState} variant="dark" />
      {/* <pre className="log">
        {logState.map((item, index) => <p key={index}>{JSON.stringify(item, null, 2)}</p>)}
      </pre> */}
    </div>
  )
}

export default Home
