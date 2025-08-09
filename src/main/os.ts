import { app, dialog, ipcMain } from "electron";
import { mainWindow } from ".";
import os from 'os';

import fs, { WriteFileOptions } from "fs";
import { execSync } from "child_process";

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

ipcMain.handle(
  "getPath",
  (
    _event,
    name:
      | "home"
      | "appData"
      | "userData"
      | "sessionData"
      | "temp"
      | "exe"
      | "module"
      | "desktop"
      | "documents"
      | "downloads"
      | "music"
      | "pictures"
      | "videos"
      | "recent"
      | "logs"
      | "crashDumps"
  ): string => app.getPath(name)
);

ipcMain.handle("exist", (_event, path: string): boolean => {
  if (fs.existsSync(path)) return true;
  else return false;
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

ipcMain.handle(
  "write",
  (_event, path: string, data: string, format?: WriteFileOptions): boolean =>
    write(path, data, format)
);

ipcMain.handle(
  "read",
  (_event, path: string, format: WriteFileOptions): any => {
    try {
      if (format) {
        return fs.readFileSync(path, format);
      }
      return fs.readFileSync(path, "utf-8");
    } catch (error) {
      return null;
    }
  }
);

ipcMain.handle("mkdir", (_event, path: string): boolean => {
  try {
    fs.mkdirSync(path);
    return true;
  } catch (error) {
    return false;
  }
});

ipcMain.handle(
  "saveDialog",
  async (
    _event,
    fileName: string,
    data: any,
    title: string,
    name: string,
    extensions: string[],
    format?: string
  ): Promise<boolean> => {
    const { filePath } = await dialog.showSaveDialog({
      title: title,
      defaultPath: fileName,
      filters: [{ name: name, extensions: extensions }],
    });
    if (!filePath) return false
    return write(filePath, data, format as WriteFileOptions)
  }
);

ipcMain.handle(
  "openDialog",
  async (
    _event,
    path?: string,
    name?: string,
    extensions?: string[]
  ): Promise<string> => {
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