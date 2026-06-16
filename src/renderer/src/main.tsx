import { ErrorBoundary, render } from 'solid-js/web'
import App from './App'
import { DialogProvider } from "./utils/context/DialogContext";
import { ContextMenu } from "./utils/context/ContextMenu";
import { ToastProvider } from './utils/context/ToastNotification';
import { I18nProvider } from "./utils/i18n"
import { MenuContextProvider } from './utils/context/menuContext';

import "material-symbols/material-symbols-outlined.woff2"
import "material-symbols/outlined.css"
import { SocketProvider } from './utils/context/SocketContext';
import LocalErrorBoundary from './utils/ErrorBoundary';

(window as any).animuAppInfo = "PLEASE_REPLACE_ME_ANIMU_FOR_NEW_INFORMATION";

// /* IFDEF DEBUG */
// const originalAddEventListener = document.addEventListener;
// const originalRemoveEventListener = document.removeEventListener;

// document.addEventListener = function(type, listener, options) {
//   console.info("Event Added", type);
//   console.trace()
//   return originalAddEventListener.call(this, type, listener, options);
// };

// document.removeEventListener = function(type, listener, options) {
//   console.info("Event Removed", type);
//   console.trace()
//   return originalRemoveEventListener.call(this, type, listener, options);
// };
// /* ENDIF */

render(
  () => (
    <ErrorBoundary fallback={LocalErrorBoundary}>
      <I18nProvider config={{ defaultLang: "en", fallbackLang: "en" }}>
        <MenuContextProvider>
          <SocketProvider>
            <DialogProvider>
              <ContextMenu>
                <ToastProvider>
                  <App />
                </ToastProvider>
              </ContextMenu>
            </DialogProvider>
          </SocketProvider>
        </MenuContextProvider>
      </I18nProvider>
    </ErrorBoundary>
  ),
  document.getElementById("root") as HTMLElement
);
