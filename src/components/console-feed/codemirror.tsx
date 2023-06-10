/* eslint-disable @typescript-eslint/ban-ts-comment */
// import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
// import {
//   defaultKeymap,
//   deleteGroupBackward,
//   history,
//   historyKeymap,
//   indentLess,
//   indentMore,
// } from '@codemirror/commands'
// import { bracketMatching, syntaxHighlighting } from '@codemirror/language'
// import {
//   Annotation,
//   EditorSelection,
//   EditorState,
//   StateEffect,
// } from '@codemirror/state'
import {
  EditorView,
  // highlightActiveLine,
  // highlightSpecialChars,
  // keymap,
  // lineNumbers,
} from '@codemirror/view'
// import useIntersectionObserver from '@react-hook/intersection-observer'

// import { useSandpack } from '../../hooks/useSandpack'
// import { useSandpackTheme } from '../../hooks/useSandpackTheme'
// import { THEME_PREFIX } from '../../styles'
// import { shallowEqual } from '../../utils/array'
// import { useClassNames } from '../../utils/classNames'
// import { getFileName } from '../../utils/stringUtils'
// import { highlightDecorators } from './highlightDecorators'
// import { highlightInlineError } from './highlightInlineError'
// import {
//   cmClassName,
//   placeholderClassName,
//   readOnlyClassName,
//   tokensClassName,
// } from './styles'
import { useSyntaxHighlight } from './use-syntax-highlight'
import {
  getCodeMirrorLanguage,
  // getEditorTheme,
  getLanguageFromFile,
  getSyntaxHighlight,
  // useCombinedRefs,
} from './utils'
import type { Extension } from '@codemirror/state'
import type { KeyBinding } from '@codemirror/view'
import { Component, createSignal } from 'solid-js'
// import type {
//   CustomLanguage,
//   EditorState as SandpackEditorState,
//   SandpackInitMode,
// } from '../../types'

export type Decorators = Array<{
  className?: string
  line: number
  startColumn?: number
  endColumn?: number
  elementAttributes?: Record<string, string>
}>

