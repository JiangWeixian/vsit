/* eslint-disable etc/no-t */
import { autocompletion, completeFromList } from '@codemirror/autocomplete'
import { renderToString } from 'solid-js/web'

import type {
  Completion,
  CompletionContext,
  CompletionResult,
} from '@codemirror/autocomplete'
import type { EditorState } from '@codemirror/state'
import type { JSX } from 'solid-js'
import type ts from 'typescript'
import type { ChannelClient } from './channel-bridge'
import type { TypescriptExtensionConfig } from './config'
import type { TSServerWorker } from './tsserver.worker'

interface ExtensionEnv {
  envId: number
  client: ChannelClient<TSServerWorker>
  filePath: string | undefined
  config: TypescriptExtensionConfig
}

export function codemirrorTypescriptExtensions(env: ExtensionEnv) {
  return [
    autocompleteExtension(env),
  ]
}

interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason: unknown) => void
}

function deferred<T>(): Deferred<T> {
  const deferred: Deferred<T> = {} as any
  deferred.promise = new Promise<T>((_resolve, _reject) => {
    deferred.resolve = _resolve
    deferred.reject = _reject
  })
  return deferred
}

function throttleAsync<Args extends any[], R>(
  wait: number,
  fn: (...args: Args) => Promise<R>,
): (...args: Args) => Promise<R> {
  let timeout: number | undefined
  let latestArguments: Args
  let pending: Array<Deferred<R>> = []

  async function performFunctionCall() {
    const toResolve = pending
    pending = []
    try {
      const result = await fn(...latestArguments)
      toResolve.forEach(p => p.resolve(result))
    } catch (error) {
      toResolve.forEach(p => p.reject(error))
    } finally {
      timeout = undefined
      // Handle calls that were enqueued while we were waiting for our async
      // function.
      if (pending.length) {
        startTimeout()
      }
    }
  }

  function startTimeout() {
    if (timeout === undefined) {
      timeout = window.setTimeout(performFunctionCall, wait)
    }
  }

  return (...args: Args) => {
    latestArguments = args
    const result = deferred<R>()
    pending.push(result)
    startTimeout()
    return result.promise
  }
}

function tsTextChangesToCodemirrorChanges(
  state: EditorState,
  changes: readonly ts.TextChange[],
) {
  return changes.map((change) => {
    return state.changes({
      from: change.span.start,
      to: change.span.start + change.span.length,
      insert: change.newText,
    })
  })
}

function tsFileTextChangesToCodemirrorChanges(
  state: EditorState,
  changes: ts.FileTextChanges[],
  filePath: string,
) {
  return changes.flatMap((fileEdit) => {
    // if (fileEdit.fileName !== ensurePathStartsWithSlash(filePath)) {
    //   console.warn('Unable to apply changes to other files', fileEdit)
    //   return []
    // }

    return tsTextChangesToCodemirrorChanges(state, fileEdit.textChanges)
  })
}

function renderIntoNode(node: Element, reactNode: () => JSX.Element) {
  // Use renderToStaticMarkup + innerHTML because Codemirror doesn't give us a
  // hook to unmount a React root when the tooltip closes. I'm not sure if that
  // would leak memory.
  const html = renderToString(reactNode)
  node.innerHTML = html
}

function autocompleteExtension({
  client,
  envId,
  filePath,
  config,
}: ExtensionEnv) {
  return autocompletion({
    activateOnTyping: true,
    override: [
      async (ctx: CompletionContext): Promise<CompletionResult | null> => {
        const { pos } = ctx

        try {
          const charBefore = ctx.matchBefore(/./)?.text
          const completions
              = filePath
              && (await client.call('autocompleteAtPosition', {
                envId,
                pos,
                filePath,
                // filePath: ensurePathStartsWithSlash(filePath),
                explicit: ctx.explicit,
                charBefore: !ctx.explicit ? charBefore : undefined,
              }))

          if (!completions) {
            console.warn('Unable to get completions', { pos })
            return null
          }

          return completeFromList(
            completions.entries.map((c, _i) => {
              const details = c.details
              // const description = details?.codeActions?.at(0)?.description
              const source
                  = details?.sourceDisplay?.map(token => token.text).join('')
                  || c.sourceDisplayString

              const suggestions: Completion = {
                type: c.kind,
                label: c.name,
                detail: source,
                // Use autocomplete's default behavior is enough for now.
                // apply: actions
                //   ? (view) => {
                //       const codeActionChanges = actions.flatMap(action =>
                //         tsFileTextChangesToCodemirrorChanges(
                //           view.state,
                //           action.changes,
                //           filePath,
                //         ),
                //       )

                //       const apply = c.name

                //       // TODO: currently we re-implement codemirror/autocomplete's default behavior
                //       // because we couldn't have both a custom action and do the default.
                //       // Upstream added a helper, but upgrading autocomplete requires a bump in many
                //       // codemirror-related packages.
                //       // See https://github.com/codemirror/autocomplete/blob/main/CHANGELOG.md#0202-2022-05-24
                //       const matchedPrefix = ctx.matchBefore(/\w+/) ?? {
                //         from: Math.min(
                //           ctx.pos,
                //           view.state.selection.main.from,
                //         ),
                //         to: view.state.selection.main.to,
                //       }
                //       const baseLabelChange = {
                //         from: matchedPrefix.from,
                //         to: view.state.selection.main.to,
                //         insert: apply,
                //       }

                //       view.dispatch({
                //         // ...insertLabelChanges,
                //         changes: [
                //           // insertLabelChanges.changes,
                //           baseLabelChange,
                //           ...codeActionChanges,
                //         ],
                //         annotations: pickedCompletion.of(suggestions),
                //       })
                //     }
                //   : undefined,
                // info:
                //   details || config.debugCompletions
                //     ? function () {
                //       const container = document.createElement('div')
                //       renderIntoNode(
                //         container,

                //         () => (
                //           <>
                //             {description && (
                //               <div class="quickinfo-documentation cm-tooltip-section">
                //                 {description}
                //               </div>
                //             )}
                //             {details && (
                //             // TODO:
                //             // <QuickInfo
                //             //   {...config}
                //             //   state={ctx.state}
                //             //   info={details}
                //             //   truncateDisplayParts={true}
                //             // />
                //               <></>
                //             )}
                //             {config.debugCompletions && (
                //               <pre>{JSON.stringify(c, null, 2)}</pre>
                //             )}
                //           </>
                //         ),
                //       )
                //       return container
                //     }
                //     : undefined,
                // TODO: double-check ranking makes sense.
                boost: 1 / Number(c.sortText),
              }

              return suggestions
            }),
          )(ctx)
        } catch (e) {
          console.error('Unable to get completions', { pos, error: e })
          return null
        }
      },
    ],
  })
}
