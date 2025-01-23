import { Routes, Route, HashRouter } from 'react-router-dom'
import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ToastContainer } from 'react-toastify'
import { InformationContext } from './utils/context/InformationContext'
import useHotkeys from '@reecelucas/react-use-hotkeys';
import 'material-symbols'

// Pages
const Settings = lazy(() => import('./pages/settings/index'));
const Player = lazy(() => import('./pages/player'));

// I can't set home to lazy loading because css in card broke idk how, css is full loaded
import Home from "./pages/home"

// config
import { checkConfig, readConfig } from './utils/config'
import { CheckContinue } from './utils/continueWatch'
import { configContext } from './utils/context/small'
import { SettingsConfig } from './utils/interface'
import { CheckHistory } from './utils/history'

// Update
import { checkUpdate } from './utils/update'
import { checkDate } from './utils/time'

function App() {
  const { t, i18n } = useTranslation()

  const [config, setConfig] = useState<SettingsConfig | undefined>(undefined)

  const loadConfig = useCallback(async () => {
    // Check and Load Config
    await checkConfig()
    const config = await readConfig()
    if (config == undefined) return
    setConfig(config)

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
    if (config.update.type == "start") checkUpdate(t, config)
    if (config.update.type == "day" && checkDate(config.update.lastTime, "day")) checkUpdate(t, config)
    if (config.update.type == "week" && checkDate(config.update.lastTime, "week")) checkUpdate(t, config)
  }, [])

  useEffect(() => {
    CheckContinue()
    CheckHistory()
    loadConfig()
  }, [])

  useHotkeys("F12", () => {
    if (config && config.Developer.DevTools) window.BrowserWindow.openDevTools()
  });

  return config == undefined ? (
    AppLoading()
  ) : (
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

export default App
