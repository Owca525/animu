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
import './css/colors/purpleAnimu.css'
import './css/colors/gruvbox.css'
import './css/colors/catppuccin.css'
import { toast, ToastContainer } from 'react-toastify'

function App() {
  const [configIsLoading, setConfigIsLoading] = useState<boolean>(true)
  const [config, setConfig] = useState<SettingsConfig | undefined>(undefined)

  const [_updatePrecent, setupdatePrecent] = useState<number>(0)

  const { t, i18n } = useTranslation()

  const loadConfig = useCallback(async () => {
    await checkConfig()
    const config = await readConfig()
    setConfig(config)

    const container = document.querySelector('#root')
    if (container && config) {
      container.className = config.General.color
    }

    if (config && config.General.Window.AutoMaximize) {
      await window.electron.ipcRenderer.invoke('setMaximize')
    }
    if (config) {
      i18n.changeLanguage(config.General.language)
      await window.electron.ipcRenderer.invoke(
        'setZoom',
        parseFloat(config.General.Window.Zoom.toString())
      )
      await window.electron.ipcRenderer.invoke(
        'setFullscreen',
        config.General.Window.AutoFullscreen
      )
    }

    setConfigIsLoading(false)
  }, [])

  useEffect(() => {
    window.electron.update.updateAvailable((_event, isAvailable, version) => {
      if (isAvailable) {
        toast.info(t('toast.update', { version: version }), { ...notificationProps, onClick: () => { window.electron.update.downloadUpdate(); toast.loading("Updated is downloading, application automatic quit and install update") } });
      }
    });

    window.electron.update.updateProgress((_event, percent) => {
      setupdatePrecent(percent);
    });

    CheckContinue()
    CheckHistory()
  }, [])

  // Load config
  useEffect(() => {
    loadConfig()
  }, [loadConfig])

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
