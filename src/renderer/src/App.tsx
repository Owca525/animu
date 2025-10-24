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
import "./themes/darkerAnimu/main.css"
import { checkConfig, readConfig } from './utils/FilesManager/config';
import store from './utils/store';

import "./utils/i18n"
import { checkUpdate } from './utils/update';
import { calculateZoomLevel, changeTheme, checkDate } from './utils/functions';
import i18n from './utils/i18n';
import ErrorBoundary from './utils/ErrorBoundary';
import { useHotkeys } from 'react-hotkeys-hook';
import { notificationProps } from './utils/GlobalInterface';
import { InitialPlugin } from './utils/pluginApi';
import { DetectOldVersionHistory } from './utils/FilesManager/readFiles';

function App() {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [textLoading, setTextLoading] = useState<string>("Loading Config...")
  
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
    console.log(store.getState().config)
    store.dispatch({ type: "setIcognitoMode", payload: !store.getState().global.incognito })
    toast.info(`Incognito Mode: ${store.getState().global.incognito ? "On" : "Off"}`, notificationProps)
  })

  async function initialAnimu() {
    await window.api.os.checkOldConfig()
    await LoadConfig()
    DetectOldVersionHistory()
    setTextLoading(() => "Loading Plugins...")
    InitialPlugin()
    setIsLoading(() => false)
    runCheckUpdate()
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

async function runCheckUpdate() {
  let config = store.getState().config
  if (config.update.type == "On Start") await checkUpdate()
  if (config.update.type == "Every Day" && checkDate(config.update.lastTime, "day")) await checkUpdate()
  if (config.update.type == "Every Week" && checkDate(config.update.lastTime, "week")) await checkUpdate()
}

async function LoadConfig() {
  if (!await checkConfig()) return
  const loadedConnfig = await readConfig()

  if (loadedConnfig.General.discordRPC && window.electronAPI.process.env.NODE_ENV != "development") window.api.rpc.runDiscordRPC()

  // Loading theme
  await changeTheme(loadedConnfig.General.theme)

  i18n.changeLanguage(loadedConnfig.General.language)
  if (loadedConnfig.General.Window.AutoMaximize) window.BrowserWindow.setMaximize()
  if (loadedConnfig.Developer.DevToolsOnStart) window.BrowserWindow.openDevTools()
  window.BrowserWindow.setZoom(calculateZoomLevel(parseFloat(loadedConnfig.General.Window.Zoom.toString())))
  window.BrowserWindow.setFullscreen(loadedConnfig.General.Window.AutoFullscreen)
  
  store.dispatch({ type: "setConfig", payload: loadedConnfig })
}

export default App
