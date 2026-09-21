import { ipcMain } from "electron";
import { UserData } from "./types";
import { dateToUnix } from "./utils";
import { userdataFile } from ".";
import { writeFileSync } from "fs";

export const DefaultUserData: UserData = {
    username: "User",
    created_date: dateToUnix(new Date().toString()),
    animu_time: 0
}

ipcMain.handle('user:update', (_event, user: UserData): boolean => {
    try {
        writeFileSync(userdataFile, JSON.stringify(user), "utf-8") 
        return true
    } catch (error) {
        console.error("user:update", error)
        return false
    }
})

ipcMain.handle('user:reset', (_event): boolean => {
    try {
        writeFileSync(userdataFile, JSON.stringify(DefaultUserData), "utf-8") 
        return true
    } catch (error) {
        console.error("user:reset", error)
        return false
    }
})