import { app, shell, BrowserWindow, Menu, ipcMain, crashReporter, Tray, dialog, Notification, session } from 'electron'
import { optimizer, is } from '@electron-toolkit/utils'
import path, { join } from 'path'

// Files import
import icon from '../../build/icon.png?asset'
import "./utils"
import "./window"
import "./update"
import "./streaming"
import "./backup"
import "./animulist"
import "./playlist"
import "./theme"
import "./plugins"

import { convertToNewFormat, detectOldVersion, write } from './os'
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'fs'
import { cardData, defaultConfig, SettingsConfig } from './types';
import { advanceRequest, checkConfigFolder, deepMerge, detectZoom, setupDiscordRPC } from './utils';
import { electronAppUniversalProtocolClient } from 'electron-app-universal-protocol-client';
import { checkDatabase } from './animulist';
import { ParseINI } from './iniParser';
import { t } from './i18n'
import { yt_dlpInstance } from './ytdlpHandler'
import { getThemeList } from './theme'
import { Server } from './server/main'

const server = new Server
export let mainWindow: BrowserWindow | undefined
export let userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.7778.254 Safari/537.36"
export const animuUserData = app.getPath("userData")
export const backupFolder = app.getPath("userData")
export const newConfigPath = path.join(animuUserData, "animuConfig")
export const themeConfigPath = path.join(newConfigPath, "themeConfig")
export const pluginsConfigPath = path.join(newConfigPath, "pluginsConfig")
export const animuPlaylistPath = path.join(newConfigPath, "playlist")
export const userPlugins = path.join(newConfigPath, "plugins")
export const animuPlugins = path.join(animuUserData, "animuPlugins")
export let globalTray: undefined | Tray = undefined
export const mainTrayMenu = [
  {
    label: 'backend.openAnimu',
    click: () => {
      if (mainWindow) mainWindow.show()
    }
  },
  { type: 'separator' },
  {
    label: 'backend.update',
    // click: () => changeURL("/player")
  },
  {
    label: 'backend.settings',
    click: () => changeURL("/settings")
  },
  { type: 'separator' },
  {
    label: 'backend.exitAnimu',
    click: () => process.exit()
  }
]

export let DEBUG: boolean = false

export let config: SettingsConfig = defaultConfig as any
export let yt_dlp: yt_dlpInstance = new yt_dlpInstance(config["yt_dlpRepo"])

let historyData: cardData[] = []
const PROTOCOL = "animu"

let customheader: Record<string, string | string[]> | undefined
let isUserInPlayer: boolean = false

crashReporter.start({
  productName: "animu",
  compress: true,
  uploadToServer: false
})

function changeURL(path: string) {
  if (!mainWindow) return
  const tmp = mainWindow.webContents.getURL().split("#")
  mainWindow.loadURL(`${tmp[0]}#${path}`)
}

async function createWindow() {
  let title = 'Animu '

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 800,
    minHeight: 495,
    minWidth: 860,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false,
      allowRunningInsecureContent: false,
      nodeIntegration: false,
    },
    title: title
  })

  Menu.setApplicationMenu(null);

  mainWindow.webContents.on("did-navigate-in-page", (event, url) => {
    event.preventDefault();
    if (url.includes("#/player")) {
      isUserInPlayer = true
    } else {
      isUserInPlayer = false
    }
  });

  const args = process.argv.slice(1);
  const isDevTools = args.includes("--dev-tools") || args.includes("--devtools") || process.env.NODE_ENV === 'development';
  if (isDevTools || config.Developer.DevToolsOnStart) {
    mainWindow.setTitle(title + " - Development")
    mainWindow.webContents.openDevTools({ mode: "detach", title: "Animu Debugger" })
  };

  mainWindow.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['Referer'] = 'http://localhost:5173/';
    details.requestHeaders['User-Agent'] = userAgent
    details.requestHeaders['sec-ch-ua-platform'] = '"Windows"';

    if (isUserInPlayer) {
      details.requestHeaders = {
        ...details.requestHeaders,
        ...customheader
      } as any
    }

    callback({ requestHeaders: details.requestHeaders });
  });
  mainWindow.webContents.setUserAgent(userAgent)

  mainWindow.on('ready-to-show', () => {
    if (mainWindow) mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  mainWindow.on('close', (e) => {
    if (config.General.Window.trayIconClose) return
    if (!mainWindow) return
    e.preventDefault()
    mainWindow.hide()
    if (!existsSync(path.join(animuUserData, "traynotification"))) {
      const notification = new Notification({
        title: 'Animu',
        icon: icon,
        body: t("backend.trayNotification"),
      });
      notification.show()
      writeFileSync(path.join(animuUserData, "traynotification"), "")
    }
  })

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if ((input.control && input.shift && input.key === 'I')) {
      event.preventDefault();
    }
  });

  mainWindow.webContents.on("did-navigate-in-page", () => {
    if (mainWindow) mainWindow.webContents.setZoomFactor(detectZoom(config.General.Window.Zoom))
  })

  session.defaultSession.setPermissionRequestHandler(
    (_, permission, callback) => {
      const access = ["clipboard-read", "fullscreen"]
      if (access.includes(permission)) {
        callback(true);
      }
    }
  );

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

const isSecondInstance = app.requestSingleInstanceLock()
app.on('second-instance', () => {
  if (!mainWindow) return
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.focus()
})

