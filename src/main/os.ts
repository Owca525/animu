import { app, dialog, ipcMain } from "electron";
import { mainWindow } from ".";
import os from 'os';

import fs, { WriteFileOptions } from "fs";
import { execSync } from "child_process";
import path from "path";

let newConfigPath = path.join(app.getPath("userData"), "animuConfig")

function write(path: string, data: string, format?: WriteFileOptions): boolean {
  try {
    if (format) {
      fs.writeFileSync(path, data, format);
      return true;
    }
    fs.writeFileSync(path, data, "utf-8");
    return true;
  } catch (error) {
    console.error(error, path)
    return false;
  }
}

ipcMain.handle("exist", (_event, pathStr: string): boolean => {
  return fs.existsSync(path.join(newConfigPath, pathStr))
});

ipcMain.handle("getConfigPath", (_event): string => {
  return newConfigPath
});

ipcMain.handle("getPathProgram", async (_event, program: string): Promise<string> => {
  try {
    if (os.platform() === "win32") return ""
    let paths = execSync(`whereis ${program}`).toString().trim().split(" ")
    if (!(paths.length <= 1)) return paths[1]
    let flatpakPaths = execSync(`flatpak list --columns=application`).toString().trim().split(" ")
    for (let index = 0; index < flatpakPaths.length; index++) {
      const element = flatpakPaths[index];
      if (element.toLowerCase().includes(program.toLocaleLowerCase())) return element.replace("\n", "")
    }
    return ""
  } catch (error) {
    console.error(error)
    return ""
  }
});

ipcMain.handle("write", (_event, pathStr: string, data: string, format?: WriteFileOptions): boolean => {
  if (pathStr.includes(".png")) {
    return write(pathStr, data, format)
  }
  return write(path.join(newConfigPath, pathStr), data, format)
});

ipcMain.handle("read",  (_event, pathStr: string, format: WriteFileOptions): string | NonSharedBuffer | undefined => {
    try {
      let tmpPath = path.join(newConfigPath, pathStr)
      if (format) return fs.readFileSync(tmpPath, format);
      return fs.readFileSync(tmpPath, "utf-8");
    } catch (error) {
      return undefined;
    }
  }
);

ipcMain.handle("saveDialog", async (_event, fileName: string, data: any, title: string, name: string, extensions: string[], format?: string): Promise<boolean> => {
    const { filePath } = await dialog.showSaveDialog({
      title: title,
      defaultPath: fileName,
      filters: [{ name: name, extensions: extensions }],
    });
    if (!filePath) return false
    return write(filePath, data, format as WriteFileOptions)
  }
);

ipcMain.handle("openDialog", async (_event, path?: string, name?: string, extensions?: string[]): Promise<string> => {
    if (!mainWindow) return "";
    let dialogProps: Electron.OpenDialogOptions = {
      defaultPath: path,
      properties: ["openDirectory"],
    };

    if (name && extensions)
      dialogProps = {
        ...dialogProps,
        filters: [{ name: name, extensions: extensions }],
      };

    const filePath = await dialog.showOpenDialog(mainWindow, dialogProps);
    if (filePath) return filePath.filePaths[0];
    return "";
  }
);

ipcMain.handle('get-os-info', async () => {
  return {
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
  };
});

async function detectOldVersion() {
  let animuPath = app.getPath("userData")
  let newConfigPath = path.join(app.getPath("userData"), "animuConfig")
  if (!fs.existsSync(newConfigPath)) {
    fs.mkdirSync(newConfigPath);
  }
  if (!fs.existsSync(newConfigPath)) {
    fs.mkdirSync(newConfigPath);
  }

  const filesToMove = [
    "history.json",
    "continueWatch.json",
    "config.ini",
    "themes",
    "lang",
  ];

  for (const name of filesToMove) {
    const oldPath = path.join(animuPath, name);
    const newPath = path.join(newConfigPath, name);

    if (fs.existsSync(oldPath) && !fs.existsSync(newPath)) {
      try {
        await fs.promises.rename(oldPath, newPath);
      } catch (err) {
        console.error(`Error in detectOldVersion:`, err);
      }
    }
  }
}

ipcMain.handle('checkOldConfig', async () => await detectOldVersion());

ipcMain.handle('createPictureFolder', async (): Promise<string> => {
  if (!fs.existsSync(path.join(app.getPath("pictures"), "animu"))) {
    fs.mkdirSync(path.join(app.getPath("pictures"), "animu"));
  }
  return path.join(app.getPath("pictures"), "animu")
});