import { toast } from "react-toastify";
import { cardData, notificationProps } from "../GlobalInterface";
import { convertToNewData } from "@renderer/plugins/allmanga";
import { CheckFile, DeleteFromFile, ReadFile, SaveToFile } from "./readFiles";

const appConfigDirPath = window.api.os.getPath("userData");

const DefaultHistory: { data: cardData[] } = {
    data: [],
};

async function HistoryDetectVersion() {
    let updatedToast: any
    try {
        let file = await window.api.os.read(await appConfigDirPath + "/history.json")
        file = JSON.parse(file)
        console.log(file)
        if ("data" in file) return
        if ("id" in file[0]) {
            window.api.os.write(
                await appConfigDirPath + "/history.json.backup",
                JSON.stringify(file)
            );
            window.api.os.write(
                await appConfigDirPath + "/history.json",
                JSON.stringify(DefaultHistory)
            );
            toast.info("Backup File Old History done", notificationProps)
            let data: cardData[] = []
            let success: number = 0
            let failed: number = 0
            updatedToast = toast.loading(`Convert History: Succes ${success}, Failed ${failed}`, notificationProps)
            for (let i = 0; i < file.length; i++) {
                try {
                    const element = file[i];
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
                                last_Time: 0,
                                episode: element.text.split(" ")[3],
                                type: ""
                            }
                        })
                        success += 1
                    } else {
                        failed += 1
                    }
                    toast.update(updatedToast, { render: `Convert History: Succes ${success}, Failed ${failed}` })
                } catch (Error) {
                    console.error(Error)
                    failed += 1
                    toast.update(updatedToast, { render: `Convert History: Succes ${success}, Failed ${failed}` })
                }
            }
            toast.dismiss(updatedToast)
            toast.success(`Convertion History Done: Succes ${success}, Failed ${failed}`, notificationProps)
            window.api.os.write(
                await appConfigDirPath + "/history.json",
                JSON.stringify(data)
            );
        }
    } catch (Error) {
        console.info(Error)
        toast.dismiss(updatedToast)
        toast.info("Failed Convert old History watch to new", notificationProps)
    }
}

export async function ReadHistory(): Promise<cardData[]> {
    return await ReadFile("history")
}

export async function SaveHistory(save: cardData)  {
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