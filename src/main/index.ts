import { app, shell, BrowserWindow, Menu, session } from 'electron'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { join } from 'path'

import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';

// Files import
import icon from '../../resources/icon.png?asset'
import "./utils"
import "./window"
import "./os"
import "./update"
import "./request"
import "./streaming"
import "./backup"

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
  // TODO: Maybe someday add for users
  try {
    const name = await installExtension(REACT_DEVELOPER_TOOLS, { loadExtensionOptions: { allowFileAccess: true } });
    console.log(`Added Extension:  ${name.name}`);
  } catch (err) {
    console.log('An error occurred: ', err);
  }

  electronApp.setAppUserModelId('com.animu')
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
