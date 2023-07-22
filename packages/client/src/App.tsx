/* @refresh granular */
import Home from './pages/index'

import { registerSW } from 'virtual:pwa-register'

registerSW({ immediate: true })

export default function App() {
  return (
    <Home />
  )
}
