import { render } from 'solid-js/web'
import App from './App'
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { DialogProvider } from "./utils/context/DialogContext";
import { ContextMenu } from "./utils/context/ContextMenu";
import { ToastProvider } from './utils/context/ToastNotification'; 
import {I18nProvider} from "./utils/i18n"

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
            <I18nProvider config={{ defaultLang: "en", fallbackLang: "en" }}>
              <App />
            </I18nProvider>
          </ToastProvider>
        </QueryClientProvider>
      </ContextMenu>
    </DialogProvider>
  ),
  document.getElementById("root") as HTMLElement
);
