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
import DebugContext from './utils/context/debugContext';

/* IFDEF PROD|WEB */
import './utils/logger';
/* ENDIF */

import { ErrorCreatorContext } from './utils/context/GlobalErrorContext';

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

import.meta.glob("./WebComponents/*.ts", {
  eager: true,
})

window["animuHeader"] = {
  "User-Agent": navigator.userAgent,
  Accept: "*/*",
  "Sec-GPC": "1",
  Connection: "keep-alive",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "cross-site",
  "sec-ch-ua-platform": '"Windows"'
}

try {
  if (!localStorage.getItem("animu_time")) {
    localStorage.setItem("animu_time", "0")
  }

  window["animu_timer"] = Number(localStorage.getItem("animu_time"))
  window["animu_timer_interval"] = setInterval(() => {
    window["animu_timer"] = window["animu_timer"] + 5

    localStorage.setItem("animu_time", `${window["animu_timer"]}`)
  }, 5000)
} catch (error) {
  console.error("Failed Run Timer", error)
}

(async () => {
  const variable = await window["tmpData"]
  window["initialMetadata"] = variable

  render(
    () => (
      <I18nProvider config={{ defaultLang: window["initialMetadata"]["config"]["General"]["language"], fallbackLang: "en" }}>
        <ErrorBoundary fallback={LocalErrorBoundary}>
          <ErrorCreatorContext>
            <DebugContext>
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
            </DebugContext>
          </ErrorCreatorContext>
        </ErrorBoundary>
      </I18nProvider>
    ),
    document.getElementById("root") as HTMLElement
  );
})();
