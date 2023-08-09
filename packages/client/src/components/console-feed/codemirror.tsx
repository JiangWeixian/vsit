/* eslint-disable @typescript-eslint/ban-ts-comment */
import { closeBrackets } from '@codemirror/autocomplete'
import { history } from '@codemirror/commands'
import { bracketMatching, syntaxHighlighting } from '@codemirror/language'
import { EditorState } from '@codemirror/state'
import {
  EditorView,
  highlightActiveLine,
  highlightSpecialChars,
  keymap,
} from '@codemirror/view'
import { createSignal, onMount } from 'solid-js'

import { useSyntaxHighlight } from './use-syntax-highlight'
import {
  getCodeMirrorLanguage,
  getLanguageFromFile,
  getSyntaxHighlight,
} from './utils'

import type { Extension } from '@codemirror/state'
import type { KeyBinding } from '@codemirror/view'
import type { Component } from 'solid-js'

export type Decorators = Array<{
  className?: string
  line: number
  startColumn?: number
  endColumn?: number
  elementAttributes?: Record<string, string>
}>

interface APIs {
  format(code: string): Promise<string>
  exec(): void
}

interface CodeMirrorProps {
  code: string
  filePath?: string
  fileType?: string
  onCodeUpdate?: (newCode: string) => void
  showLineNumbers?: boolean
  showInlineErrors?: boolean
  wrapContent?: boolean
  /**
   * This disables editing of content by the user in all files.
   */
  readOnly?: boolean
  /**
   * Controls the visibility of Read-only label, which will only
   * appears when `readOnly` is `true`
   */
  showReadOnly?: boolean
  /**
   * Provides a way to draw or style a piece of the content.
   */
  decorators?: Decorators
  extensions?: Extension[]
  extensionsKeymap?: KeyBinding[]
  apis?: APIs
  /**
   * @description Expose internal methods of CodeMirror to the parent component
   */
  onImperativehandle?: (refs: {
    setCode: (code: string) => void
  }) => void
}

export interface CodeMirrorRef {
  getCodemirror: () => EditorView | undefined
}

