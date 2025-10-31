import { render } from 'solid-js/web'
import App from './App'
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { DialogProvider } from "./utils/context/DialogContext";
import { ContextMenu } from "./utils/context/ContextMenu";

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
          {/* <StoreProvider> */}
            <App />
          {/* </StoreProvider> */}
        </QueryClientProvider>
      </ContextMenu>
    </DialogProvider>
  ),
  document.getElementById("root") as HTMLElement
);
