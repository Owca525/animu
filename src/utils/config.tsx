import { appConfigDir } from "@tauri-apps/api/path";
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
  },
  Player: {
    general: {
      Autoplay: true,
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
  } catch (error) {}
}

export async function saveConfig(content: any) {
  const appConfigDirPath = await appConfigDir();
  const data = ini.stringify(content);
  try {
    await writeTextFile(appConfigDirPath + "/config.ini", data);
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