export const CodeMirror: Component<CodeMirrorProps>
  = (
    {
      code = '',
      filePath,
      fileType,
      onCodeUpdate,
      readOnly = false,
      extensions = [],
      onImperativehandle,
      apis = {} as APIs,
    },
  ) => {
    let wrapper: HTMLElement

    let cmView: EditorView
    // const { theme, themeId } = useSandpackTheme()
    const [internalCode, setInternalCode] = createSignal<string>(code)

    const languageExtension = getLanguageFromFile(
      filePath,
      fileType,
      [],
    )
    const langSupport = getCodeMirrorLanguage(
      languageExtension,
      [],
    )
    const highlightTheme = getSyntaxHighlight()

    const syntaxHighlightRender = useSyntaxHighlight({
      langSupport,
      highlightTheme,
      code,
    })

    const applyCodeToMirror = (newCode: string): void => {
      if (cmView) {
        cmView.dispatch({
          changes: { from: 0, to: internalCode().length, insert: newCode },
        })
      }
    }

    onMount(() => {
      if (!wrapper) {
        return
      }

      const customCommandsKeymap: KeyBinding[] = [
        // Format code with prettier
        {
          key: 'Shift-Alt-f',
          run: (): boolean => {
            if (!apis.format) {
              return false
            }
            apis.format(internalCode()).then((formattedCode) => {
              applyCodeToMirror(formattedCode)
            })
            return true
          },
        },
        {
          key: 'Shift-Alt-s',
          run: (): boolean => {
            if (!apis.exec) {
              return false
            }
            apis.exec()
            return true
          },
          preventDefault: true,
        },
        // {
        //   key: 'Tab',
        //   run: (view): boolean => {
        //     indentMore(view)

        //     const customKey = extensionsKeymap.find(({ key }) => key === 'Tab')

        //     return customKey?.run?.(view) ?? true
        //   },
        // },
        // {
        //   key: 'Shift-Tab',
        //   run: ({ state, dispatch }): boolean => {
        //     indentLess({ state, dispatch })

        //     const customKey = extensionsKeymap.find(
        //       ({ key }) => key === 'Shift-Tab',
        //     )

        //     return customKey?.run?.(view) ?? true
        //   },
        // },
        // {
        //   key: 'Escape',
        //   run: (): boolean => {
        //     if (readOnly) {
        //       return true
        //     }

        //     if (wrapper.current) {
        //       wrapper.current.focus()
        //     }

        //     return true
        //   },
        // },
        // {
        //   key: 'mod-Backspace',
        //   run: deleteGroupBackward,
        // },
      ]

      const extensionList = [
        highlightSpecialChars(),
        history(),
        closeBrackets(),

        ...extensions,

        keymap.of([
          // ...closeBracketsKeymap,
          // ...defaultKeymap,
          // ...historyKeymap,
          // ...extensionsKeymap,
          ...customCommandsKeymap,
        ] as KeyBinding[]),
        langSupport,

        // getEditorTheme(),
        syntaxHighlighting(highlightTheme),
      ]

      if (readOnly) {
        extensionList.push(EditorState.readOnly.of(true))
        extensionList.push(EditorView.editable.of(false))
      } else {
        extensionList.push(bracketMatching())
        extensionList.push(highlightActiveLine())
      }

      // if (sortedDecorators) {
      //   extensionList.push(highlightDecorators(sortedDecorators))
      // }

      // if (wrapContent) {
      //   extensionList.push(EditorView.lineWrapping)
      // }

      // if (showLineNumbers) {
      //   extensionList.push(lineNumbers())
      // }

      // if (showInlineErrors) {
      //   extensionList.push(highlightInlineError())
      // }

      const parentDiv = wrapper
      const existingPlaceholder = parentDiv.querySelector(
        '.pre-placeholder',
      )
      if (existingPlaceholder) {
        parentDiv.removeChild(existingPlaceholder)
      }

      // const state = EditorState.create({ doc: code ?? '' })
      // console.log('EditorState', state, code)
      const view = new EditorView({
        doc: code,
        extensions: extensionList,
        parent: parentDiv,
        dispatch: (tr): void => {
          view.update([tr])

          if (tr.docChanged) {
            const newCode = tr.newDoc.sliceString(0, tr.newDoc.length)

            setInternalCode(newCode)
            onCodeUpdate?.(newCode)
          }
        },
      })

      view.contentDOM.setAttribute('data-gramm', 'false')
      view.contentDOM.setAttribute('data-lt-active', 'false')

      if (readOnly) {
        view.contentDOM.classList.add('cm-readonly')
      } else {
        view.contentDOM.setAttribute('tabIndex', '-1')
      }

      cmView = view
    })

    onImperativehandle?.({
      setCode: applyCodeToMirror,
    })

    // const gutterLineOffset = (): string => {
    //   // padding-left
    //   let offset = 4

    //   if (showLineNumbers) {
    //     // line-number-gutter-width + gutter-padding
    //     offset += 6
    //   }

    //   // line-padding
    //   if (!readOnly) {
    //     offset += 1
    //   }

    //   return `var(--${THEME_PREFIX}-space-${offset})`
    // }

    if (readOnly) {
      return (
        <>
          <pre
            ref={el => wrapper = el}
            class="font-mono"
            translate="no"
          >
            <code
              class="pre-placeholder"
            >
              {syntaxHighlightRender}
            </code>
          </pre>
        </>
      )
    }

    return (
      <div
        ref={el => wrapper = el}
        aria-autocomplete="list"
        // aria-label={
        //   filePath ? `Code Editor for ${getFileName(filePath)}` : 'Code Editor'
        // }
        aria-multiline="true"
        role="textbox"
        tabIndex={0}
        translate="no"
      >
        <pre class="pre-placeholder">
          {syntaxHighlightRender}
        </pre>
      </div>
    )
  }
