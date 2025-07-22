import { toast } from "react-toastify";
import { AnimeData, cardData, notificationProps } from "../GlobalInterface";
import { convertToNewData } from "@renderer/plugins/allmanga";
import { CheckFile, DeleteFromFile, ReadFile, SaveToFile } from "./readFiles";
import { t } from "i18next";
import { SearchConvertData } from "@renderer/plugins/anilistApi";

const appConfigDirPath = window.api.os.getPath("userData");

const DefaultHistory: { data: cardData[] } = {
    data: [],
};

export async function HistoryDetectVersion(): Promise<boolean> {
    let updatedToast: any
    try {
        let file = await window.api.os.read(await appConfigDirPath + "/history.json")
        file = JSON.parse(file)
        if (file == "{}") return true
        if ("AnimeData" in file[0]) return true
        if ("id" in file[0]) {
            let nowDate = new Date();
            window.api.os.write(
                await appConfigDirPath + `/history.json.backup-${nowDate.toISOString().replace(/[:.]/g, '-')}`,
                JSON.stringify(file)
            );
            window.api.os.write(
                await appConfigDirPath + "/history.json",
                JSON.stringify(DefaultHistory)
            );
            toast.info(t("oldBackup.backuphistory"), notificationProps)
            let data: cardData[] = []
            let success: number = 0
            let failed: number = 0
            updatedToast = toast.loading(t("oldBackup.converthistory", { success: success, failed: failed }), notificationProps)
            for (let i = 0; i < file.length; i++) {
                try {
                    const element = file[i];
                    let tmp = await convertToNewData(element.id)
                    if (tmp) {
                        let tmpAnimeData: AnimeData | undefined = undefined
                        let animeData = await SearchConvertData(tmp.AnimeData)
                        console.log("HISTORY", animeData, tmp.AnimeData)
                        if (animeData) {
                            tmpAnimeData = animeData
                        } else {
                            tmpAnimeData = tmp.AnimeData
                        }
                        data.push({
                            ...tmp,
                            AnimeData: {
                                ...tmpAnimeData,
                                player_ID: element.id,
                                episodesList: undefined,
                                nextAiringEpisode: undefined
                            },
                            saveData: {
                                pluginName: "",
                                last_Time: 0,
                                episode: element.text.split(" ")[3],
                                type: ""
                            }
                        })
                        success += 1
                    } else {
                        failed += 1
                    }
                    toast.update(updatedToast, { render: t("oldBackup.converthistory", { success: success, failed: failed }) })
                } catch (Error) {
                    console.error(Error)
                    failed += 1
                    toast.update(updatedToast, { render: t("oldBackup.converthistory", { success: success, failed: failed }) })
                }
            }
            toast.dismiss(updatedToast)
            toast.success(t("oldBackup.converthistorydone", { success: success, failed: failed }), notificationProps)
            window.api.os.write(
                await appConfigDirPath + "/history.json",
                JSON.stringify(data)
            );
        }
        return true
    } catch (error) {
        if (error instanceof Error) {
            if (error.message == "Unexpected end of JSON input") {
                toast.dismiss(updatedToast)
                return true
            }
        }
        console.log(error)
        toast.dismiss(updatedToast)
        toast.info(t("oldBackup.converthistoryfailed"), notificationProps)
        return false
    }
}

export async function ReadHistory(size?: number): Promise<cardData[]> {
    let data = await ReadFile("history")
    if (size) return data.slice(0, size)
    return data
}

export async function SaveHistory(save: cardData) {
    await SaveToFile(save, "history")
}

export async function DeleteFromHistory(save: cardData) {
    if (await DeleteFromFile(save, "history")) {
        toast.success("Succesfully Removed Anime from History watch")
    }
}

export async function CheckHistory() {
    if (await CheckFile("history") == false) {
        await HistoryDetectVersion()
    }
}

// This too
export async function HistoryCheckConvert() {
    let data = await ReadHistory()
    let updatedToast: any
    let nowDate = new Date();
    window.api.os.write(
        await appConfigDirPath + `/history.json.backup-${nowDate.toISOString().replace(/[:.]/g, '-')}`,
        JSON.stringify(await window.api.os.read(await appConfigDirPath + "/history.json"))
    );
    window.api.os.write(
        await appConfigDirPath + "/history.json",
        JSON.stringify(DefaultHistory)
    );
    let success: number = 0
    let failed: number = 0
    let animeCardData: cardData[] = []
    updatedToast = toast.loading(t("oldBackup.converthistory", { success: success, failed: failed }), notificationProps)
    for (let index = 0; index < data.length; index++) {
        const element = data[index];
        if (typeof element.AnimeData.title === "string") {
            let tmp = await convertToNewData(element.AnimeData.player_ID ? element.AnimeData.player_ID : "")
            if (tmp) {
                let savedAnime = await SearchConvertData(tmp.AnimeData)
                if (savedAnime != undefined) {
                    console.log(savedAnime, element)
                    animeCardData.push({
                        ...element,
                        AnimeData: {
                            ...element.AnimeData,
                            ...savedAnime
                        }
                    })
                    success += 1
                } else {
                    failed += 1
                    animeCardData.push({
                        ...element,
                        ...tmp,
                        AnimeData: {
                            ...element.AnimeData,
                            ...tmp.AnimeData
                        }
                    })
                    toast.error(t("oldBackup.failedconvert", { title: tmp.AnimeData.title.romaji }), notificationProps)
                }
            } else {
                failed += 1
            }
        } else {
            success += 1
        }
        toast.update(updatedToast, { render: t("oldBackup.converthistory", { success: success, failed: failed }) })
    }
    window.api.os.write(
        await appConfigDirPath + "/history.json",
        JSON.stringify(animeCardData.reverse())
    );
    toast.dismiss(updatedToast)
    toast.success(t("oldBackup.converthistorydone", { success: success, failed: failed }), notificationProps)
}