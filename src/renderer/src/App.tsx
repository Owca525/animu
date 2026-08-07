import Home from './pages/home/index';
import icon from '@resources/icon.png';
import Information from './pages/information/index';
import Player from './pages/player/index';
import Settings from './pages/settings/index';

// const Home = lazy(() => import("./pages/home/index"));
// const Player = lazy(() => import("./pages/player/index"));
// const Settings = lazy(() => import("./pages/settings/index"));
// const Information = lazy(() => import("./pages/information/index"));

import {
  calculateZoomLevel,
  changeTheme,
  checkAnimeTodayReleaseEpisode,
  checkDate,
  checkTimeDriffrentUnix,
  dateToUnix,
  deepMerge,
  getTodayAnilistAnime,
  timeCovertToMs,
  updateObject
} from './utils/functions';
import { checkUpdate } from './utils/update';
import { convertHistoryToAnimuList, setNewAnimuList } from './utils/FilesManager/animulist';
import { CreateBackup } from './utils/backup';
import {
  createSignal,
  Match,
  onMount,
  Suspense,
  Switch
} from 'solid-js';
import { defaultConfigWeb, saveConfig } from './utils/FilesManager/config';
import {
  getGlobalCache,
  isPluginSearchMode,
  setAudioOutput,
  setDeepLink,
  setDeeplinkRunned,
  setGlobalTheme,
  setIncognitoMode,
  setPluginSearchMode,
  setTodayAnimeInAnilist,
  setYT_DLPVersion
} from './utils/stores/global';

import "./utils/NotificationManager"
import { getConfig, setConfig } from './utils/stores/config';
import { setPluginRepo } from './utils/stores/plugins';
import { HashRouter, Route } from '@solidjs/router';
import { pluginRepoExpanded, themeMetadata } from './utils/types';
import { setHomeActivePage } from './utils/stores/home';
import { t, useI18n } from './utils/i18n';
import { toast, updateToast } from './utils/context/ToastNotification';
import { unwrap } from 'solid-js/store';
import './App.css';
import './themes/darkerAnimu/main.css';
import './utils/i18n';
import "./utils/socket"
import "./utils/stores/global"

/* IFDEF DEBUG|PROD */
import {
  fetchAnimeDeepLink,
  fetchDeepLink,
} from './utils/functions';
/* ENDIF */

/* IFDEF DEBUG */
import './utils/debug';
/* ENDIF */

import { setHome } from './pages/home/homeUtils';
import { SheepShortcut } from './utils/hooks/useKeyPress';
import { ServiceManager } from './utils/service';
import pluginManager from './utils/pluginManager';
import { createGlobalError } from './utils/context/GlobalErrorContext';
import { setNewHistory } from './utils/FilesManager/history';

// import ErrorBoundary from './utils/ErrorBoundary';
// import { notificationProps } from './utils/GlobalInterface';

// /* IFDEF PROD */
// import './utils/logger';
// /* ENDIF */

