import { appConfigDir } from "@tauri-apps/api/path";
import {
  exists,
  mkdir,
  writeTextFile,
  readTextFile,
} from "@tauri-apps/plugin-fs";
import ini from "ini";

const defaultConfig = {
  general: {
    hoverSidebar: true,
    scale: 1
  },
  player: {
    volume: 0.25,
    upTime: 80,
    downTime: 80,
    leftTime: 5,
    rightTime: 5,
    keybinds: {
      pause: " ",
      changeTimeUp: "arrowright",
      changeTimeDown: "arrowleft",
      changeTimeLeft: "arrowup",
      changeTimeRight: "arrowdown",
      fullscreen: "f",
      exitPlayer: "esc",
    },
  },
};
export async function readConfig() {
  const appConfigDirPath = await appConfigDir();
  try {
    const content = await readTextFile(appConfigDirPath + "/config.ini");
    return ini.parse(content);
  } catch (error) {}
}

export async function saveConfig(content: any) {
  const appConfigDirPath = await appConfigDir();
  try {
    await writeTextFile(appConfigDirPath + "/config.ini", content);
  } catch (error) {}
}

async function createConfig() {
  const appConfigDirPath = await appConfigDir();
  const content = ini.stringify(defaultConfig);
  try {
    await writeTextFile(appConfigDirPath + "/config.ini", content);
  } catch (error) {}
}

export async function checkConfig() {
  const appConfigDirPath = await appConfigDir();
  if ((await exists(appConfigDirPath)) == false) {
    await mkdir(appConfigDirPath);
    await createConfig();
  }
  if ((await exists(appConfigDirPath + "/config.ini")) == false) {
    await createConfig();
  }
}
