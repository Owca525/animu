import { dialog, ipcMain } from "electron";
import { animuUserData, mainWindow, newConfigPath } from ".";

import { WriteFileOptions, writeFileSync, mkdirSync, existsSync, readFileSync, promises, rmSync, readdirSync } from "fs";
import path from "path"
import os from "os"
import { cardData, SettingsConfig } from "./types";
import { createBackup } from "./backup";
import { runProcess } from "./utils";

export function write(path: string, data: string, format?: WriteFileOptions): boolean {
  try {
    if (format) {
      writeFileSync(path, data, format);
      return true;
    }
    writeFileSync(path, data, "utf-8");
    return true;
  } catch (error) {
    console.error(error, path)
    return false;
  }
}

function MergeFragments(folderPath: string, exportPath?: string) {
  let files = readdirSync(folderPath, { withFileTypes: true }).filter((e) => e.isFile()).map((v) => v["name"]);
  const init = files.find((v) => v.startsWith("init"))
  if (!init) return
  console.log(init)

  files = files.filter((v) => v != init)

  files = files.sort((a, b) => {
    const numA = Number.parseInt(a.match(/^\d+/)![0], 10);
    const numB = Number.parseInt(b.match(/^\d+/)![0], 10);

    return numA - numB;
  })

  console.log(files, init)

  const buffers: Buffer[] = [];

  buffers.push(readFileSync(path.join(folderPath, init)));

  for (let index = 0; index < files.length; index++) {
    buffers.push(readFileSync(path.join(folderPath, files[index])));
  }

  writeFileSync(exportPath ?? path.join(folderPath, `${path.basename(folderPath)}`), Buffer.concat(buffers))
}

ipcMain.handle("fs:exist", (_event, pathStr: string): boolean => {
  return existsSync(path.join(newConfigPath, pathStr))
});

ipcMain.handle("fs:connectHLS", (_event, pathStr: string) => {
  const folderPath = path.join(newConfigPath, pathStr)
  let folders = readdirSync(folderPath, { withFileTypes: true }).filter((e) => !e.isFile()).map((v) => v["name"]);

  for (let index = 0; index < folders.length; index++) {
    const element = folders[index];

    MergeFragments(path.join(folderPath, element), path.join(folderPath, `${element}.tmp`))
  }

  if (folders.find((v) => v == "main")) return

  runProcess([
    "-y",
    "-i", path.join(folderPath, "video.tmp"),
    "-i", path.join(folderPath, "audio.tmp"),
    "-map", "0:v:0",
    "-map", "1:a:0",
    "-c", "copy",
    "-movflags", "+faststart",
    path.join(folderPath, "end.mp4")
  ])

  rmSync(path.join(folderPath, "video.tmp"))
  rmSync(path.join(folderPath, "audio.tmp"))
});

ipcMain.handle("fs:write", (_event, pathStr: string, data: string, format?: WriteFileOptions): boolean => {
  if (pathStr.includes(".png")) {
    return write(pathStr, data, format)
  }
  return write(path.join(newConfigPath, pathStr), data, format)
});

ipcMain.handle("fs:wrifeFile", (_event, pathStr: string, buffer: ArrayBuffer) => {
  console.log(buffer)
  mkdirSync(path.dirname(path.join(newConfigPath, pathStr)), { recursive: true })
  writeFileSync(path.join(newConfigPath, pathStr), new Uint8Array(buffer))
});

ipcMain.handle("fs:read",  (_event, pathStr: string, format: "ascii" | "utf8" | "utf-8" | "utf16le" | "utf-16le" | "ucs2" | "ucs-2" | "base64" | "base64url" | "latin1" | "binary" | "hex"):  undefined | string => {
    try {
      let tmpPath = path.join(newConfigPath, pathStr)
      if (format) return readFileSync(tmpPath, format);
      return readFileSync(tmpPath, "utf-8");
    } catch (error) {
      return undefined;
    }
  }
);

ipcMain.handle("backend:configPath", (_event): string => {
  return newConfigPath
});

ipcMain.handle("backend:BrowserConfigPath", (_event): string => {
  return animuUserData
});


ipcMain.handle("os:saveDialog", async (_event, fileName: string, data: any, title: string, name: string, extensions: string[], format?: string): Promise<boolean> => {
    const { filePath } = await dialog.showSaveDialog({
      title: title,
      defaultPath: fileName,
      filters: [{ name: name, extensions: extensions }],
    });
    if (!filePath) return false
    return write(filePath, data, format as WriteFileOptions)
  }
);

ipcMain.handle("os:openDialog", async (_event, path?: string, name?: string, extensions?: string[]): Promise<string> => {
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

ipcMain.handle("os:saveConfig", async (_event, config: SettingsConfig): Promise<boolean> => {
  return write(path.join(newConfigPath, "config.json"), JSON.stringify(config), "utf-8")
});

ipcMain.handle('os:information', () => {
  return {
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
  };
});

export async function detectOldVersion() {
  let animuPath = animuUserData
  let newConfigPath = path.join(animuUserData, "animuConfig")
  if (!existsSync(newConfigPath)) {
    mkdirSync(newConfigPath);
  }
  if (!existsSync(newConfigPath)) {
    mkdirSync(newConfigPath);
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

    if (existsSync(oldPath) && !existsSync(newPath)) {
      try {
        await promises.rename(oldPath, newPath);
      } catch (err) {
        console.error(`Error in detectOldVersion:`, err);
      }
    }
  }
}

export async function convertToNewFormat() {
  try {
    let newConfigPath = path.join(animuUserData, "animuConfig")
    if (!existsSync(path.join(newConfigPath, "history.json"))) return
    if (!existsSync(path.join(newConfigPath, "continueWatch.json"))) return
    await createBackup()

    let tmpHistoria = readFileSync(path.join(newConfigPath, "history.json"), "utf-8")
    let historyData: cardData[]  = JSON.parse(tmpHistoria)
    
    let tmpContinue = readFileSync(path.join(newConfigPath, "continueWatch.json"), "utf-8")
    let continueWatchData: cardData[] = JSON.parse(tmpContinue)
    
    for (let index = 0; index < continueWatchData.length; index++) {
      const element = continueWatchData[index];
      let historyIndex = historyData.findIndex((value) => element.AnimeData.id == value.AnimeData.id)
      if (historyIndex != -1) {
        let card = {
          ...historyData[historyIndex],
          saveData: {
            ...element.saveData,
          }
        }
        historyData.splice(historyIndex, 1)
        historyData.push(card as any)
      };
    }

    write(path.join(newConfigPath, "history.json"), JSON.stringify(historyData.reverse()))
    rmSync(path.join(newConfigPath, "continueWatch.json"))
  } catch (error) {
    console.error("Error convertToNewFormat", error)
  }
}