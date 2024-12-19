import { appConfigDir } from "@tauri-apps/api/path";
import { error, info } from '@tauri-apps/plugin-log';
import {
  exists,
  writeTextFile,
  readTextFile,
} from "@tauri-apps/plugin-fs";
import { CardProps } from "./interface";

const DefaultHistory: { history: CardProps[] } = {
    history: [],
}

const appConfigDirPath = await appConfigDir();

export async function CheckHistory() {
    try {
        if (await exists(appConfigDirPath + "/history.json") == false) {
            await writeTextFile(appConfigDirPath + "/history.json", JSON.stringify(DefaultHistory))
            info("history file make")
        }
    } catch (Error) {
        error(`Error in CheckHistory: ${Error}`)
    }
}

export async function SaveHistory(save: CardProps) {
    try {
        const file = await readTextFile(appConfigDirPath + "/history.json")
        const data = JSON.parse(file) as { history: CardProps[] }
        const index = data.history.findIndex(item => item.player?.episode === save.player?.episode)
        data.history.splice(index, 1)
        data.history.push(save)
        await writeTextFile(appConfigDirPath + "/history.json", JSON.stringify(data))
    } catch (Error) {
        error(`Error in SaveHistory: ${Error}`)
    }
}

export async function DeleteFromHistory(data: CardProps) {
    try {
        const file = await readTextFile(appConfigDirPath + "/history.json")
        const list = JSON.parse(file) as { history: CardProps[] }
        const index = list.history.findIndex(item => item.player?.episode === data.player?.episode)
        list.history.splice(index, 1)
        await writeTextFile(appConfigDirPath + "/history.json", JSON.stringify(list))
    } catch (Error) {
        error(`Error in SaveHistory: ${Error}`)
    }
}

export async function ReadHistory(): Promise<{ history: CardProps[] }> {
    try {
        const file = await readTextFile(appConfigDirPath + "/history.json")
        return JSON.parse(file) as { history: CardProps[] }
    } catch (Error) {
        error(`Error in ReadHistory: ${Error}`)
        return { history: [] }
    }
}