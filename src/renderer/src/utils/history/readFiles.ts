import { toast } from "react-toastify";
import { refetchHistory } from "../functions";
import { cardData, notificationProps } from "../GlobalInterface";
import i18n from "../i18n";

const appConfigDirPath = window.api.os.getPath("userData");

export async function ReadFile(file: string): Promise<cardData[]> {
    try {
        await CheckFile(file)
        const dataFile = await window.api.os.read(await appConfigDirPath + `/${file}.json`)
        const data = JSON.parse(dataFile) as cardData[];
        if (data.length <= 0) return []
        return checkAnimeDuplicate(data).map((value: cardData) => { return { ...value, deletionCard: () => DeleteFromFile({ ...value, deletionCard: () => "", }, file) } }).reverse()
    } catch (Error) {
        console.error(`${Error} in ReadFile`)
        return [];
    }
}

export async function DeleteFromFile(data: cardData, file: string) {
    try {
        await CheckFile(file)
        const saveFile = await window.api.os.read(await appConfigDirPath + `/${file}.json`)
        const list = JSON.parse(saveFile) as cardData[];
        const index = list.findIndex(
            (item) => item.saveData?.episode === data.saveData?.episode && item.AnimeData.id === data.AnimeData.id
        );

        if (index != -1) list.splice(index, 1);

        window.api.os.write(await appConfigDirPath + `/${file}.json`, JSON.stringify(list))
        refetchHistory()

        if (data.deletionCard) {
            if (file === "continueWatch") {
                toast.success(i18n.t("history.continuesaved"), notificationProps)
            } else if (file === "history") {
                toast.success(i18n.t("history.historysaved"), notificationProps)
            }
        }
        return true
    } catch (Error) {
        console.error(`${Error} in DeleteFromFile`)
        if (data.deletionCard) {
            if (file === "continueWatch") {
                toast.error(i18n.t("history.continuefailed"), notificationProps)
            } else if (file === "history") {
                toast.error(i18n.t("history.historyfailed"), notificationProps)
            }
        }
        return false
    }
}

export async function SaveToFile(data: cardData, file: string): Promise<boolean> {
    try {
        await CheckFile(file)
        const saveFile = await window.api.os.read(await appConfigDirPath + `/${file}.json`);
        const tmpData = JSON.parse(saveFile) as cardData[];
        const index = tmpData.findIndex((item) => item.AnimeData.player_ID === data.AnimeData.player_ID);

        if (index != -1) tmpData.splice(index, 1);

        tmpData.push(data);
        window.api.os.write(await appConfigDirPath + `/${file}.json`, JSON.stringify(checkAnimeDuplicate(tmpData)))
        return true
    } catch (Error) {
        console.error(`${Error} in SaveToFile`)
        return false
    }
}

export async function CheckFile(file: string): Promise<boolean> {
    try {
        window.api.os.exists(await appConfigDirPath + `/${file}.json`);
        if (
            await window.api.os.exists(await appConfigDirPath + `/${file}.json`) == false
        ) {
            window.api.os.write(
                await appConfigDirPath + `/${file}.json`,
                JSON.stringify([])
            );
            return true
        }
        return false
    } catch (Error) {
        console.error(`${Error} in CheckFile`)
        return true
    }
}

function checkAnimeDuplicate(listcard: cardData[]): cardData[] {
    const map = new Map<string, cardData>()

    for (const element of listcard) {
        const title = element.AnimeData.title.romaji
        const current = map.get(title)

        if (!current || (element.saveData && current.saveData && element.saveData.episode > current.saveData.episode)) {
            map.set(title, element)
        }
    }

    return Array.from(map.values())
}