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

const defaultConfig: SettingsConfig = {
  General: {
    SideBar: {
      HoverSidebar: true,
    },
    Window: {
      AutoMaximize: false,
      AutoFullscreen: false,
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
export async function readConfig(): Promise<SettingsConfig | undefined> {
  const appConfigDirPath = await appConfigDir();
  try {
    const content = await readTextFile(appConfigDirPath + "/config.ini");
    return ini.parse(content) as SettingsConfig;
  } catch (Error) { error(`Error in readConfig: ${Error}`) }
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