function App() {
  const { changeLanguage } = useI18n()
  const [isInitation, setInitation] = createSignal<boolean>(true)
  const [initialState, setinitialState] = createSignal<{ text: string, plugin: boolean }>({ text: "initial.history", plugin: false })

  /* IFDEF DEBUG|PROD */
  SheepShortcut(["F12"], () => {
    if (getConfig().Developer.DeveloperMode) window.BrowserWindow.openDevTools()
  })

  SheepShortcut(["Control", "Shift", "R"], async () => {
    if (!getConfig().Developer.DeveloperMode) return

    const idToast = toast(t("global.themereload"), { type: "loading", timer: true })
    setGlobalTheme([
      ...window["animuAppInfo"]["themes"],
      ...await window.api.themes.list()
    ])

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

    updateToast(idToast, t("global.themereload"), { type: "success", timer: false })
    await window.backend.refresh()
  })
  /* ENDIF */

  SheepShortcut(["Control", "Shift", "|"], () => {
    setPluginSearchMode(!isPluginSearchMode())
    toast(`Plugin Search Mode ${isPluginSearchMode()}`, { type: "info" })
    if (isPluginSearchMode()) toast("This Mode can broke some things in animu")
  })

  SheepShortcut(["Control", "I"], () => {
    setIncognitoMode(!getGlobalCache().incognito)
    toast(t("global.incognitomode", { switch: getGlobalCache().incognito ? t("global.on") : t("global.off") }))
  })

  onMount(async () => {
    try {
      /* IFDEF WEB */
      /* ENDIF */

      try {
        const tmp = JSON.parse(localStorage.getItem("pluginStatusCachce") as any)
        const time = checkTimeDriffrentUnix(dateToUnix(new Date().toString()), tmp["time"])
        if (time["min"] > 44 && time["hour"] >= 0) localStorage.removeItem("pluginStatusCachce")
      } catch (error) { }

      await pluginManager.initialPlugins()
      await pluginManager.changeInformationPlugin("AnilistApi")

      getTodayAnilistAnime().then((v) => {
        setTodayAnimeInAnilist(v)
      })

      /* IFDEF DEBUG|PROD */
      if (!getGlobalCache().deeplinkRunned) {
        window.api.onProtocolRequest(fetchDeepLink)
        setDeeplinkRunned(true)
      }

      setDeepLink({
        name: 'Fetch Anime',
        code: '',
        func: fetchAnimeDeepLink
      })

      window.api.yt_dlp.versionList().then((v) => {
        setYT_DLPVersion(v)
      }).catch((v) => console.error("Failed Set YT_DLP Version", v))
      /* ENDIF */

      /* IFDEF WEB */
      if (!localStorage.getItem("config")) localStorage.setItem("config", JSON.stringify(defaultConfigWeb))
      if (!localStorage.getItem("history")) localStorage.setItem("history", JSON.stringify([]))
      setConfig(deepMerge(defaultConfigWeb, JSON.parse(localStorage.getItem("config") as any)))
      setNewHistory(JSON.parse(localStorage.getItem("history") as any))
      /* ENDIF */

      /* IFDEF DEBUG|PROD */
      setConfig(await window.api.getConfig())
      setNewHistory(await window.api.getHistory())
      /* ENDIF */

      setinitialState({ text: "initial.theme", plugin: false })
      /* IFDEF DEBUG|PROD */
      setGlobalTheme([
        ...window["animuAppInfo"]["themes"],
        ...await window.api.themes.list()
      ]);
      /* ENDIF */

      (window as any).ServiceManager = () => ServiceManager

      setinitialState({ text: "Loading Animulist", plugin: false })
      /* IFDEF DEBUG|PROD */
      setNewAnimuList(await window.api.animulist.getDatabase())
      /* ENDIF */

      /* IFDEF WEB */
      if (!localStorage.getItem("animulist")) localStorage.setItem("animulist", JSON.stringify([]))
      setNewAnimuList(JSON.parse(localStorage.getItem("animulist") as any))
      /* ENDIF */

      setinitialState({ text: "initial.config", plugin: false })
      /* IFDEF DEBUG|PROD */
      LoadConfig()
      /* ENDIF */
      setHomeActivePage("global.home")

      setinitialState({ text: "initial.plugin", plugin: false })

      setHome()

      setInitation(false)
      initialServices()

      /* IFDEF DEBUG|PROD */
      runCheckUpdate()
      /* ENDIF */
    } catch (error) {
      createGlobalError(error)
    }
  })

  function LoadConfig() {
    let loadedConnfig = getConfig()
    // await navigator.mediaDevices.enumerateDevices()

    pluginManager.changePlayerPlugin(loadedConnfig["plugins"]["player"])

    navigator.mediaDevices.enumerateDevices().then((element) => {
      const audioOutputs = element.filter(device => device.kind === "audiooutput")

      audioOutputs.forEach((el) => {
        if (el.label.toLowerCase() == loadedConnfig.General.audioOutput.toLowerCase()) setAudioOutput(el)
      })
    })

    if (loadedConnfig.animulist.historyConvert) {
      convertHistoryToAnimuList()
      loadedConnfig = updateObject("animulist.historyConvert", false, loadedConnfig)
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
    /* IFDEF DEBUG|PROD */
    if (loadedConnfig.General.Window.AutoMaximize) window.BrowserWindow.setMaximize()
    window.BrowserWindow.setZoom(calculateZoomLevel(parseFloat(loadedConnfig.General.Window.Zoom.toString())))
    window.BrowserWindow.setFullscreen(loadedConnfig.General.Window.AutoFullscreen)

    if (!loadedConnfig.backup.enable) return
    if (!checkDate(loadedConnfig.backup.lastCheck, loadedConnfig.backup.check)) return
    CreateBackup()
    saveConfig(updateObject("backup.lastCheck", dateToUnix(new Date().toString()), loadedConnfig))
    window.backend.refresh()
    /* ENDIF */
  }

  return (
    <Switch>
      <Match when={isInitation()}>
        <main class='animu-initial-container'>
          <span></span>
          <img src={icon} alt="Animu Icon" class='animu-initial-icon' />
          <div class="animu-initial-content">
            <span class='animu-initial-text'>{t("initial.animu")}</span>
            <div class="animu-initial-state">
              <span class='animu-initial-text'>{t(initialState().text)}</span>
            </div>
          </div>
          <span class='material-symbols-outlined loading-animation icon'>progress_activity</span>
        </main>
      </Match>
      <Match when={!isInitation()}>
        <HashRouter>
          <Suspense >
            <Route path="/" component={Home} />
            <Route path="/info" component={Information} />
            <Route path="/settings" component={Settings} />
            <Route path="/player" component={Player} />
          </Suspense>
        </HashRouter>
      </Match>
    </Switch>
  )
}

async function checkPluginUpdate(): Promise<any> {
  const config = getConfig()
  let tmpDatabase: pluginRepoExpanded[] = []
  try {
    if (localStorage.getItem("AnimuPluginDatabase")) {
      tmpDatabase = JSON.parse(localStorage.getItem("AnimuPluginDatabase") as any)
    } else tmpDatabase = await pluginManager.checkUpdates()
  } catch (error) { console.warn("Error failed parsed pluginRepo Database", error) }

  if (config.plugins.pluginCheckType == "On Start" || config.plugins.lastTimeCheck <= 0) return await pluginManager.checkUpdates()
  if (checkDate(config.plugins.lastTimeCheck, config.plugins.pluginCheckType)) await pluginManager.checkUpdates()
  else { setPluginRepo(tmpDatabase) }
}

async function runCheckUpdate() {
  let config = getConfig()
  if (config.update.type == "On Start") await checkUpdate()
  if (checkDate(config.update.lastTime, config.update.type)) await checkUpdate()
}

function initialServices() {
  const config = getConfig()

  ServiceManager.InitialServiceManager([
    {
      active: true,
      execute: async () => {
        try {
          const tmp = JSON.parse(localStorage.getItem("pluginStatusCachce") as any)
          const time = checkTimeDriffrentUnix(dateToUnix(new Date().toString()), tmp["time"])
          if (time["min"] > 359 && time["hour"] >= 0) localStorage.removeItem("pluginStatusCachce")
        } catch (error) { }

        await pluginManager.checkStatusServerInPlugins(localStorage.getItem("pluginStatusCachce") == undefined)
      },
      name: t("PluginStatus"),
      description: t("Check Status Of Player Plugins"),
      activeTime: timeCovertToMs({ min: 360 })
    },
    {
      active: !window["animuAppInfo"]["flags"]["WEB"] && config.update.type == "On Start",
      execute: checkUpdate,
      name: t('AnimUpdate'),
      description: "Check Animu Update",
      noFirstStart: true,
      activeTime: timeCovertToMs({ min: 60 })
    },
    {
      active: true,
      execute: checkPluginUpdate,
      name: t('PluginUpdates'),
      activeTime: timeCovertToMs({ min: 30 }),
      description: t("Check Plugins are Updated")
    },
    {
      active: true,
      execute: async () => {
        setTodayAnimeInAnilist(await getTodayAnilistAnime())
      },
      name: t('DailyAnilist'),
      description: t("Check Daily Anilist"),
      activeTime: timeCovertToMs({ hour: 3 })
    },
    // {
    //   active: true,
    //   execute: checkAnimeTodayReleaseEpisode,
    //   name: t("EpisodesAvaible"),
    //   description: t("Check Is Anime episode avaible"),
    //   activeTime: timeCovertToMs({ min: 40 })
    // }
  ])

  // if (unwrap(getAnilistUserData())) {
  //   runService(FetchAnilistUserData, timeCovertToMs({ hour: 2 }), t("Anilist Sync UserData"))
  // }
}

export default App
