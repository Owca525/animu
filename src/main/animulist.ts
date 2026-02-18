import path from "path"
import { newConfigPath } from "."
import { AnimeData, animulistData } from "./types"
import { ipcMain } from "electron"
import fs from "fs"

export function checkDatabase(): animulistData[] {
    try {
        if (!fs.existsSync(path.join(newConfigPath, "animulistDatabase.json"))) {
            fs.writeFileSync(path.join(newConfigPath, "animulistDatabase.json"), JSON.stringify([]), "utf-8")
            return []
        }
        const database = fs.readFileSync(path.join(newConfigPath, "animulistDatabase.json"), "utf-8")
        return JSON.parse(database) as animulistData[]
    } catch (error) {
        console.error("animulist/checkDatabase", error)
        return []
    }
}

function saveToDatabase(data: animulistData[]) {
    return fs.writeFileSync(path.join(newConfigPath, "animulistDatabase.json"), JSON.stringify(data), "utf-8")
}

ipcMain.handle("animulist:saveToDatabase", async (_, data: animulistData) => {
    let database = checkDatabase()
    database.unshift({ ...data, AnimeData: { ...data.AnimeData, nextAiringEpisode: undefined, recommendations: undefined } })
    saveToDatabase(database.filter(
        (item, index, self) =>
            index === self.findIndex(i => i.AnimeData.id === item.AnimeData.id)
    ))
});
ipcMain.handle("animulist:deleteFromDatabase", async (_, id: string) => {
    let database = checkDatabase()
    saveToDatabase(database.filter((v) => v.AnimeData.id != id))
});
ipcMain.handle("animulist:updateDatabase", async (_, id, anime: { AnimeData: AnimeData; animulist: any }) => {
    let database = checkDatabase()
    saveToDatabase(database.map((v) => v.AnimeData.id == id ? { ...anime, 
        AnimeData: { 
            ...anime.AnimeData,
            nextAiringEpisode: undefined,
            recommendations: undefined
        }
    } : {
        ...v,
        AnimeData: {
            ...v.AnimeData,
            nextAiringEpisode: undefined,
            recommendations: undefined
        }
    }))
});
ipcMain.handle("animulist:getAllInformation", async (_) => checkDatabase());