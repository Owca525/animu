import { render } from 'solid-js/web'
import App from './App'
import { DialogProvider } from "./utils/context/DialogContext";
import { ContextMenu } from "./utils/context/ContextMenu";
import { ToastProvider } from './utils/context/ToastNotification';
import { I18nProvider } from "./utils/i18n"
import { MenuContextProvider } from './utils/context/menuContext';

import "material-symbols/material-symbols-outlined.woff2"
import "material-symbols/outlined.css"

render(
  () => (
    <I18nProvider config={{ defaultLang: "en", fallbackLang: "en" }}>
      <MenuContextProvider>
        <DialogProvider>
          <ContextMenu>
            <ToastProvider>
              <App />
            </ToastProvider>
          </ContextMenu>
        </DialogProvider>
      </MenuContextProvider>
    </I18nProvider>
  ),
  document.getElementById("root") as HTMLElement
);
