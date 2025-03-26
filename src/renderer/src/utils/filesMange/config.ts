import ini from "ini";
import { SettingsConfig } from "../interface";

export const defaultConfig: SettingsConfig = {
  General: {
    HoverSidebar: true,
    HideSidebar: false,
    language: "en",
    theme: "darkAnimu",
    Window: {
      AutoMaximize: false,
      AutoFullscreen: false,
      Zoom: 100,
    },
  },
  Player: {
    general: {
      Autoplay: true,
      AutoFullscreen: false,
      AutoSkipEpisode: true,
      playerLoadType: "metadata",
      Volume: 25,
      LongTimeSkipForward: 90,
      LongTimeSkipBack: 90,
      TimeSkipLeft: 5,
      TimeSkipRight: 5,
    },
    screenShot: {
      alwaysAsk: true,
      saveType: "File",
      path: await checkPictureFolder(),
    },
    keybinds: {
      Pause: " ",
      LongTimeSkipForward: "ArrowUp",
      LongTimeSkipBack: "ArrowDown",
      TimeSkipLeft: "ArrowLeft",
      TimeSkipRight: "ArrowRight",
      Fullscreen: "F",
      ExitPlayer: "Escape",
      FrameSkipBack: ",",
      FrameSkipForward: ".",
      VolumeDown: "9",
      VolumeUp: "0",
      VolumeMute: "m",
      ScreenShot: "f10",
    },
  },
  History: {
    history: {
      LimitedHistory: false,
      maxSave: 50,
    },
    continue: {
      MinimalTimeSave: 20,
      MaximizeTimeSave: 100,
    },
  },
  Developer: {
    DeveloperMode: false,
    DevTools: false,
    DevToolsOnStart: false,
    playerDebug: false
  },
  update: {
    lastTime: "0",
    type: "start",
    enable: true
  }
};

const appConfigDirPath = window.api.os.getPath("userData");

export async function checkPictureFolder(): Promise<string> {
  const path = await window.api.os.getPath("pictures");
  if (await window.api.os.exists(path + "/animu") == false) {
    window.api.os.mkdir(path + "/animu");
    return path + "/animu";
  }
  return path + "/animu";
}

function deepMerge(target: any, source: any): any {
  for (const key in source) {
    if (source[key] && typeof source[key] === "object") {
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

export async function readConfig(): Promise<SettingsConfig> {
  if (await checkConfig() == false) return defaultConfig
  const content = await window.api.os.read(await appConfigDirPath + "/config.ini");
  const loadedConfig = ini.parse(content) as SettingsConfig;
  return deepMerge(defaultConfig, loadedConfig);
}

export async function saveConfig(content: any): Promise<boolean> {
  try {
    const data = ini.stringify(content);
    window.api.os.write(await appConfigDirPath + "/config.ini", data);
    return true
  } catch (Error) {
    console.error(`Error in saveConfig`);
    return false
  }
}

async function createConfig() {
  const content = ini.stringify(defaultConfig);
  try {
    await window.api.os.write(await appConfigDirPath + "/config.ini", content)
  } catch (Error) {
    console.error(`${Error} in createConfig`);
  }
}

export async function checkConfig(): Promise<boolean> {
  try {
    if (await window.api.os.exists(await appConfigDirPath) == false) {
      await window.api.os.mkdir(await appConfigDirPath);
      await createConfig();
    }
    if (await window.api.os.exists(await appConfigDirPath + "/config.ini") == false)
      await createConfig();
    return true
  } catch (Error) {
    console.error(`${Error} in checkConfig`);
    return false
  }
}
