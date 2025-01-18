import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './App.css'

// Import language support
import './utils/i18n'
import { DialogContext } from './utils/context/DialogContext'
import { InformationContext } from './utils/context/InformationContext'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <InformationContext>
      <DialogContext>
        <App />
      </DialogContext>
    </InformationContext>
  </React.StrictMode>
)
