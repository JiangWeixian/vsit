import React from 'react'
import { BrowserRouter, useRoutes } from 'react-router-dom'

import routes from '~react-pages'

const Routes = () => {
  const elements = useRoutes(routes)
  return elements
}

function App() {
  return (
    <BrowserRouter>
      <React.Suspense fallback={<div>loading...</div>}>
        <Routes />
      </React.Suspense>
    </BrowserRouter>
  )
}

export default App
