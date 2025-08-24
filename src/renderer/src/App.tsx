import { Routes, Route, HashRouter } from 'react-router-dom'
import { Suspense, useEffect, useState } from 'react'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css';
import 'material-symbols'

import Home from "./pages/home/index"
import Information from "./pages/information/index"
import Settings from "./pages/settings/index"
import Player from "./pages/player/index"

// Temporally
import "./themes/darkAnimu/DarkAnimu.css"
import { checkConfig, readConfig } from './utils/config';
import store from './utils/store';

import "./utils/i18n"
import { CheckContinue } from './utils/history/continueWatch';
import { CheckHistory } from './utils/history/history';
import { checkUpdate } from './utils/update';
import { calculateZoomLevel, changeTheme, checkDate } from './utils/functions';
import i18n from './utils/i18n';
import ErrorBoundary from './utils/ErrorBoundary';
import { useHotkeys } from 'react-hotkeys-hook';
import { notificationProps } from './utils/GlobalInterface';

function App() {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [textLoading, _setTextLoading] = useState<string>("Loading Config...")
  
  useHotkeys("F12", () => {
    if (store.getState().config.Developer.DevTools) window.BrowserWindow.openDevTools()
  })

  useHotkeys("ctrl+shift+r", async () => {
    if (store.getState().config.Developer.DeveloperMode) {
      await changeTheme(store.getState().config.General.theme)
      toast.info("Reloaded Theme", notificationProps)
    }
  })

  useHotkeys("ctrl+i", () => {
    store.dispatch({ type: "setIcognitoMode", payload: !store.getState().global.incognito })
    toast.info(`Incognito Mode: ${store.getState().global.incognito ? "On" : "Off"}`, notificationProps)
  })

  async function initialAnimu() {
    await LoadConfig()
    setIsLoading(() => false)
  }

  useEffect(() => {
    initialAnimu()
  }, [])

  if (isLoading) return AppLoading(textLoading)

  return (
    <ErrorBoundary>
      <ToastContainer />
      <HashRouter>
        <Suspense fallback={AppLoading()}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/info" element={<Information />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/player" element={<Player />} />
          </Routes>
        </Suspense>
      </HashRouter>
    </ErrorBoundary>
  )
}

function AppLoading(text?: string) {
  return (
    <div className='app-loading-container'>
      <div className="material-symbols-outlined app-loading-animation">progress_activity</div>
      {text && <div className="app-loading-information">{text}</div>}
    </div>
  )
}

async function LoadConfig() {
  if (!await checkConfig()) return
  const loadedConnfig = await readConfig()

  // Loading theme
  await changeTheme(loadedConnfig.General.theme)

  i18n.changeLanguage(loadedConnfig.General.language)
  if (loadedConnfig.General.Window.AutoMaximize) window.BrowserWindow.setMaximize()
  if (loadedConnfig.Developer.DevToolsOnStart) window.BrowserWindow.openDevTools()
  window.BrowserWindow.setZoom(calculateZoomLevel(parseFloat(loadedConnfig.General.Window.Zoom.toString())))
  window.BrowserWindow.setFullscreen(loadedConnfig.General.Window.AutoFullscreen)

  if (loadedConnfig.update.type == "On Start") await checkUpdate()
  if (loadedConnfig.update.type == "Every Day" && checkDate(loadedConnfig.update.lastTime, "day")) await checkUpdate()
  if (loadedConnfig.update.type == "Every Week" && checkDate(loadedConnfig.update.lastTime, "week")) await checkUpdate()
  
  store.dispatch({ type: "setConfig", payload: loadedConnfig })
  await CheckContinue()
  await CheckHistory()
}

export default App
