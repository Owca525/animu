import { appConfigDir } from "@tauri-apps/api/path";
import { error, info } from '@tauri-apps/plugin-log';
import {
  exists,
  writeTextFile,
  readTextFile,
} from "@tauri-apps/plugin-fs";
import { CardProps } from "./interface";
import { readConfig } from "./config";

const DefaultHistory: { history: CardProps[] } = {
    history: [],
}

export async function CheckHistory() {
    try {
        const appConfigDirPath = await appConfigDir();
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
        const config = await readConfig()
        const appConfigDirPath = await appConfigDir();
        const file = await readTextFile(appConfigDirPath + "/history.json")
        const data = JSON.parse(file) as { history: CardProps[] }
        const index = data.history.findIndex(item => item.id === save.id)
        if (config && (await ReadHistory()).length >= parseInt(config.History.history.maxSave.toString())) data.history.pop()
        data.history.splice(index, 1)
        data.history.push(save)
        await writeTextFile(appConfigDirPath + "/history.json", JSON.stringify(data))
    } catch (Error) {
        error(`Error in SaveHistory: ${Error}`)
    }
}

export async function DeleteFromHistory(data: CardProps) {
    try {
        const appConfigDirPath = await appConfigDir();
        const file = await readTextFile(appConfigDirPath + "/history.json")
        const list = JSON.parse(file) as { history: CardProps[] }
        const index = list.history.findIndex(item => item.id === data.id)
        list.history.splice(index, 1)
        await writeTextFile(appConfigDirPath + "/history.json", JSON.stringify(list))
    } catch (Error) {
        error(`Error in SaveHistory: ${Error}`)
    }
}

export async function ReadHistory(): Promise<CardProps[]> {
    try {
        const appConfigDirPath = await appConfigDir();
        const file = await readTextFile(appConfigDirPath + "/history.json")
        const data = JSON.parse(file) as { history: CardProps[] }
        return data.history
    } catch (Error) {
        error(`Error in ReadHistory: ${Error}`)
        return []
    }
}