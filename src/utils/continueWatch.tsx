import { appConfigDir } from "@tauri-apps/api/path";
import { error, info } from '@tauri-apps/plugin-log';
import {
  exists,
  writeTextFile,
  readTextFile,
} from "@tauri-apps/plugin-fs";
import { CardProps } from "./interface";

const DefaultContinue: { continue: CardProps[] } = {
    continue: [],
}

export async function CheckContinue() {
    try {
        const appConfigDirPath = await appConfigDir();
        if (await exists(appConfigDirPath + "/continueWatch.json") == false) {
            await writeTextFile(appConfigDirPath + "/continueWatch.json", JSON.stringify(DefaultContinue))
            info("continue file make")
        }
    } catch (Error) {
        error(`Error in CheckContinue: ${Error}`)
    }
}

export async function SaveContinue(save: CardProps) {
    try {
        const appConfigDirPath = await appConfigDir();
        const file = await readTextFile(appConfigDirPath + "/continueWatch.json")
        const data = JSON.parse(file) as { continue: CardProps[] }
        const index = data.continue.findIndex(item => item.player?.episode === save.player?.episode)
        data.continue.splice(index, 1)
        data.continue.push(save)
        await writeTextFile(appConfigDirPath + "/continueWatch.json", JSON.stringify(data))
    } catch (Error) {
        error(`Error in SaveContinue: ${Error}`)
    }
}

export async function DeleteFromcontinue(data: CardProps) {
    try {
        const appConfigDirPath = await appConfigDir();
        const file = await readTextFile(appConfigDirPath + "/continueWatch.json")
        const list = JSON.parse(file) as { continue: CardProps[] }
        const index = list.continue.findIndex(item => item.player?.episode === data.player?.episode)
        list.continue.splice(index, 1)
        await writeTextFile(appConfigDirPath + "/continueWatch.json", JSON.stringify(list))
    } catch (Error) {
        error(`Error in DeleteFromcontinue: ${Error}`)
    }
}

export async function ReadContinue(): Promise<CardProps[]> {
    try {
        const appConfigDirPath = await appConfigDir();
        const file = await readTextFile(appConfigDirPath + "/continueWatch.json")
        const data = JSON.parse(file) as { continue: CardProps[] }
        return data.continue
    } catch (Error) {
        error(`Error in ReadContinue: ${Error}`)
        return []
    }
}