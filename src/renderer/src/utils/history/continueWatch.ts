import { toast } from "react-toastify";
import { AnimeData, cardData, notificationProps } from "../GlobalInterface";
import { convertToNewData } from "@renderer/plugins/allmanga";
import { CheckFile, DeleteFromFile, ReadFile, SaveToFile } from "./readFiles";
import { t } from "i18next";
import { SearchConvertData } from "@renderer/plugins/anilistApi";

const appConfigDirPath = window.api.os.getPath("userData");

const DefaultContinue: { data: cardData[] } = {
    data: [],
};

export async function ContinueDetectVersion(): Promise<boolean> {
    let updatedToast: any
    try {
        let file = await window.api.os.read(await appConfigDirPath + "/continueWatch.json")
        file = JSON.parse(file)
        if (Array.isArray(file)) return true
        if ("player" in file.continue[0]) {
            let nowDate = new Date();
            window.api.os.write(
                await appConfigDirPath + `/continueWatch.json.backup-${nowDate.toISOString().replace(/[:.]/g, '-')}`,
                JSON.stringify(file)
            );
            window.api.os.write(
                await appConfigDirPath + "/continueWatch.json",
                JSON.stringify(DefaultContinue)
            );
            toast.info(t("oldBackup.backupcontinue"), notificationProps)
            let data: cardData[] = []
            let success: number = 0
            let failed: number = 0
            updatedToast = toast.loading(t("oldBackup.convertcontinue", { success: success, failed: failed }), notificationProps)
            for (let i = 0; i < file.continue.length; i++) {
                try {
                    const element = file.continue[i];
                    let tmp = await convertToNewData(element.id)
                    if (tmp) {
                        let tmpAnimeData: AnimeData | undefined = undefined
                        let animeData = await SearchConvertData(tmp.AnimeData)
                        console.log("CONTINUE WATCH", animeData, tmp.AnimeData)
                        if (animeData) {
                            tmpAnimeData = animeData
                        } else {
                            tmpAnimeData = tmp.AnimeData
                        }
                        console.log(animeData, tmpAnimeData)
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
                                last_Time: element.player.time,
                                episode: element.player.episode.ep,
                                type: element.player.episode.type
                            }
                        })
                        success += 1
                    } else {
                        failed += 1
                    }
                    toast.update(updatedToast, { render: t("oldBackup.convertcontinue", { success: success, failed: failed }) })
                } catch (Error) {
                    console.error(Error)
                    failed += 1
                    toast.update(updatedToast, { render: t("oldBackup.convertcontinue", { success: success, failed: failed }) })
                }
            }
            toast.dismiss(updatedToast)
            toast.success(t("oldBackup.convertcontinuedone", { success: success, failed: failed }), notificationProps)
            window.api.os.write(
                await appConfigDirPath + "/continueWatch.json",
                JSON.stringify(data)
            );
        }
        return true
    } catch (Error) {
        console.info(Error)
        toast.dismiss(updatedToast)
        toast.info(t("oldBackup.convertcontinuefailed"), notificationProps)
        return false
    }
}

export async function ReadContinue(size?: number): Promise<cardData[]> {
    let data = await ReadFile("continueWatch")
    if (size) return data.slice(0, size)
    return data
}

export async function SaveContinue(save: cardData) {
    await SaveToFile(save, "continueWatch")
}

export async function DeleteFromContinue(save: cardData) {
    await DeleteFromFile(save, "continueWatch")
}

export async function CheckContinue() {
    if (await CheckFile("continueWatch") == false) {
        await ContinueDetectVersion()
    }
}

// I hate this code
export async function ContinueCheckConversion() {
    let data = await ReadContinue()
    let nowDate = new Date();
    window.api.os.write(
        await appConfigDirPath + `/continueWatch.json.backup-${nowDate.toISOString().replace(/[:.]/g, '-')}`,
        JSON.stringify(await window.api.os.read(await appConfigDirPath + "/continueWatch.json"))
    );
    window.api.os.write(
        await appConfigDirPath + "/continueWatch.json",
        JSON.stringify(DefaultContinue)
    );
    let success: number = 0
    let failed: number = 0
    let updatedToast: any
    let animeCardData: cardData[] = []
    updatedToast = toast.loading(t("oldBackup.convertcontinue", { success: success, failed: failed }), notificationProps)
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
                        AnimeData: savedAnime
                    })
                    success += 1
                } else {
                    failed += 1
                    animeCardData.push({
                        ...element,
                        ...tmp,
                    })
                    toast.error(`Failed Covert ${tmp.AnimeData.title.romaji}`, notificationProps)
                }
            } else {
                failed += 1
            }
        } else {
            success += 1
        }
        toast.update(updatedToast, { render: t("oldBackup.convertcontinue", { success: success, failed: failed }) })
    }
    window.api.os.write(
        await appConfigDirPath + "/continueWatch.json",
        JSON.stringify(animeCardData.reverse())
    );
    console.log(animeCardData)
    toast.dismiss(updatedToast)
    toast.success(t("oldBackup.convertcontinuedone", { success: success, failed: failed }), notificationProps)
}