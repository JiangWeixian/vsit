/* eslint-disable react/jsx-key */
import '@/lib/polyfill'

import clsx from 'clsx'
import Hook from 'console-feed/lib/Hook'
import {
  createEffect,
  createSignal,
  Match,
  Show,
  Switch,
} from 'solid-js'
import { WBE_API_PATH } from 'vsit-shared/constants'

import { VsitCmdk } from '@/components/cmdk'
import { fromConsoleToString, removeRemainKeys } from '@/components/console-feed/from-code-to-string'
import { CodeMirror } from '@/components/editor'
import { TypescriptServerProvider } from '@/components/editor/extensions/autocompletion/typescript-server-provider'
import { Readme } from '@/components/markdown'
import { Resizer } from '@/components/resizeable/resizer'
import { VsitProvider } from '@/components/vsit-context'
import { useWS } from '@/hooks/use-ws'
import { apis } from '@/lib/apis'
import {
  FILE_PATH,
  InitialCode,
  PKG_JSON_PATH,
  VIRUTAL_WEB_ID,
} from '@/lib/constants'
import { format } from '@/lib/prettier'
import { withQuery } from '@/lib/utils'

import type { Files } from '@/components/editor/extensions/autocompletion/tsserver.worker'
import type { Pkg } from '@/components/markdown'
import type { Message } from '@/hooks/use-ws'

const Home = () => {
  const [type, setType] = createSignal<'node' | 'web'>('web')
  const [code, setCode] = createSignal(InitialCode)
  const [width, setWidth] = createSignal('50%')
  const [logState, setLogState] = createSignal<Message[]>([])
  const [dir, setDir] = createSignal('left')
  const [pkgs, setPkgs] = createSignal<Pkg[]>([])
  const files = (): Files => {
    const pkgJsonContent: Record<string, string> = {}
    pkgs().forEach((pkg) => {
      pkgJsonContent[pkg.name] = pkg.version ?? 'latest'
    })
    return {
      [FILE_PATH]: {
        code: code(),
      },
      [PKG_JSON_PATH]: {
        code: JSON.stringify({
          dependencies: pkgJsonContent,
        }),
      },
    }
  }
  useWS({ onMessageUpdate: setLogState })
  const handleParseImports = async () => {
    const imports = await apis.third.parseImports(code(), FILE_PATH)
    setPkgs(imports)
  }
  createEffect(async () => {
    await handleParseImports()
  })
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
  const handleSwitchType = (type: 'node' | 'web') => {
    setLogState([])
    setType(type)
  }
  const handleFormat = async () => {
    const formattedCode = await format(code())
    editorRef.setCode?.(formattedCode)
  }
  const handleResize = async (v: string) => {
    setWidth(v)
  }

  return (
    <VsitProvider value={{ handleFormat, handleExec, handleResize }}>
      <TypescriptServerProvider>
        <div class="bg-base-200 flex h-full flex-col">
          <div class="flex flex-none items-center justify-between p-2">
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
          <div class="items-top border-neutral flex grow overflow-y-hidden border">
            <div class="bg-base-100 h-full w-1/2 min-w-[25vw] max-w-[90vw] overflow-auto" style={{ width: `${width()}` }}>
              <Resizer
                side="right"
                onResize={(x, _y) => {
                  setWidth(`${x}px`)
                }}
              >
                <CodeMirror
                  code={InitialCode}
                  showLineNumbers={false}
                  fileType="ts"
                  filePath={FILE_PATH}
                  files={files}
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
              </Resizer>
            </div>
            <div class="bg-base-100 grow">
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
          <div class={clsx('absolute right-0 z-50 h-full w-1/2', { 'translate-x-full': dir() === 'left', 'translate-x-0': dir() === 'right' })}>
            <div class="absolute -left-8 top-1/2 cursor-pointer opacity-50 hover:opacity-100">
              <Switch>
                <Match when={dir() === 'left'}>
                  <i
                    class="gg-push-chevron-left"
                    onClick={() => {
                      handleParseImports()
                      setDir('right')
                    }}
                  />
                </Match>
                <Match when={dir() === 'right'}>
                  <i class="gg-push-chevron-right" onClick={() => setDir('left')} />
                </Match>
              </Switch>
            </div>
            <Show when={pkgs().length !== 0}>
              <Readme pkgs={pkgs()} />
            </Show>
          </div>
        </div>
      </TypescriptServerProvider>
    </VsitProvider>
  )
}

export default Home
