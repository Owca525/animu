import { render } from 'solid-js/web'
import App from './App'
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { DialogProvider } from "./utils/context/DialogContext";
import { ContextMenu } from "./utils/context/ContextMenu";
import { ToastProvider } from './utils/context/ToastNotification';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000,
    },
  },
})

render(
  () => (
    <DialogProvider>
      <ContextMenu>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <App />
          </ToastProvider>
        </QueryClientProvider>
      </ContextMenu>
    </DialogProvider>
  ),
  document.getElementById("root") as HTMLElement
);