app.whenReady().then(async () => {
  if (!isSecondInstance) {
    await dialog.showMessageBox({
      type: 'info',
      buttons: ['OK'],
      defaultId: 0,
      title: "Animu",
      message: 'Animu has already running',
    });
    app.quit()
    return
  }

  userAgent = app.userAgentFallback.replace(/\([^)]*\)/, '(Windows NT 10.0; Win64; x64)')
    .replace(`${app.getName()}/${app.getVersion()}`, "")
    .replace(`Electron/${process.versions.electron}`, "")
    .replaceAll("  ", " ")

  /* IFDEF WEB */
  if (process.env.ANIMU_WEB_DEV) return
  /* ENDIF */

  globalTray = new Tray(icon)

  await initialBackend()
  createWindow()

  const isInspectEnabled = process.argv.some(arg =>
    arg.startsWith('--inspect')
  );

  DEBUG = isInspectEnabled

  /* IFDEF PROD */
  if (DEBUG) {
    const notification = new Notification({
      title: 'Animu',
      icon: icon,
      body: "Animu is running in debug mode, which causes it to display sensitive data. Since you didn't enable debug mode, please Turn Off Animu by clicking this notification.",
    });
    notification.on("click", () => app.quit())
    notification.show()
  }
  /* ENDIF */

  /* IFDEF DEBUG */
  DEBUG = true
  /* ENDIF */

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  electronAppUniversalProtocolClient.on('request', async (requestUrl) => {
    if (mainWindow) mainWindow.webContents.send('protocol-request', requestUrl)
  },
  );
  await electronAppUniversalProtocolClient.initialize({
    protocol: PROTOCOL,
    mode: process.env.NODE_ENV == 'development' ? 'development' : "production",
  });
  if (config.General.discordRPC && process.env.NODE_ENV != 'development') setupDiscordRPC()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  server.instance.close()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

function detectKeybinds(config: SettingsConfig) {
  let keybinds = config.Player.keybinds
  const defaultKeybinds = defaultConfig.Player.keybinds
  for (const key in keybinds) {
    if (`${keybinds[key]}`.replaceAll(" ", "") == "") {
      keybinds = { ...keybinds, [key]: `${defaultKeybinds[key]}` }
    }
    else keybinds = { ...keybinds, [key]: `${keybinds[key]}` }
  }
  return { ...config, Player: { ...config.Player, keybinds: keybinds } }
}

export async function initialBackend() {
  try {
    await detectOldVersion()
    await convertToNewFormat()
    detectInIConfig()

    if (!existsSync(themeConfigPath)) mkdirSync(themeConfigPath)
    if (!existsSync(pluginsConfigPath)) mkdirSync(pluginsConfigPath)
    if (!existsSync(userPlugins)) mkdirSync(userPlugins)
    if (!existsSync(animuPlugins)) mkdirSync(animuPlugins)
    if (!existsSync(animuPlaylistPath)) mkdirSync(animuPlaylistPath)

    if (existsSync(path.join(newConfigPath, "config.json"))) {
      let data = readFileSync(path.join(newConfigPath, "config.json"), "utf-8")

      const content: SettingsConfig = deepMerge(defaultConfig, JSON.parse(data))

      if (typeof content.General.theme === "string") config = { ...content, General: { ...content.General, theme: ["DarkerAnimu"] } }
      config = detectKeybinds(content)
      if (content.backend["userAgent"]) userAgent = content.backend["userAgent"]
    } else {
      write(path.join(newConfigPath, "config.json"), JSON.stringify(defaultConfig))
      console.info("created new config")
    }

    if (existsSync(path.join(newConfigPath, "history.json"))) {
      let data = readFileSync(path.join(newConfigPath, "history.json"), "utf-8")
      historyData = JSON.parse(data)
    }
    checkDatabase()

    // if (existsSync(path.join(newConfigPath, "continueWatch.json"))) {
    //   let data = readFileSync(path.join(newConfigPath, "continueWatch.json"), "utf-8")
    //   continueWatchData = JSON.parse(data)
    // }

  } catch (error) {
    console.error("Failed Initial Backend", error)
  }
}

function detectInIConfig() {
  if (!existsSync(path.join(newConfigPath, "config.ini"))) return

  const data = readFileSync(path.join(newConfigPath, "config.ini"), "utf-8")
  renameSync(path.join(newConfigPath, "config.ini"), path.join(newConfigPath, "config.ini.backup"))

  const content: SettingsConfig = deepMerge(defaultConfig, ParseINI(data))
  writeFileSync(path.join(newConfigPath, "config.json"), JSON.stringify(content), "utf-8")
}

app.on('render-process-gone', (_event, _webContents, details) => {
  console.error('RENDERER CRASH', details)
})

app.on('child-process-gone', (_event, details) => {
  console.error('CHILD PROCESS CRASH', details)
})

process.on('uncaughtException', console.error)
process.on('unhandledRejection', console.error)

ipcMain.handle('backend:refresh', () => initialBackend());

ipcMain.handle('initialMetadata', () => ({ 
  config: config, 
  history: historyData, 
  animulist: checkDatabase(), 
  theme: getThemeList(checkConfigFolder("themes")),
  port: server.port
}));

ipcMain.handle('backend:customheader', (_, header: Record<string, string | string[]> | undefined) => customheader = header);
ipcMain.handle('advanceRequest', async (_, url: string, options?: { method?: "POST" | "GET", headers?: { [key: string]: string }, body: any }) => await advanceRequest(url, options));