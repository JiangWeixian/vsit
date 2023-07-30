import { createContext } from 'solid-js'

interface VsitContextProps {
  handleFormat(): void
  handleExec(): void
}

export const VsitContext = createContext<VsitContextProps>()
export const VsitProvider = VsitContext.Provider
