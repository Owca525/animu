import { app, shell, BrowserWindow, Menu } from 'electron'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { join } from 'path'

// Files import
import icon from '../../resources/icon.png?asset'
import "./utils"
import "./window"
import "./os"
import "./update"
import "./request"
import "./streaming"

export let mainWindow: BrowserWindow | undefined

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
      webSecurity: false
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
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()
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
