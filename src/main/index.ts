import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

import fs from 'fs'
import { autoUpdater } from 'electron-updater'
import * as RPC from 'discord-rpc';

const CLIENT_ID = '1320810160205070377';
const rpc = new RPC.Client({ transport: 'ipc' });
const runTime = new Date()

function createWindow(): void {
  var title = 'Animu v' + app.getVersion()

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1500,
    height: 800,
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

  if (process.env.NODE_ENV === 'development') {
    mainWindow.setTitle(title + " developer")
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  autoUpdater.checkForUpdatesAndNotify();

  ipcMain.handle(
    'fetch-data',
    async (_event, { url, header }: { url: string; header: Record<string, string> }) => {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: header
        })

        if (response.ok) {
          const data = await response.json()
          return { success: true, data }
        } else {
          return { success: false, status: response.status, statusText: response.statusText }
        }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    }
  )

  ipcMain.handle('setMaximize', (_event) => {
    mainWindow.maximize()
  })

  ipcMain.handle('setFullscreen', (_event, option: boolean) => {
    mainWindow.setFullScreen(option)
  })

  ipcMain.handle('isFullscreen', (_event) => {
    return mainWindow.isFullScreen()
  })

  ipcMain.handle('getPatchPictures', (_event) => {
    return app.getPath('pictures')
  })

  ipcMain.handle('setZoom', (_event, option: number) => {
    mainWindow.webContents.setZoomLevel(option)
  })

  ipcMain.handle('getVersion', (_event) => {
    return app.getVersion()
  })

  ipcMain.handle('appConfigDir', (_event) => {
    return app.getPath('userData')
  })

  ipcMain.handle('DirectoryExist', (_event, filePath: string) => {
    if (fs.existsSync(filePath)) return true
    else return false
  })

  ipcMain.handle('WriteFile', (_event, filePath: string, text: string) => {
    try {
      fs.writeFileSync(filePath, text, 'utf8')
      return true
    } catch (error) {
      return false
    }
  })

  ipcMain.handle('ReadFile', (_event, filePath: string) => {
    try {
      const data = fs.readFileSync(filePath, 'utf8')
      return data
    } catch (error) {
      return null
    }
  })

  ipcMain.handle('mkdir', (_event, filePath: string) => {
    try {
      fs.mkdirSync(filePath)
      return true
    } catch (error) {
      return false
    }
  })

  ipcMain.handle('open', (_event, url: string, type: string) => {
    switch (type.toLowerCase()) {
      case 'folder':
        shell.openPath(url)
        break
      case 'url':
        shell.openExternal(url)
    }
  })

  ipcMain.handle('exit', (_event) => {
    app.quit()
  })

  ipcMain.handle('saveFileWithDialog', async (_event, fileName: string, data: any, title: string, name: string, extensions: string[]) => {
    const filePath = await dialog.showSaveDialog({
      title: title,
      defaultPath: fileName,
      filters: [{ name: name, extensions: extensions }],
    });
    if (!filePath.canceled) {
      fs.writeFile(filePath.filePath.toString(), data, (err) => {
        if (err) throw console.log(err);
      });
    }
  })

  ipcMain.handle('saveFilePictureDialog', async (_event, fileName: string, title: string, data: any): Promise<boolean> => {
    const { filePath } = await dialog.showSaveDialog({
      title: title,
      defaultPath: fileName,
      filters: [{ name: "png", extensions: ["png"] }],
    });
    if (filePath) {
      const base64Data = data.replace(/^data:image\/png;base64,/, '');
      fs.writeFile(filePath, base64Data, 'base64', (err) => {
        if (err) console.log(err)
      });
      return true
    }
    return false
  })

  ipcMain.handle('saveFilePicture', async (_event, PatchName: string, data: any): Promise<Boolean> => {
    const base64Data = data.replace(/^data:image\/png;base64,/, '');
    let error: any = null
    fs.writeFile(PatchName, base64Data, 'base64', (err) => {
      if (err) console.log(err); error = err
    });
    if (error) {
      return false
    }
    return true
  })

  ipcMain.handle('getLocation', async (_event): Promise<string> => {
    const filePath = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    })
    if (filePath) {
      return filePath.filePaths[0]
    }
    return ""
  })

  autoUpdater.on('error', (error) => {
    console.log(error)
  });

  ipcMain.handle('getUpdate', async (_event): Promise<string> => {
    let update: string | undefined = undefined
    autoUpdater.on('update-available', (event) => {
      update = event.version
      console.log('Update available.');
    });
    if (update) {
      return update
    }
    return ""
  })

  ipcMain.handle('setActivity', (_event, details: string, state: string = "") => {
    if (rpc) { 
      rpc.setActivity({
        details: details,
        state: state,
        startTimestamp: runTime,
        largeImageKey: 'https://github.com/Owca525/animu/blob/electron/resources/icon.png?raw=true', 
        instance: false,
      });
    }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// autoUpdater.on('update-downloaded', (info) => {
//   console.log('Update downloaded:', info);
//   autoUpdater.quitAndInstall();
// });

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()
  setupDiscordRPC()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

const setupDiscordRPC = () => {
  RPC.register(CLIENT_ID);

  rpc.on('ready', () => {
    rpc.setActivity({
      startTimestamp: runTime,
      largeImageKey: 'https://github.com/Owca525/animu/blob/electron/resources/icon.png?raw=true',
      instance: false,
    });
  });

  rpc.login({ clientId: CLIENT_ID }).catch(console.error);
};

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
