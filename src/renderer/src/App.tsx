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
  convertHistoryToAnimuList,
  dateToUnix,
  detectPluginVersion,
  fetchPluginRepos,
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
import { getGlobalCache, setAnimulistData, setGlobalHistory, setGlobalTheme, setIncognitoMode } from './utils/stores/global';
import { HashRouter, Route } from '@solidjs/router';
import { getInformationPlugin, pluginManager, setPluginRepo } from './utils/stores/plugins';
import { setHomeActivePage } from './utils/stores/home';
import { toast, updateToast } from './utils/context/ToastNotification';
import { t, useI18n } from './utils/i18n';
import './App.css';
import './themes/darkerAnimu/main.css';
import './utils/i18n';
import { unwrap } from 'solid-js/store';
import { pluginRepoExpanded, themeMetadata } from './utils/types';
import shaka from 'shaka-player';

// import ErrorBoundary from './utils/ErrorBoundary';
// import { notificationProps } from './utils/GlobalInterface';

function App() {
  const { changeLanguage } = useI18n()
  const [isInitation, setInitation] = createSignal<boolean>(true)
  const [initialState, setinitialState] = createSignal<{ text: string, plugin: boolean }>({ text: "initial.history", plugin: false })

  if (window.api) {
    createShortcut(["F12"], () => {
      if (getConfig().Developer.DevTools) window.BrowserWindow.openDevTools()
    })
    createShortcut(["Control", "Shift", "R"], async () => {
      if (getConfig().Developer.DeveloperMode) {
        const idToast = toast(t("global.themereload"), { type: "loading", removeTimer: true })
        setGlobalTheme(await window.api.themes.list())

        const loadedTheme = getGlobalCache().loadedTheme
        let confTheme = [...new Set(unwrap(getConfig().General.theme))]
        let loadingTheme: Map<number, themeMetadata> = new Map()
        for (let index = 0; index < confTheme.length; index++) {
          const element = confTheme[index];
          const theme = loadedTheme.find((ele) => ele.themeName == element)
          if (!theme) continue
          loadingTheme.set(index, unwrap(theme))
        }
        changeTheme(loadingTheme)

        updateToast(idToast, t("global.themereload"), { type: "success", removeTimer: false })
        await window.backend.refresh()
      }
      await import("./utils/exports")
    })
  }

  createShortcut(["Control", "I"], () => {
    setIncognitoMode(!getGlobalCache().incognito)
    toast(t("global.incognitomode", { switch: getGlobalCache().incognito ? t("global.on") : t("global.off") }))
  })

  onMount(async () => {
    shaka.polyfill.installAll()
    
    if (window.api) {
      setConfig(await window.api.getConfig())
      setGlobalHistory(await window.api.getHistory())
    } else {
      if (!localStorage.getItem("config")) localStorage.setItem("config", JSON.stringify(defaultConfigWeb))
      if (!localStorage.getItem("history")) localStorage.setItem("history", JSON.stringify([]))
      setConfig(JSON.parse(localStorage.getItem("config") as any))
      setGlobalHistory(JSON.parse(localStorage.getItem("history") as any))
    }
    setinitialState({ text: "initial.theme", plugin: false })
    if (window.api) setGlobalTheme(await window.api.themes.list())

    setinitialState({ text: "Loading Animulist", plugin: false })
    if (window.api) setAnimulistData(await window.api.animulist.getDatabase())
    else {
      if (!localStorage.getItem("animulist")) localStorage.setItem("animulist", JSON.stringify([]))
        setAnimulistData(JSON.parse(localStorage.getItem("animulist") as any))
    }

    setinitialState({ text: "initial.config", plugin: false })
    LoadConfig()
    setHomeActivePage("global.home")

    setinitialState({ text: "initial.plugin", plugin: false })
    await checkPluginUpdate()
    await getInformationPlugin().initial()
    await pluginManager().initialPlugins()

    setInitation(false)

    detectPluginVersion()

    // Code: https://github.com/cynthia2006/hanime-plugin/blob/master/yt_dlp_plugins/extractor/htv.py
    // const payload = `
    //   delete globalThis.WorkerGlobalScope;
    //   var window = new Proxy({
    //       top: { location: { origin: "" } },
    //       addEventListener: (e, cb) => {}
    //   }, {
    //       set(o, k, v) {
    //           if (k == "ssignature" || k == "stime") self.postMessage(v)

    //           o[k] = v;
    //           return true;
    //       }
    //   });
    //   globalThis.window = window;
    // `

    // const resp = await request("", {
    //       headers: {
    //         "Referer": "",
    //         "Origin": "",
    //         "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0",
    //       }
    // })
    // console.log(resp)

    // const blob = new Blob([payload + resp.text], { type: "text/javascript" });
    // const url = URL.createObjectURL(blob);
    // let token = ""
    // let time = ""

    // const worker = new Worker(url);
    // worker.onmessage = async (event) => {
    //   if (typeof event.data == "object") return console.log(event.data)
    //   if (typeof event.data == "string") token = event.data
    //   else time = event.data
    //   console.log(event.data);
    //   console.log(token, time)
    //   if (token != "" && time != "") {
    //     const resp = await request("", { 
    //       headers: {
    //         "Accept": "application/json",
    //         "Referer": "",
    //         "Origin": "",
    //         "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0",
    //         "x-signature": token,
    //         "x-signature-version": "web2",
    //         "x-time": time,
    //       }
    //     })
    //     console.log(resp)
    //   }
    // };

    // setTimeout(() => worker.terminate(), 1000);


    if (window.api) runCheckUpdate()
  })

  function LoadConfig() {
    if (!window.api) return
    let loadedConnfig = getConfig()

    if (loadedConnfig.animulist.historyConvert) {
      convertHistoryToAnimuList()
      loadedConnfig = updateObjectConfig("animulist.historyConvert", false, loadedConnfig)
      saveConfig(loadedConnfig)
    }

    // Loading theme
    const loadedTheme = getGlobalCache().loadedTheme
    let confTheme = [...new Set(unwrap(loadedConnfig.General.theme))]
    let loadingTheme: Map<number, themeMetadata> = new Map()
    for (let index = 0; index < confTheme.length; index++) {
      const element = confTheme[index];
      const theme = loadedTheme.find((ele) => ele.themeName == element)
      if (!theme) continue
      loadingTheme.set(index, unwrap(theme))
    }
    changeTheme(loadingTheme)

    changeLanguage(loadedConnfig.General.language)
    if (loadedConnfig.General.Window.AutoMaximize) window.BrowserWindow.setMaximize()
    window.BrowserWindow.setZoom(calculateZoomLevel(parseFloat(loadedConnfig.General.Window.Zoom.toString())))
    window.BrowserWindow.setFullscreen(loadedConnfig.General.Window.AutoFullscreen)

    if (!loadedConnfig.backup.enable) return
    if (!checkDate(loadedConnfig.backup.lastCheck, loadedConnfig.backup.check)) return
    CreateBackup()
    saveConfig(updateObjectConfig("backup.lastCheck", dateToUnix(new Date().toString()), loadedConnfig))
    window.backend.refresh()
  }


  return (
    <Switch>
      <Match when={isInitation()}>
        <main class='animu-initial-container'>
          <img src={icon} alt="Animu Icon" class='animu-initial-icon' />
          <div class="animu-initial-content">
            <span class='animu-initial-text'>{t("initial.animu")}</span>
            <div class="animu-initial-state">
              <span class='material-symbols-outlined loading-animation'>progress_activity</span>
              <span class='animu-initial-text'>{t(initialState().text)}</span>
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

async function checkPluginUpdate() {
  const config = getConfig()
  let tmpDatabase: pluginRepoExpanded[] = []
  try {
    tmpDatabase = localStorage.getItem("pluginDatabase") ? JSON.parse(localStorage.getItem("pluginDatabase") as any) : []
  } catch (error) { console.warn("Error failed parsed pluginRepo Database", error) }

  if (config.plugins.pluginCheckType == "On Start" || tmpDatabase.length <= 0 || config.plugins.lastTimeCheck <= 0) return await fetchPluginRepos()
  if (checkDate(config.plugins.lastTimeCheck, config.plugins.pluginCheckType)) await fetchPluginRepos()
  else { setPluginRepo(tmpDatabase) }
}

async function runCheckUpdate() {
  let config = getConfig()
  if (config.update.type == "On Start") await checkUpdate()
  if (checkDate(config.update.lastTime, config.update.type)) await checkUpdate()
}

export default App
