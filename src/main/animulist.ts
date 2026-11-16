import path from "path"
import { newConfigPath } from "."
import { animulistData } from "./types"
import fs from "fs"

export function checkDatabase(): animulistData[] {
    try {
        if (!fs.existsSync(path.join(newConfigPath, "animulistDatabase.json"))) {
            fs.writeFileSync(path.join(newConfigPath, "animulistDatabase.json"), JSON.stringify([]), "utf-8")
            return []
        }
        const database = fs.readFileSync(path.join(newConfigPath, "animulistDatabase.json"), "utf-8")

        return JSON.parse(database).map((v: animulistData) => ({
            ...v,
            animulist: {
                ...v["animulist"],
                endWatch: v["animulist"]["endWatch"] == 0 ? undefined : v["animulist"]["endWatch"]
            }
        } as animulistData)) as animulistData[]
    } catch (error) {
        console.error("animulist/checkDatabase", error)
        return []
    }
}