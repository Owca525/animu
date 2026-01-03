import Home from './pages/home/index';
import icon from '../../../build/icon.png';
import Information from './pages/information/index';
import LocalErrorBoundary from './utils/ErrorBoundary';
import Player from './pages/player/index';
import Settings from './pages/settings/index';
import {
  calculateZoomLevel,
  changeTheme,
  checkDate,
  updateObjectConfig
  } from './utils/functions';
import { checkUpdate } from './utils/update';
import { CreateBackup } from './utils/backup';
import { createShortcut } from '@solid-primitives/keyboard';
import {
  createSignal,
  ErrorBoundary,
  Match,
  onMount,
  Suspense,
  Switch
  } from 'solid-js';
import { defaultConfigWeb, saveConfig } from './utils/FilesManager/config';
import { getConfig, setConfig } from './utils/stores/config';
import { getGlobalCache, setGlobalHistory, setGlobalTheme, setIncognitoMode } from './utils/stores/global';
import { HashRouter, Route } from '@solidjs/router';
import { pluginManager } from './utils/stores/plugins';
import { setHomeActivePage } from './utils/stores/home';
import { toast } from './utils/context/ToastNotification';
import { useI18n } from './utils/i18n';
import './App.css';
import './themes/darkerAnimu/main.css';
import './utils/i18n';
import { unwrap } from 'solid-js/store';

// import ErrorBoundary from './utils/ErrorBoundary';
// import { notificationProps } from './utils/GlobalInterface';

function App() {
  const { t, changeLanguage } = useI18n()
  const [isInitation, setInitation] = createSignal<boolean>(true)
  const [initialState, setinitialState] = createSignal<{ text: string, plugin: boolean }>({ text: "Loading History", plugin: false })

  if (window.api) {
    createShortcut(["F12"], () => {
      if (getConfig().Developer.DevTools) window.BrowserWindow.openDevTools()
    })
    createShortcut(["Control", "Shift", "R"], async () => {
      if (getConfig().Developer.DeveloperMode) {
        await changeTheme(getConfig().General.theme)
        toast("Reloaded Theme")
      }
    })
  }

  createShortcut(["Control", "I"], () => {
    setIncognitoMode(!getGlobalCache().incognito)
    toast(`Incognito Mode: ${getGlobalCache().incognito ? "On" : "Off"}`)
  })

  onMount(async () => {
    if (window.api) {
      setConfig(await window.api.getConfig())
      setGlobalHistory(await window.api.getHistory())
    } else {
      if (!localStorage.getItem("config")) localStorage.setItem("config", JSON.stringify(defaultConfigWeb))
      if (!localStorage.getItem("history")) localStorage.setItem("history", JSON.stringify([]))
      setConfig(JSON.parse(localStorage.getItem("config") as any))
      setGlobalHistory(JSON.parse(localStorage.getItem("history") as any))
    }
    setinitialState({ text: "Loading Theme", plugin: false })
    setGlobalTheme(await window.api.themes.list()) 

    setinitialState({ text: "Loading Config", plugin: false })
    LoadConfig()
    setHomeActivePage(t("global.home"))

    setinitialState({ text: "Loading Plugin", plugin: false })
    pluginManager().initialPlugins()
    setInitation(false)

    if (window.api) runCheckUpdate()
  })

  function LoadConfig() {
    if (!window.api) return
    const loadedConnfig = getConfig()
    console.log(unwrap(loadedConnfig))

    // Loading theme
    changeTheme(loadedConnfig.General.theme)

    changeLanguage(loadedConnfig.General.language)
    if (loadedConnfig.General.Window.AutoMaximize) window.BrowserWindow.setMaximize()
    window.BrowserWindow.setZoom(calculateZoomLevel(parseFloat(loadedConnfig.General.Window.Zoom.toString())))
    window.BrowserWindow.setFullscreen(loadedConnfig.General.Window.AutoFullscreen)

    if (!loadedConnfig.backup.enable) return
    if (!checkDate(loadedConnfig.backup.lastCheck, loadedConnfig.backup.check)) return
    CreateBackup()
    saveConfig(updateObjectConfig("backup.lastCheck", new Date().getTime(), loadedConnfig))
    // TODO: add backend refreas
  }


  return (
    <Switch>
      <Match when={isInitation()}>
        <main class='animu-initial-container'>
          <img src={icon} alt="Animu Icon" class='animu-initial-icon' />
          <div class="animu-initial-content">
            <span class='animu-initial-text'>Animu is initializing</span>
            <div class="animu-initial-state">
              <span class='material-symbols-outlined loading-animation'>progress_activity</span>
              <span class='animu-initial-text'>{initialState().text}</span>
            </div>
          </div>
        </main>
      </Match>
      <Match when={!isInitation()}>
        <ErrorBoundary fallback={LocalErrorBoundary}>
          <HashRouter>
            <Suspense >
              <Route path="/" component={Home} />
              <Route path="/info" component={Information} />
              <Route path="/settings" component={Settings} />
              <Route path="/player" component={Player} />
            </Suspense>
          </HashRouter>
        </ErrorBoundary>
      </Match>
    </Switch>
  )
}

async function runCheckUpdate() {
  let config = getConfig()
  if (config.update.type == "On Start") await checkUpdate()
  if (checkDate(config.update.lastTime, config.update.type as any)) await checkUpdate()
}

export default App
