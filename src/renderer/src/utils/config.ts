import ini from "ini";
import { SettingsConfig } from "./interface";

export const defaultConfig: SettingsConfig = {
  General: {
    HoverSidebar: true,
    language: "en",
    color: "purpleAnimu",
    Window: {
      AutoMaximize: false,
      AutoFullscreen: false,
      Zoom: 0,
    },
  },
  Player: {
    general: {
      Autoplay: true,
      AutoFullscreen: false,
      playerLoadType: "metadata",
      Volume: 25,
      LongTimeSkipForward: 80,
      LongTimeSkipBack: 80,
      TimeSkipLeft: 5,
      TimeSkipRight: 5,
    },
    screenShot: {
      alwaysAsk: true,
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
      maxSave: 20,
    },
    continue: {
      MinimalTimeSave: 20,
      MaximizeTimeSave: 100,
    },
  },
};

async function checkPictureFolder(): Promise<string> {
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

export async function readConfig(): Promise<SettingsConfig | undefined> {
  const appConfigDirPath = await window.api.os.getPath("userData");
  try {
    const content = await window.api.os.read(appConfigDirPath + "/config.ini");
    const loadedConfig = ini.parse(content) as SettingsConfig;
    return deepMerge(defaultConfig, loadedConfig);
  } catch (Error) {
    console.error(`${Error} in readConfig`);
    return defaultConfig;
  }
}

export async function saveConfig(content: any) {
  const appConfigDirPath = await window.api.os.getPath("userData");
  const data = ini.stringify(content);
  try {
    window.api.os.write(appConfigDirPath + "/config.ini", data);
  } catch (Error) {
    console.error(`${Error} in saveConfig`);
  }
}

async function createConfig() {
  const appConfigDirPath = window.api.os.getPath("userData");
  const content = ini.stringify(defaultConfig);
  try {
    await window.api.os.write(appConfigDirPath + "/config.ini", content)
  } catch (Error) {
    console.error(`${Error} in createConfig`);
  }
}

export async function checkConfig() {
  try {
    const appConfigDirPath = await window.api.os.getPath("userData");
    if (await window.api.os.exists(appConfigDirPath) == false) {
      await window.api.os.mkdir(appConfigDirPath);
      await createConfig();
    }
    if (await window.api.os.exists(appConfigDirPath + "/config.ini") == false)
      await createConfig();
    await saveConfig(await readConfig());
  } catch (Error) {
    console.error(`${Error} in checkConfig`);
  }
}
