import { Decode } from 'console-feed/lib/Transform'
import { MESSAGE_EVENT_TYPE } from 'vsit'

import type { Setter } from 'solid-js'

export type Message = ReturnType<typeof Decode>

interface UseWSProps {
  onMessageUpdate: Setter<Message[]>
}

export const useWS = (props: UseWSProps) => {
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
