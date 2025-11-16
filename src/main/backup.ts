import { app, ipcMain } from "electron";
import fs, { readdirSync } from "fs"
import archiver from "archiver";
import path from "path";
import { newConfigPath } from ".";

let backupFolder = path.join(app.getPath("userData"), "animuBackup")

export async function createBackup() {
    try {
        checkBackupFolder()
        const now = new Date();
        const dateString = now.toISOString().replace(/[:T]/g, '-').split('.')[0];
        await zipFolder(newConfigPath, path.join(backupFolder, `backup_${dateString}.zip`));
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}
// TODO: end making system backup
export async function getBackupList() {
    try {
        let backupFiles = readdirSync(backupFolder)
        return backupFiles.map((value) => {
            let match = value.match(/backup_(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})-(\d{2})/)
            if (!match) return
            const [_, year, month, day, hour, minute, second] = match
            return {
                file: value,
                date: new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`)
            }
        })
    } catch (error) {
        console.error(error)
        return []
    }
}

ipcMain.handle("makeBackup", async (_event) => createBackup());
ipcMain.handle("backupList", async (_event) => getBackupList());

async function checkBackupFolder() {
    if (!fs.existsSync(backupFolder)) {
        fs.mkdirSync(backupFolder);
    }
}

async function zipFolder(sourceDir: string, outPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outPath);
        const archive = archiver("zip", { zlib: { level: 9 } });

        output.on("close", resolve);
        archive.on("error", reject);

        archive.pipe(output);
        archive.directory(sourceDir, false);
        archive.finalize();
    });
}