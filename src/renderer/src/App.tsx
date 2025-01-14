import { Routes, Route, HashRouter } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import 'material-symbols'

// Pages
import Home from './pages/home'
import Settings from './pages/settings'
import Player from './pages/player'

// config
import { checkConfig, readConfig } from './utils/config'
import { CheckContinue } from './utils/continueWatch'
import { configContext } from './utils/context'
import { notificationProps, SettingsConfig } from './utils/interface'
import { CheckHistory } from './utils/history'

// Color palette
import { toast, ToastContainer } from 'react-toastify'

function App() {
  const [configIsLoading, setConfigIsLoading] = useState<boolean>(true)
  const [config, setConfig] = useState<SettingsConfig | undefined>(undefined)

  const [updatePrecent, setupdatePrecent] = useState<number>(0)
  const [updateNotification, setUpdateNotification] = useState<any>()

  const { t, i18n } = useTranslation()

  const loadConfig = useCallback(async () => {
    await checkConfig()
    const config = await readConfig()
    setConfig(config)

    if (config == null) return
    const container = document.querySelector('#root')
    if (container) {
      container.className = config.General.color
    }

    if (config.General.Window.AutoMaximize) window.BrowserWindow.setMaximize()

    const themes = await window.api.getlistThemes()

    let path: string = themes[0].path
    for (let i = 0; i < themes.length; i++) {
      const element = themes[i];
      if (element.filename.replace(".css", "") == config.General.color) {
        path = element.path
      }
    }
    const link = document.createElement('link');
    link.id = 'color-stylesheet';
    link.rel = 'stylesheet';
    link.href = path;
    document.head.appendChild(link);

    i18n.changeLanguage(config.General.language)
    window.BrowserWindow.setZoom(parseFloat(config.General.Window.Zoom.toString()))
    window.BrowserWindow.setFullscreen(config.General.Window.AutoFullscreen)

    setConfigIsLoading(false)
  }, [])

  useEffect(() => {
    window.api.update.updateAvailable((_event, isAvailable, version) => {
      if (isAvailable) {
        toast.info(t('toast.update', { version: version }), { ...notificationProps, onClick: () => { window.api.update.downloadUpdate(); setUpdateNotification(toast.loading(`Download Progress ${updatePrecent.toFixed(1)}%`, notificationProps)) } });
      }
    });

    window.api.update.updateProgress((_event, percent) => {
      setupdatePrecent(percent);
    });

    CheckContinue()
    CheckHistory()
  }, [])

  // Load config
  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  useEffect(() => {
    if (updateNotification == undefined) return

    toast.update(updateNotification, { render: `Download Progress ${updatePrecent.toFixed(1)}%` })
    if (updatePrecent.toFixed(0) == '100') {
      toast.dismiss(updateNotification)
      toast.success("Updated Download, please restart application", notificationProps)
    }

  }, [updatePrecent])

  return configIsLoading ? (
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
