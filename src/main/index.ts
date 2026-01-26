import { app, shell, BrowserWindow, Menu, session, ipcMain, dialog, crashReporter } from 'electron'
import { optimizer, is } from '@electron-toolkit/utils'
import path, { join } from 'path'
import ini from "ini";

// Files import
import icon from '../../resources/icon.png?asset'
import "./utils"
import "./window"
import "./os"
import "./update"
import "./request"
import "./streaming"
import "./backup"
import { convertToNewFormat, detectOldVersion, write } from './os'
import { existsSync, mkdirSync, readFileSync } from 'fs'
import { cardData, defaultConfig, SettingsConfig } from './types';
import { deepMerge, detectZoom, runCheckYT_DLP, setupDiscordRPC } from './utils';
import { electronAppUniversalProtocolClient } from 'electron-app-universal-protocol-client';

export let mainWindow: BrowserWindow | undefined
export const newConfigPath = path.join(app.getPath("userData"), "animuConfig")
export const themeConfigPath = path.join(newConfigPath, "themeConfig")
export const pluginsConfigPath = path.join(newConfigPath, "pluginsConfig")
export const userPlugins = path.join(newConfigPath, "plugins")
export const animuPlugins = path.join(app.getPath("userData"), "animuPlugins")
export let config: SettingsConfig = defaultConfig
let historyData: cardData[] = []
const PROTOCOL = "animu"

crashReporter.start({
  productName: "animu",
  compress: true,
  uploadToServer: false
})

function createWindow(): void {
  let title = 'Animu '
  let pipWindow;

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

  mainWindow.webContents.on('will-navigate', (event) => {
    event.preventDefault();
  });

  global.createPiPWindow = () => {
    pipWindow = new BrowserWindow({
      width: 300,
      height: 200,
      alwaysOnTop: true,
      frame: false,
      resizable: false,
      transparent: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    pipWindow.loadURL('http://localhost:3000/pip');
    pipWindow.setAlwaysOnTop(true, 'screen-saver');
  };

  const args = process.argv.slice(1);
  const isDevTools = args.includes("--dev-tools") || args.includes("--devtools");
  if (isDevTools) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else if (config.Developer.DevToolsOnStart) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/143.0';
    callback({ requestHeaders: details.requestHeaders });
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

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
    // dialog.showErrorBox("MESSAGE", `${deepLink}`)
  })

  app.whenReady().then(async () => {

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })
    await initialBackend()
    createWindow()
    electronAppUniversalProtocolClient.on('request', async (requestUrl) => {
      if (mainWindow) mainWindow.webContents.send('protocol-request', requestUrl)
    },
    );
    await electronAppUniversalProtocolClient.initialize({
      protocol: PROTOCOL,
      mode: 'development',
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
}

app.on('open-url', (event, url) => {
  event.preventDefault()
  console.log('DEEPLINK:', url)
  if (window) dialog.showErrorBox("MESSAGE", url)
})

function detectKeybinds(config: SettingsConfig) {
  let keybinds = config.Player.keybinds
  const defaultKeybinds = defaultConfig.Player.keybinds
  for (const key in keybinds) {
    if (keybinds[key].replaceAll(" ", "") == "") {
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

    if (existsSync(path.join(newConfigPath, "config.ini"))) {
      let data = readFileSync(path.join(newConfigPath, "config.ini"), "utf-8")
      const content: SettingsConfig = deepMerge(defaultConfig, ini.parse(data))
      if (typeof content.General.theme === "string") config = { ...content, General: { ...content.General, theme: ["DarkerAnimu"] } }
      else config = detectKeybinds(content)
    } else {
      write(path.join(newConfigPath, "config.ini"), ini.stringify(defaultConfig))
      console.info("created new config")
    }

    if (existsSync(path.join(newConfigPath, "history.json"))) {
      let data = readFileSync(path.join(newConfigPath, "history.json"), "utf-8")
      historyData = JSON.parse(data)
    }
    runCheckYT_DLP()

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

ipcMain.handle('refreshBackend', () => initialBackend());

ipcMain.handle('getConfig', () => config);
ipcMain.handle('getHistory', () => historyData);
