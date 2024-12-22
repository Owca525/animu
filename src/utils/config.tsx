import { appConfigDir } from "@tauri-apps/api/path";
import { error, info } from '@tauri-apps/plugin-log';
import {
  exists,
  mkdir,
  writeTextFile,
  readTextFile,
} from "@tauri-apps/plugin-fs";
import ini from "ini";
import { SettingsConfig } from "./interface";

export const defaultConfig: SettingsConfig = {
  General: {
    SideBar: {
      HoverSidebar: true,
    },
    Theme: {
      color: "purpleAnimu"
    },
    Window: {
      AutoMaximize: false,
      AutoFullscreen: false,
      Zoom: 1.0,
    }
  },
  Player: {
    general: {
      Autoplay: true,
      AutoFullscreen: false,
      Volume: 25,
      LongTimeSkipForward: 80,
      LongTimeSkipBack: 80,
      TimeSkipLeft: 5,
      TimeSkipRight: 5,
    },
    History: {
      MinimalTimeSave: 20,
      MaximizeTimeSave: 120,
    },
    keybinds: {
      Pause: " ",
      LongTimeSkipForward: "ArrowUp",
      LongTimeSkipBack: "ArrowDown",
      TimeSkipLeft: "ArrowLeft",
      TimeSkipRight: "ArrowRight",
      Fullscreen: "F",
      ExitPlayer: "Escape",
    },
  },
};

function deepMerge(target: any, source: any): any {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object') {
      if (!target[key]) {
        target[key] = {};
      }
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

export async function readConfig(): Promise<SettingsConfig | undefined> {
  const appConfigDirPath = await appConfigDir();
  try {
    const content = await readTextFile(appConfigDirPath + "/config.ini");
    const loadedConfig = ini.parse(content) as SettingsConfig;
    return deepMerge(defaultConfig, loadedConfig);
  } catch (Error) { error(`Error in readConfig: ${Error}`); return defaultConfig; }
}

export async function saveConfig(content: any) {
  const appConfigDirPath = await appConfigDir();
  const data = ini.stringify(content);
  try {
    await writeTextFile(appConfigDirPath + "/config.ini", data);
  } catch (Error) { error(`Error in saveConfig: ${Error}`) }
}

async function createConfig() {
  const appConfigDirPath = await appConfigDir();
  const content = ini.stringify(defaultConfig);
  try {
    await writeTextFile(appConfigDirPath + "/config.ini", content);
  } catch (Error) { error(`Error in createConfig: ${Error}`) }
}

export async function checkConfig() {
  try {
    const appConfigDirPath = await appConfigDir();
    info(`Config Path: ${appConfigDirPath}`)
    if ((await exists(appConfigDirPath)) == false) {
      await mkdir(appConfigDirPath);
      await createConfig();
      info(`Created new path and config`)
    }
    if ((await exists(appConfigDirPath + "/config.ini")) == false) {
      await createConfig();
      info(`Created new config`)
    }
  } catch (Error) { error(`Error with loading config: ${Error}`) }
}
