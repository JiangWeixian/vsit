import { createContext, useContext } from 'solid-js'

interface VsitContextProps {
  handleFormat(): void
  handleExec(): void
}

export const VsitContext = createContext<VsitContextProps>()
export const useVsitContext = () => useContext(VsitContext)
export const VsitProvider = VsitContext.Provider
