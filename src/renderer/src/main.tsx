import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './App.css'

// Import language support
import './utils/i18n'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
