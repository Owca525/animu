import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { Provider } from 'react-redux';
import './App.css'

// Import language support
import { QueryClient, QueryClientProvider } from 'react-query'
import store from './utils/store';
import { DialogContext } from './utils/context/DialogContext';
import { ContextMenu } from './utils/context/ContextMenu';

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
      <ContextMenu>
        <QueryClientProvider client={queryClient}>
          <Provider store={store}>
            <App />
          </Provider>
        </QueryClientProvider>
      </ContextMenu>
    </DialogContext>
  </React.StrictMode>
)
