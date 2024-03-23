import { Decode } from 'console-feed/lib/Transform'
import { MESSAGE_EVENT_TYPE } from 'vsit'

import type { UseWSProps } from './use-ws'

export const useRPC = (props: UseWSProps) => {
  window.ipcRenderer.on(MESSAGE_EVENT_TYPE, (data: any) => {
    const result = data
    const encodeMessage = Decode(Array.isArray(result) ? result[0] : result)
    props.onMessageUpdate?.([encodeMessage])
  })
}
