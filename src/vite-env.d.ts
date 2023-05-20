/// <reference types="vite/client" />
/// <reference types="vite-plugin-pages/client-react" />

declare module '*.svg' {
  import type { ComponentProps, FunctionComponent } from 'react'

  export const ReactComponent: FunctionComponent<
    ComponentProps<'svg'> & { title?: string }
  >
}
