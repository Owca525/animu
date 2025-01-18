import { Routes, Route, HashRouter } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import 'material-symbols'

// Pages
import Home from './pages/home'
import Settings from './pages/settings/index'
import Player from './pages/player'

// config
import { checkConfig, readConfig } from './utils/config'
import { CheckContinue } from './utils/continueWatch'
import { configContext } from './utils/context/small'
import { notificationProps, SettingsConfig } from './utils/interface'
import { CheckHistory } from './utils/history'

import { toast, ToastContainer } from 'react-toastify'

function App() {
  const { t, i18n } = useTranslation()

  const [config, setConfig] = useState<SettingsConfig | undefined>(undefined)
  const [updateNotification, setUpdateNotification] = useState<any>()

  const loadConfig = useCallback(async () => {
    // Check and Load Config
    await checkConfig()
    const config = await readConfig()
    if (config == undefined) return
    setConfig(config)

    // Load Theme
    const themes = await window.api.getlistThemes()
    let path: string = themes[0].path
    for (let i = 0; i < themes.length; i++) {
      const element = themes[i];
      if (element.filename.replace(".css", "") == config.General.theme) {
        path = element.path
      }
    }
    const link = document.createElement('link');
    link.id = 'theme-stylesheet';
    link.rel = 'stylesheet';
    link.href = path;
    document.head.appendChild(link);

    // Set lang, zoom, fullscreen, maximize
    i18n.changeLanguage(config.General.language)
    if (config.General.Window.AutoMaximize) window.BrowserWindow.setMaximize()
    window.BrowserWindow.setZoom(parseFloat(config.General.Window.Zoom.toString()))
    window.BrowserWindow.setFullscreen(config.General.Window.AutoFullscreen)
  }, [])

  useEffect(() => {
    window.api.update.updateAvailable((_event, isAvailable, version) => {
      if (isAvailable) {
        toast.info(t('toast.update', { version: version }), { ...notificationProps, onClick: () => { window.api.update.downloadUpdate(); setUpdateNotification(toast.loading(`Download Progress 0%`, notificationProps)) } });
      }
    });

    window.api.update.updateProgress((_event, percent) => {
      toast.update(updateNotification, { render: `Download Progress ${percent.toFixed(1)}%` })
      if (percent.toFixed(0) == '100') {
        toast.dismiss(updateNotification)
        toast.success("Updated Download, please restart application", notificationProps)
      }
    });

    CheckContinue()
    CheckHistory()
    loadConfig()
  }, [])

  return config == undefined ? (
    <div
      style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
    >
      <div className="loading material-symbols-outlined">progress_activity</div>
    </div>
  ) : (
    <>
      <ToastContainer />
      <configContext.Provider value={config}>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/player" element={<Player />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </HashRouter>
      </configContext.Provider>
    </>
  )
}

export default App
