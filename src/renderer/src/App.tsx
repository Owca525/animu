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
import { onMount, Suspense, ErrorBoundary, createSignal, Show } from 'solid-js';
import { HashRouter, Route } from "@solidjs/router";

import Home from "./pages/home/index";
import Information from "./pages/information/index";
import Settings from "./pages/settings/index";
import Player from "./pages/player/index";
import toast, { Toaster } from 'solid-toast';
import { getConfig, setConfig } from './utils/stores/config';
import { getGlobalCache, setGlobalHistory, setIncognitoMode } from './utils/stores/global';
import i18n from './utils/i18n';
import { getPlayerPLugin } from './utils/stores/plugins';
import LocalErrorBoundary from './utils/ErrorBoundary';
import { defaultConfigWeb } from './utils/FilesManager/config';

function App() {
  const [isInitation, setInitation] = createSignal<boolean>(true)

  if (window.api) {
    createShortcut(["F12"], () => {
      if (getConfig().Developer.DevTools) window.BrowserWindow.openDevTools()
    })
    createShortcut(["Control", "Shift", "R"], async () => {
      if (getConfig().Developer.DeveloperMode) {
        await changeTheme(getConfig().General.theme)
        toast.success("Reloaded Theme")
      }
    })
  }

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
    if (window.api) {
      setConfig(await window.api.getConfig())
      setGlobalHistory(await window.api.getHistory())
    } else {
      if (!localStorage.getItem("config")) localStorage.setItem("config", JSON.stringify(defaultConfigWeb))
      if (!localStorage.getItem("history")) localStorage.setItem("history", JSON.stringify([]))
      if (!localStorage.getItem("continueWatch")) localStorage.setItem("continueWatch", JSON.stringify([]))
      setConfig(JSON.parse(localStorage.getItem("config") as any))
      setGlobalHistory({ continue: JSON.parse(localStorage.getItem("continueWatch") as any), history: JSON.parse(localStorage.getItem("history") as any) })
    }
    InitialPlugin()
    LoadConfig()
    setInitation(false)
    if (window.api) {
      runCheckUpdate()
    }
  })

  return (
    <Show when={isInitation() == false}>
      <ErrorBoundary fallback={LocalErrorBoundary}>
        <Toaster position="top-right" />
        <HashRouter>
          <Suspense >
            <Route path="/" component={Home} />
            <Route path="/info" component={Information} />
            <Route path="/settings" component={Settings} />
            <Route path="/player" component={Player} />
          </Suspense>
        </HashRouter>
      </ErrorBoundary>
    </Show>
  )
}

async function runCheckUpdate() {
  let config = getConfig()
  if (config.update.type == "On Start") await checkUpdate()
  if (config.update.type == "Every Day" && checkDate(config.update.lastTime, "day")) await checkUpdate()
  if (config.update.type == "Every Week" && checkDate(config.update.lastTime, "week")) await checkUpdate()
}

async function LoadConfig() {
  if (!window.api) return
  const loadedConnfig = getConfig()

  // Loading theme
  await changeTheme(loadedConnfig.General.theme)

  i18n.changeLanguage(loadedConnfig.General.language)
  if (loadedConnfig.General.Window.AutoMaximize) window.BrowserWindow.setMaximize()
  window.BrowserWindow.setZoom(calculateZoomLevel(parseFloat(loadedConnfig.General.Window.Zoom.toString())))
  window.BrowserWindow.setFullscreen(loadedConnfig.General.Window.AutoFullscreen)
}

export default App
