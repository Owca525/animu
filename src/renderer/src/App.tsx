import 'material-symbols'
import "./App.css"
import "./themes/darkerAnimu/main.css"

import "./utils/i18n"
import { checkUpdate } from './utils/update';
import { calculateZoomLevel, changeTheme, checkDate } from './utils/functions';
// import ErrorBoundary from './utils/ErrorBoundary';
// import { notificationProps } from './utils/GlobalInterface';
import { InitialPlugin } from './utils/pluginApi';
import { createShortcut } from '@solid-primitives/keyboard';
import { onMount, Suspense, ErrorBoundary } from 'solid-js';
import { HashRouter, Route } from "@solidjs/router";

import Home from "./pages/home/index2";
import Information from "./pages/information/index";
import Settings from "./pages/settings/index";
// import Player from "./pages/player/index";
import toast, { Toaster } from 'solid-toast';
import { getConfig, setConfig } from './utils/stores/config';
import { getGlobalCache, setGlobalHistory, setIncognitoMode } from './utils/stores/global';
import i18n from './utils/i18n';
import { getPlayerPLugin } from './utils/stores/plugins';

function App() {
  createShortcut(["F12"], () => {
    if (getConfig().Developer.DevTools) window.BrowserWindow.openDevTools()
  })

  createShortcut(["Control", "Shift", "R"], async () => {
    if (getConfig().Developer.DeveloperMode) {
      await changeTheme(getConfig().General.theme)
      toast.success("Reloaded Theme")
    }
  })

  createShortcut(["Control", "I"], () => {
    setIncognitoMode(!getGlobalCache().incognito)
    toast.success(`Incognito Mode: ${getGlobalCache().incognito ? "On" : "Off"}`)
  })

  createShortcut(["D"], () => {
    console.log(getConfig())
    console.log(getPlayerPLugin())
    console.log(getGlobalCache())
  })

  onMount(async () => {
    setConfig(await window.api.getConfig())
    setGlobalHistory(await window.api.getHistory())
    InitialPlugin()
    LoadConfig()
    // runCheckUpdate()
  })

  return (
    <ErrorBoundary fallback={(err) => {
      console.log(err)
      return <div>Error: {err.toString()}</div>
    }}>
      <Toaster position="top-right" />
      <HashRouter>
        <Suspense >
          <Route path="/" component={Home} />
          <Route path="/info" component={Information} />
          <Route path="/settings" component={Settings} />
          {/* <Route path="/player" component={Player} /> */}
        </Suspense>
      </HashRouter>
    </ErrorBoundary>
  )
}

async function runCheckUpdate() {
  let config = getConfig()
  if (config.update.type == "On Start") await checkUpdate()
  if (config.update.type == "Every Day" && checkDate(config.update.lastTime, "day")) await checkUpdate()
  if (config.update.type == "Every Week" && checkDate(config.update.lastTime, "week")) await checkUpdate()
}

async function LoadConfig() {
  const loadedConnfig = getConfig()

  // Loading theme
  await changeTheme(loadedConnfig.General.theme)

  i18n.changeLanguage(loadedConnfig.General.language)
  if (loadedConnfig.General.Window.AutoMaximize) window.BrowserWindow.setMaximize()
  window.BrowserWindow.setZoom(calculateZoomLevel(parseFloat(loadedConnfig.General.Window.Zoom.toString())))
  window.BrowserWindow.setFullscreen(loadedConnfig.General.Window.AutoFullscreen)
}

export default App
