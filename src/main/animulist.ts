import path from "path"
import { newConfigPath } from "."
import { animulistData } from "./types"
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
    database.unshift(data)
    saveToDatabase(database)
});
ipcMain.handle("animulist:deleteFromDatabase", async (_, id: string) => {
    let database = checkDatabase()
    let index = database.findIndex(
        (item) => id === item.AnimeData.id
    );
    if (index <= 0) return
    database.slice(index, 1)
    saveToDatabase(database)
});
ipcMain.handle("animulist:updateDatabase", async (_, id, anime) => {
    let database = checkDatabase()
    saveToDatabase(database.map((v) => v.AnimeData.id == id ? anime : v))
});
ipcMain.handle("animulist:getAllInformation", async (_) => checkDatabase());