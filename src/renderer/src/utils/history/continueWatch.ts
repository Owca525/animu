import { toast } from "react-toastify";
import { cardData, notificationProps } from "../GlobalInterface";
import { convertToNewData } from "@renderer/plugins/allmanga";
import { CheckFile, DeleteFromFile, ReadFile, SaveToFile } from "./readFiles";

const appConfigDirPath = window.api.os.getPath("userData");

const DefaultContinue: { data: cardData[] } = {
    data: [],
};

async function ContinueDetectVersion() {
    let updatedToast: any
    try {
        let file = await window.api.os.read(await appConfigDirPath + "/continueWatch.json")
        file = JSON.parse(file)
        if (Array.isArray(file)) return
        if ("player" in file.continue[0]) {
            window.api.os.write(
                await appConfigDirPath + "/continueWatch.json.backup",
                JSON.stringify(file)
            );
            window.api.os.write(
                await appConfigDirPath + "/continueWatch.json",
                JSON.stringify(DefaultContinue)
            );
            toast.info("Backup File Old Continue watch done", notificationProps)
            let data: cardData[] = []
            let success: number = 0
            let failed: number = 0
            updatedToast = toast.loading(`Convert Continue Watch: Succes ${success}, Failed ${failed}`, notificationProps)
            for (let i = 0; i < file.continue.length; i++) {
                try {
                    const element = file.continue[i];
                    let tmp = await convertToNewData(element.id)
                    if (tmp) {
                        data.push({
                            ...tmp,
                            AnimeData: {
                                ...tmp.AnimeData,
                                player_ID: element.id
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
                    toast.update(updatedToast, { render: `Convert Continue Watch: Succes ${success}, Failed ${failed}` })
                } catch (Error) {
                    console.error(Error)
                    failed += 1
                    toast.update(updatedToast, { render: `Convert Continue Watch: Succes ${success}, Failed ${failed}` })
                }
            }
            toast.dismiss(updatedToast)
            toast.success(`Convertion Continue Watch Done: Succes ${success}, Failed ${failed}`, notificationProps)
            console.log(data)
            window.api.os.write(
                await appConfigDirPath + "/continueWatch.json",
                JSON.stringify(data)
            );
        }
    } catch (Error) {
        console.info(Error)
        toast.dismiss(updatedToast)
        toast.info("Failed Convert old continue watch to new", notificationProps)
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
    if (await DeleteFromFile(save, "continueWatch")) {
        toast.success("Succesfully Removed Anime from continue watch")
    }
}

export async function CheckContinue() {
    if (await CheckFile("continueWatch") == false) {
        await ContinueDetectVersion()
    }
}