interface CodeMirrorProps {
  code: string
  filePath?: string
  fileType?: string
  onCodeUpdate?: (newCode: string) => void
  showLineNumbers?: boolean
  showInlineErrors?: boolean
  wrapContent?: boolean
  editorState?: SandpackEditorState
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
  initMode: SandpackInitMode
  extensions?: Extension[]
  extensionsKeymap?: KeyBinding[]
  /**
   * Provides a way to add custom language modes by supplying a language
   * type, applicable file extensions, and a LanguageSupport instance
   * for that syntax mode
   */
  additionalLanguages?: CustomLanguage[]
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
      showLineNumbers = false,
      showInlineErrors = false,
      wrapContent = false,
      editorState = 'pristine',
      readOnly = false,
      showReadOnly = true,
      decorators,
      initMode = 'lazy',
      extensions = [],
      extensionsKeymap = [],
      additionalLanguages = [],
    },
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // let wrapper: HTMLElement
    // const combinedRef = useCombinedRefs(wrapper, ref)

    let cmView: EditorView
    // const { theme, themeId } = useSandpackTheme()
    const [internalCode, setInternalCode] = createSignal<string>(code)
    const [shouldInitEditor, setShouldInitEditor] = createSignal(
      initMode === 'immediate',
    )

    // const classNames = useClassNames()
    // const { listen } = useSandpack()

    // let prevExtension: Extension[] = []
    // let prevExtensionKeymap: KeyBinding[] = []

    // const { isIntersecting } = useIntersectionObserver(wrapper, {
    //   rootMargin: '600px 0px',
    //   threshold: 0.2,
    // })

    // React.useImperativeHandle(ref, () => ({
    //   getCodemirror: (): EditorView | undefined => cmView.current,
    // }))

    // React.useEffect(() => {
    //   const mode = initMode === 'lazy' || initMode === 'user-visible'

    //   if (mode && isIntersecting) {
    //     setShouldInitEditor(true)
    //   }
    // }, [initMode, isIntersecting])

    const languageExtension = getLanguageFromFile(
      filePath,
      fileType,
      additionalLanguages,
    )
    const langSupport = getCodeMirrorLanguage(
      languageExtension,
      additionalLanguages,
    )
    const highlightTheme = getSyntaxHighlight()

    const syntaxHighlightRender = useSyntaxHighlight({
      langSupport,
      highlightTheme,
      code,
    })

    // decorators need to be sorted by `line`, otherwise it will throw error
    // see https://github.com/codesandbox/sandpack/issues/383
    // const sortedDecorators = React.useMemo(
    //   () =>
    //     decorators
    //       ? decorators.sort((d1, d2) => d1.line - d2.line)
    //       : decorators,
    //   [decorators],
    // )

    // React.useEffect(() => {
    //   if (!wrapper.current || !shouldInitEditor) {
    //     return
    //   }

    //   const customCommandsKeymap: KeyBinding[] = [
    //     {
    //       key: 'Tab',
    //       run: (view): boolean => {
    //         indentMore(view)

    //         const customKey = extensionsKeymap.find(({ key }) => key === 'Tab')

    //         return customKey?.run?.(view) ?? true
    //       },
    //     },
    //     {
    //       key: 'Shift-Tab',
    //       run: ({ state, dispatch }): boolean => {
    //         indentLess({ state, dispatch })

    //         const customKey = extensionsKeymap.find(
    //           ({ key }) => key === 'Shift-Tab',
    //         )

    //         return customKey?.run?.(view) ?? true
    //       },
    //     },
    //     {
    //       key: 'Escape',
    //       run: (): boolean => {
    //         if (readOnly) {
    //           return true
    //         }

    //         if (wrapper.current) {
    //           wrapper.current.focus()
    //         }

    //         return true
    //       },
    //     },
    //     {
    //       key: 'mod-Backspace',
    //       run: deleteGroupBackward,
    //     },
    //   ]

    //   const extensionList = [
    //     highlightSpecialChars(),
    //     history(),
    //     closeBrackets(),

    //     ...extensions,

    //     keymap.of([
    //       ...closeBracketsKeymap,
    //       ...defaultKeymap,
    //       ...historyKeymap,
    //       ...customCommandsKeymap,
    //       ...extensionsKeymap,
    //     ] as KeyBinding[]),
    //     langSupport,

    //     getEditorTheme(),
    //     syntaxHighlighting(highlightTheme),
    //   ]

    //   if (readOnly) {
    //     extensionList.push(EditorState.readOnly.of(true))
    //     extensionList.push(EditorView.editable.of(false))
    //   } else {
    //     extensionList.push(bracketMatching())
    //     extensionList.push(highlightActiveLine())
    //   }

    //   if (sortedDecorators) {
    //     extensionList.push(highlightDecorators(sortedDecorators))
    //   }

    //   if (wrapContent) {
    //     extensionList.push(EditorView.lineWrapping)
    //   }

    //   if (showLineNumbers) {
    //     extensionList.push(lineNumbers())
    //   }

    //   if (showInlineErrors) {
    //     extensionList.push(highlightInlineError())
    //   }

    //   const parentDiv = wrapper.current
    //   const existingPlaceholder = parentDiv.querySelector(
    //     '.sp-pre-placeholder',
    //   )
    //   if (existingPlaceholder) {
    //     parentDiv.removeChild(existingPlaceholder)
    //   }

    //   const view = new EditorView({
    //     doc: code,
    //     extensions: extensionList,
    //     parent: parentDiv,
    //     dispatch: (tr): void => {
    //       view.update([tr])

    //       if (tr.docChanged) {
    //         const newCode = tr.newDoc.sliceString(0, tr.newDoc.length)

    //         setInternalCode(newCode)
    //         onCodeUpdate?.(newCode)
    //       }
    //     },
    //   })

    //   view.contentDOM.setAttribute('data-gramm', 'false')
    //   view.contentDOM.setAttribute('data-lt-active', 'false')
    //   view.contentDOM.setAttribute(
    //     'aria-label',
    //     filePath ? `Code Editor for ${getFileName(filePath)}` : 'Code Editor',
    //   )

    //   if (readOnly) {
    //     view.contentDOM.classList.add('cm-readonly')
    //   } else {
    //     view.contentDOM.setAttribute('tabIndex', '-1')
    //   }

    //   cmView.current = view

    //   return (): void => {
    //     cmView.current?.destroy()
    //   }

    //   // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [
    //   shouldInitEditor,
    //   showLineNumbers,
    //   wrapContent,
    //   themeId,
    //   sortedDecorators,
    //   readOnly,
    // ])

    // React.useEffect(
    //   () => {
    //     const view = cmView.current

    //     const dependenciesAreDiff
    //       = !shallowEqual(extensions, prevExtension.current)
    //       || !shallowEqual(extensionsKeymap, prevExtensionKeymap.current)

    //     if (view && dependenciesAreDiff) {
    //       view.dispatch({
    //         effects: StateEffect.appendConfig.of(extensions),
    //       })

    //       view.dispatch({
    //         effects: StateEffect.appendConfig.of(
    //           keymap.of([...extensionsKeymap] as unknown as KeyBinding[]),
    //         ),
    //       })

    //       prevExtension.current = extensions
    //       prevExtensionKeymap.current = extensionsKeymap
    //     }
    //   },
    //   [extensions, extensionsKeymap],
    // )

    // React.useEffect(() => {
    //   // When the user clicks on a tab button on a larger screen
    //   // Avoid autofocus on mobile as it leads to a bad experience and an unexpected layout shift
    //   if (
    //     cmView.current
    //     && editorState === 'dirty'
    //     && window.matchMedia('(min-width: 768px)').matches
    //   ) {
    //     cmView.current.contentDOM.focus()
    //   }
    //   // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [])

    // Update editor when code passed as prop from outside sandpack changes
    // React.useEffect(() => {
    //   if (cmView.current && typeof code === 'string' && code !== internalCode) {
    //     const view = cmView.current

    //     const selection = view.state.selection.ranges.some(
    //       ({ to, from }) => to > code.length || from > code.length,
    //     )
    //       ? EditorSelection.cursor(code.length)
    //       : view.state.selection

    //     const changes = { from: 0, to: view.state.doc.length, insert: code }

    //     view.dispatch({ changes, selection })
    //   }
    //   // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [code])

    // React.useEffect(
    //   () => {
    //     if (!showInlineErrors) {
    //       return
    //     }

    //     const unsubscribe = listen((message) => {
    //       const view = cmView.current

    //       if (message.type === 'success') {
    //         view?.dispatch({
    //           // @ts-expect-error
    //           annotations: [new Annotation('remove-errors', true)],
    //         })
    //       } else if (
    //         message.type === 'action'
    //         && message.action === 'show-error'
    //         && message.path === filePath
    //         && message.line
    //       ) {
    //         view?.dispatch({
    //           // @ts-expect-error
    //           annotations: [new Annotation('show-error', message.line)],
    //         })
    //       }
    //     })

    //     return (): void => unsubscribe()
    //   },
    //   [listen, showInlineErrors],
    // )

    const handleContainerKeyDown = (evt: KeyboardEvent): void => {
      if (evt.key === 'Enter' && cmView) {
        evt.preventDefault()
        cmView.contentDOM.focus()
      }
    }

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
            // ref={combinedRef}
            // className={classNames('cm', [
            //   classNames(editorState),
            //   classNames(languageExtension),
            //   cmClassName,
            //   tokensClassName,
            // ])}
            translate="no"
          >
            <code
              // className={classNames('pre-placeholder', [placeholderClassName])}
              // style={{ marginLeft: gutterLineOffset() }}
            >
              {syntaxHighlightRender}
            </code>
          </pre>

          {readOnly && showReadOnly && (
            <span
              // className={classNames('read-only', [readOnlyClassName])}
              {...(process.env.TEST_ENV ? { 'data-testId': 'read-only' } : {})}
            >
              Read-only
            </span>
          )}
        </>
      )
    }

    return (
      <div
        // ref={combinedRef}
        aria-autocomplete="list"
        // aria-label={
        //   filePath ? `Code Editor for ${getFileName(filePath)}` : 'Code Editor'
        // }
        aria-multiline="true"
        // className={classNames('cm', [
        //   classNames(editorState),
        //   classNames(languageExtension),
        //   cmClassName,
        //   tokensClassName,
        // ])}
        onKeyDown={handleContainerKeyDown}
        role="textbox"
        tabIndex={0}
        translate="no"
      >
        <pre >
          {syntaxHighlightRender}
        </pre>
      </div>
    )
  }
