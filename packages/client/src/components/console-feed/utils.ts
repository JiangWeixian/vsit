import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { javascript } from '@codemirror/lang-javascript'
import { HighlightStyle } from '@codemirror/language'
import { tags } from '@lezer/highlight'

import type { LanguageSupport } from '@codemirror/language'

// TODO: add types
type CustomLanguage = any

export const getLanguageFromFile = (
  filePath: string | undefined,
  fileType: string | undefined,
  additionalLanguages: CustomLanguage[],
): string => {
  if (!filePath && !fileType) {
    return 'javascript'
  }

  let extension = fileType
  if (!extension && filePath) {
    const extensionDotIndex = filePath.lastIndexOf('.')
    extension = filePath.slice(extensionDotIndex + 1)
  }

  for (const additionalLanguage of additionalLanguages) {
    if (
      extension === additionalLanguage.name
      || additionalLanguage.extensions.includes(extension || '')
    ) {
      return additionalLanguage.name
    }
  }

  switch (extension) {
    case 'ts':
    case 'tsx':
      return 'typescript'
    case 'html':
    case 'svelte':
    case 'vue':
    case 'astro':
      return 'html'
    case 'css':
    case 'less':
    case 'scss':
      return 'css'
    case 'js':
    case 'jsx':
    case 'json':
    default:
      return 'javascript'
  }
}

export const getCodeMirrorLanguage = (
  extension: string,
  additionalLanguages: CustomLanguage[],
): LanguageSupport => {
  const options: Record<string, LanguageSupport> = {
    javascript: javascript({ jsx: true, typescript: false }),
    typescript: javascript({ jsx: true, typescript: true }),
    html: html(),
    css: css(),
  }

  for (const additionalLanguage of additionalLanguages) {
    if (extension === additionalLanguage.name) {
      return additionalLanguage.language
    }
  }

  return options[extension as keyof typeof options]
}

const THEME_PREFIX = 'vit'
const classNameToken = (name: string): string =>
  `${THEME_PREFIX}-syntax-${name}`

// TODO: add types
type SandpackTheme = any
export const getSyntaxHighlight = (theme?: SandpackTheme): HighlightStyle =>
  HighlightStyle.define([
    {
      tag: [tags.function(tags.variableName), tags.function(tags.propertyName), tags.url, tags.processingInstruction],
      color: 'hsl(207, 82%, 66%)',
    },
    { tag: [tags.tagName, tags.heading], color: '#e06c75' },
    { tag: [tags.comment, tags.quote], color: '#54636D' },
    { tag: [tags.propertyName], color: 'hsl(220, 14%, 71%)' },
    { tag: [tags.atom, tags.number, tags.bool, tags.attributeName], color: 'hsl( 29, 54%, 61%)' },
    { tag: tags.className, color: 'hsl( 39, 67%, 69%)' },
    { tag: tags.keyword, color: 'hsl(286, 60%, 67%)' },
    { tag: [tags.string, tags.regexp, tags.special(tags.propertyName)], color: '#98c379' },

    { tag: tags.link, textDecoration: 'underline' },
    { tag: tags.emphasis, fontStyle: 'italic' },
    { tag: tags.strong, fontWeight: 'bold' },

    {
      // Standard tags, e.g <h1 />
      tag: tags.standard(tags.tagName),
      color: '#e06c75',
    },
    {
      tag: [
        // Highlight function call
        tags.function(tags.variableName),

        // Highlight function definition differently (eg: functional component def in React)
        tags.definition(tags.function(tags.variableName)),

        // "Custom tags", meaning React component
        tags.tagName,
      ],
      class: classNameToken('definition'),
    },
    {
      tag: [tags.literal, tags.inserted],
      color: 'hsl(207, 82%, 66%)',
      // class: classNameToken(theme.syntax.string ? 'string' : 'static'),
    },
    {
      tag: tags.punctuation,
      class: classNameToken('punctuation'),
      color: '#54636D',
    },
  ])
