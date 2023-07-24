import './styles/globals.css'

import { render } from 'solid-js/web'

import App from './App'

const app = document.getElementById('root')

if (app) {
  render(() => <App />, app)
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
}
