import { app, shell, BrowserWindow, Menu, session, ipcMain } from 'electron'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
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
import { detectOldVersion, write } from './os'
import { existsSync, readFileSync } from 'fs'
import { cardData, defaultConfig, SettingsConfig } from './types';
import { deepMerge, setupDiscordRPC } from './utils';

export let mainWindow: BrowserWindow | undefined
export let newConfigPath = path.join(app.getPath("userData"), "animuConfig")
export let config: SettingsConfig = defaultConfig
let historyData: cardData[] = []
let continueWatchData: cardData[] = []

function createWindow(): void {
  let title = 'Animu v' + app.getVersion()
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
      nodeIntegration: true,
    },
    title: title
  })

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
    mainWindow.setTitle(title + " developer")
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
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.animu')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
  await initialBackend()
  createWindow()
  if (config.General.discordRPC && process.env.NODE_ENV != 'development') {
    setupDiscordRPC()
  }
  // setupDiscordRPC()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

async function initialBackend() {
  try {
    await detectOldVersion()

    if (existsSync(path.join(newConfigPath, "config.ini"))) {
      let data = readFileSync(path.join(newConfigPath, "config.ini"), "utf-8")
      config = deepMerge(defaultConfig, ini.parse(data))
    } else {
      write(path.join(newConfigPath, "config.ini"), ini.stringify(defaultConfig))
      console.info("created new config")
    }

    if (existsSync(path.join(newConfigPath, "history.json"))) {
      let data = readFileSync(path.join(newConfigPath, "history.json"), "utf-8")
      historyData = JSON.parse(data)
    }

      if (existsSync(path.join(newConfigPath, "continueWatch.json"))) {
      let data = readFileSync(path.join(newConfigPath, "continueWatch.json"), "utf-8")
      continueWatchData = JSON.parse(data)
    }

  } catch (error) {
    console.error("Failed Initial Backend", error)
  }
}

ipcMain.handle('getConfig', () => config);
ipcMain.handle('getHistory', () => ({ continue: continueWatchData, history: historyData }));