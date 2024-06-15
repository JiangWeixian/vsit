// refs: https://github.com/reactjs/react.dev/pull/4720/files
import { EditorView } from '@codemirror/view'
import {
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  useContext,
} from 'solid-js'

import { getConfigForFilePath } from './config'
import { TypescriptServerContext } from './typescript-server-provider'
import { FILE_PATH } from '@/lib/constants'

import type { Accessor } from 'solid-js'
import type { Files } from './tsserver.worker'

let globalEnvironmentIdCounter = 0
type InitOn = 'interaction' | 'visible'

function onceOnInteractionExtension(onInteraction: () => void) {
  let triggered = false
  function trigger() {
    if (!triggered) {
      triggered = true
      onInteraction()
    }
  }

  return [
    // Trigger on edit intent
    EditorView.updateListener.of((update) => {
      if (update.view.hasFocus) {
        trigger()
      }
    }),
    // Trigger on tooltip intent
    // hoverTooltip(() => {
    //   trigger()
    //   return null
    // }),
  ]
}

interface UseTsExtProps {
  files?: Accessor<Files>
  initOn: InitOn
}

export const useTsExt = ({ initOn, files }: UseTsExtProps) => {
  const { codemirrorExtensions, tsServer, setup: setUpGlobalWorker } = useContext(TypescriptServerContext)
  const [envId] = createSignal(globalEnvironmentIdCounter++)
  const [shouldHaveEnv, setShouldHaveEnv] = createSignal(false)
  const [hasEnv, setHasEnv] = createSignal(false)
  createEffect(() => {
    if (!shouldHaveEnv()) {
      return
    }

    if (!tsServer?.()) {
      setUpGlobalWorker?.()
      return
    }

    tsServer()!.workerClient
      .call('createEnv', {
        envId: envId(),
        // files: files?.() ?? {},
        files: {
          ...files?.() ?? {},
          '/shim.d.ts': {
            code: 'declare module "esm.sh:lodash-es@4.17.21" {\nimport * as m from "lodash-es"\nexport = m\n}',
          },
        },
        entry: FILE_PATH,
      })
      .then(() => !hasEnv() && setHasEnv(true))
  })
  onCleanup(() => {
    setHasEnv(false)
    tsServer?.()?.workerClient.call('deleteEnv', envId())
  })
  createEffect(() => {
    if (initOn === 'visible' && !shouldHaveEnv()) {
      setShouldHaveEnv(true)
    }
  })

  const featuresExtension = createMemo(() => {
    if (!codemirrorExtensions?.() || !tsServer?.()) {
      // Waiting for dependency to load.
      return []
    }

    return codemirrorExtensions()!.codemirrorTypescriptExtensions({
      envId: envId(),
      client: tsServer()!.workerClient,
      filePath: FILE_PATH,
      config: getConfigForFilePath(FILE_PATH),
    })
  })

  const exts = createMemo(() => {
    if (!shouldHaveEnv() && initOn === 'interaction') {
      return onceOnInteractionExtension(() => {
        setShouldHaveEnv(true)
      })
    }

    if (!hasEnv()) {
      return []
    }

    return featuresExtension()
  })

  return {
    exts,
    envId,
  }
}
