import { Routes, Route, HashRouter } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ToastContainer } from 'react-toastify'
import { InformationContext } from './utils/context/InformationContext'
import useHotkeys from '@reecelucas/react-use-hotkeys';
import 'react-toastify/dist/ReactToastify.css';
import 'material-symbols'

// Pages
const Settings = lazy(() => import('./pages/settings/index'));
const Player = lazy(() => import('./pages/player'));

// I can't set home to lazy loading because css in card broke idk how, css is full loaded
import Home from "./pages/home"

// config
import { defaultConfig, readConfig } from './utils/config'
import { configContext } from './utils/context/small'
import { SettingsConfig } from './utils/interface'

// Update
import { checkDate } from './utils/time'
import i18n from './utils/i18n'

const config = LoadConfig()

function App() {

  useHotkeys("F12", () => {
    if (config && config.Developer.DevTools) window.BrowserWindow.openDevTools()
  });

  return (
    <>
      <ToastContainer />
      <configContext.Provider value={config}>
        <HashRouter>
          <InformationContext>
            <Suspense fallback={AppLoading()}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/player" element={<Player />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Suspense>
          </InformationContext>
        </HashRouter>
      </configContext.Provider>
    </>
  )
}

function AppLoading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="loading material-symbols-outlined">progress_activity</div>
    </div>
  )
}

function LoadConfig(): SettingsConfig {
  let config: SettingsConfig = defaultConfig
  readConfig().then(async (value) => {
    config = value as SettingsConfig

    // Load Theme
    const themes = await window.api.getlistThemes()
    let path: string = themes[0].path
    themes.forEach((element) => {
      if (element.filename.replace(".css", "") == config.General.theme) path = element.path
    })

    const link = document.createElement('link');
    link.id = 'theme-stylesheet';
    link.rel = 'stylesheet';
    link.href = path;
    document.head.appendChild(link);

    // Set lang, zoom, fullscreen, maximize
    i18n.changeLanguage(config.General.language)
    if (config.General.Window.AutoMaximize) window.BrowserWindow.setMaximize()
    if (config.Developer.DevToolsOnStart) window.BrowserWindow.openDevTools()
    window.BrowserWindow.setZoom(parseFloat(config.General.Window.Zoom.toString()))
    window.BrowserWindow.setFullscreen(config.General.Window.AutoFullscreen)
    // check update
    if (config.update.enable == false) return
    import("./utils/update").then(({ checkUpdate }) => {
      if (config.update.type == "start") checkUpdate(i18n.t, config)
      if (config.update.type == "day" && checkDate(config.update.lastTime, "day")) checkUpdate(i18n.t, config)
      if (config.update.type == "week" && checkDate(config.update.lastTime, "week")) checkUpdate(i18n.t, config)
    })
  })
  return config
}

export default App
