import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './App.css'

// Import language support
import './utils/i18n'
import { DialogContext } from './utils/context/DialogContext'
import { QueryClient, QueryClientProvider } from 'react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 0,
      staleTime: 0,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <DialogContext>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </DialogContext>
  </React.StrictMode>
)
