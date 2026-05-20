import { app, shell, BrowserWindow, Menu, session, ipcMain, crashReporter, Tray, dialog, Notification } from 'electron'
import { optimizer, is } from '@electron-toolkit/utils'
import path, { join } from 'path'

// Files import
import icon from '../../build/icon.png?asset'
import "./utils"
import "./window"
import "./os"
import "./update"
import "./request"
import "./streaming"
import "./backup"
import "./animulist"
import "./playlist"
import "./theme"
import "./plugins"

import { convertToNewFormat, detectOldVersion, write } from './os'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { cardData, defaultConfig, SettingsConfig } from './types';
import { deepMerge, detectZoom, runCheckYT_DLP, setupDiscordRPC } from './utils';
import { electronAppUniversalProtocolClient } from 'electron-app-universal-protocol-client';
import { checkDatabase } from './animulist';
import { ConvertObjectToINI, ParseINI } from './iniParser';

export let mainWindow: BrowserWindow | undefined
export const newConfigPath = path.join(app.getPath("userData"), "animuConfig")
export const themeConfigPath = path.join(newConfigPath, "themeConfig")
export const pluginsConfigPath = path.join(newConfigPath, "pluginsConfig")
export const animuPlaylistPath = path.join(newConfigPath, "playlist")
export const userPlugins = path.join(newConfigPath, "plugins")
export const animuPlugins = path.join(app.getPath("userData"), "animuPlugins")

export let DEBUG: boolean = false

export let config: SettingsConfig = defaultConfig
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

function createWindow(): void {
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

  mainWindow.webContents.on("did-navigate-in-page", (event, url) => {
    event.preventDefault();
    if (url.includes("#/player")) {
      isUserInPlayer = true
    } else {
      isUserInPlayer = false
    }
  });

  mainWindow.on("focus", () => {
    if (!mainWindow) return
    mainWindow.webContents.send("browserWindow:focus", true);
  });

  mainWindow.on("blur", () => {
    if (!mainWindow) return
    mainWindow.webContents.send("browserWindow:focus", false);
  });


  mainWindow.on('hide', () => {
    if (mainWindow) mainWindow.webContents.send("browserWindow:hidden", true);
  });

  mainWindow.on('show', () => {
    if (mainWindow) mainWindow.webContents.send("browserWindow:hidden", false);
  });

  const args = process.argv.slice(1);
  const isDevTools = args.includes("--dev-tools") || args.includes("--devtools");
  if (isDevTools || config.Developer.DevToolsOnStart) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    let newHeader = {
      ...details.requestHeaders,
      "Referer": "http://localhost:5173/",
      "User-Agent": config.backend.useragent
    }
    if (isUserInPlayer) {
      newHeader = {
        ...newHeader,
        ...customheader
      }
    }
    
    callback({ requestHeaders: newHeader });
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.setTitle(title + " - Development")
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('ready-to-show', () => {
    if (mainWindow) mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  let tray = new Tray(icon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Animu',
      click: () => {
        if (mainWindow) mainWindow.show()
      }
    },
    { type: 'separator' },
    {
      label: 'Watch Last Anime',
      click: () => changeURL("/player")
    },
    {
      label: 'Settings',
      click: () => changeURL("/settings")
    },
    { type: 'separator' },
    {
      label: 'Exit Animu',
      click: () => process.exit()
    }
  ])

  tray.setToolTip('Animu')
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    if (!mainWindow) return
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
  })

  mainWindow.on('close', (e) => {
    if (config.General.Window.trayIconClose) return
    if (!mainWindow) return
    e.preventDefault()
    mainWindow.hide()
    if (!existsSync(path.join(app.getPath("userData"), "traynotification"))) {
      const notification = new Notification({
        title: 'Animu',
        icon: icon,
        body: "Animu is Now In tray mode if you want disable this you can in settings",
      });
      notification.show()
      writeFileSync(path.join(app.getPath("userData"), "traynotification"), "")
    }
  })

  Menu.setApplicationMenu(null);

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if ((input.control && input.shift && input.key === 'I')) {
      event.preventDefault();
    }
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.webContents.on("did-navigate-in-page", () => {
    if (mainWindow) mainWindow.webContents.setZoomFactor(detectZoom(config.General.Window.Zoom))
  })
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

  /* IFDEF WEB */
  if (process.env.ANIMU_WEB_DEV) return
  /* ENDIF */

  await initialBackend()
  createWindow()
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
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

function detectKeybinds(config: SettingsConfig) {
  let keybinds = config.Player.keybinds
  const defaultKeybinds = defaultConfig.Player.keybinds
  for (const key in keybinds) {
    if (`${keybinds[key]}`.replaceAll(" ", "") == "") {
      keybinds = { ...keybinds, [key]: defaultKeybinds[key] }
    }
  }
  return { ...config, Player: { ...config.Player, keybinds: keybinds } }
}

export async function initialBackend() {
  try {
    await detectOldVersion()
    await convertToNewFormat()

    if (!existsSync(themeConfigPath)) mkdirSync(themeConfigPath)
    if (!existsSync(pluginsConfigPath)) mkdirSync(pluginsConfigPath)
    if (!existsSync(userPlugins)) mkdirSync(userPlugins)
    if (!existsSync(animuPlugins)) mkdirSync(animuPlugins)
    if (!existsSync(animuPlaylistPath)) mkdirSync(animuPlaylistPath)

    if (existsSync(path.join(newConfigPath, "config.ini"))) {
      let data = readFileSync(path.join(newConfigPath, "config.ini"), "utf-8")

      const content: SettingsConfig = deepMerge(defaultConfig, ParseINI(data))

      if (typeof content.General.theme === "string") config = { ...content, General: { ...content.General, theme: ["DarkerAnimu"] } }
      config = detectKeybinds(content)
    } else {
      write(path.join(newConfigPath, "config.ini"), ConvertObjectToINI(defaultConfig))
      console.info("created new config")
    }

    if (existsSync(path.join(newConfigPath, "history.json"))) {
      let data = readFileSync(path.join(newConfigPath, "history.json"), "utf-8")
      historyData = JSON.parse(data)
    }
    runCheckYT_DLP()
    checkDatabase()

    // if (existsSync(path.join(newConfigPath, "continueWatch.json"))) {
    //   let data = readFileSync(path.join(newConfigPath, "continueWatch.json"), "utf-8")
    //   continueWatchData = JSON.parse(data)
    // }

  } catch (error) {
    console.error("Failed Initial Backend", error)
  }
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

ipcMain.handle('backend:config', () => config);
ipcMain.handle('backend:history', () => historyData);

ipcMain.handle('backend:customheader', (_, header: Record<string, string | string[]> | undefined) => customheader = header);