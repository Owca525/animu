import { Routes, Route, HashRouter } from 'react-router-dom'
import { Suspense } from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css';
import 'material-symbols'

import Home from "./pages/home/index"
import Information from "./pages/information/index"
import Settings from "./pages/settings/index"
import Player from "./pages/player/index"

// Temporally
import "./themes/DarkAnimu.css"
import { checkConfig, readConfig } from './utils/config';
import store from './utils/store';

import "./utils/i18n"
import { CheckContinue } from './utils/history/continueWatch';
import { CheckHistory } from './utils/history/history';
import { checkUpdate } from './utils/update';
import { calculateZoomLevel, checkDate } from './utils/functions';
import i18n from './utils/i18n';
import ErrorBoundary from './utils/ErrorBoundary';
import useHotkeys from '@reecelucas/react-use-hotkeys';

LoadConfig()

function App() {
  useHotkeys("F12", () => window.BrowserWindow.openDevTools())

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

function AppLoading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="loading material-symbols-outlined">progress_activity</div>
    </div>
  )
}

async function LoadConfig() {
  await CheckContinue()
  await CheckHistory()
  if (!await checkConfig()) return
  const loadedConnfig = await readConfig()

  // Loading theme
  const themes = await window.api.getlistThemes()
  let path: string = themes[0].path
  themes.forEach((element) => {
    if (element.filename.replace(".css", "") == loadedConnfig.General.theme) path = element.path
  })

  const link = document.createElement('link');
  link.id = 'theme-stylesheet';
  link.rel = 'stylesheet';
  link.href = path;
  document.head.appendChild(link);

  i18n.changeLanguage(loadedConnfig.General.language)
  if (loadedConnfig.General.Window.AutoMaximize) window.BrowserWindow.setMaximize()
  if (loadedConnfig.Developer.DevToolsOnStart) window.BrowserWindow.openDevTools()
  window.BrowserWindow.setZoom(calculateZoomLevel(parseFloat(loadedConnfig.General.Window.Zoom.toString())))
  window.BrowserWindow.setFullscreen(loadedConnfig.General.Window.AutoFullscreen)

  if (loadedConnfig.update.type == "On Start") checkUpdate()
  if (loadedConnfig.update.type == "Every Day" && checkDate(loadedConnfig.update.lastTime, "day")) checkUpdate()
  if (loadedConnfig.update.type == "Every Week" && checkDate(loadedConnfig.update.lastTime, "week")) checkUpdate()

  store.dispatch({ type: "setConfig", payload: loadedConnfig })
}

export default App
