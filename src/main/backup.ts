import { app, ipcMain } from "electron";
import fs, { existsSync, readdirSync } from "fs"
import archiver from "archiver";
import path from "path";
import { initialBackend, newConfigPath } from ".";
import AdmZip from 'adm-zip'

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
        }).filter(item => item !== undefined)
    } catch (error) {
        console.error(error)
        return []
    }
}
// Error: 2, missing file
// Error: 1, Uknown Error
export async function RestoreBackup(file: string): Promise<{ success: boolean, error?: number }> {
    try {
        if (!existsSync(path.join(backupFolder, file))) return { success: false, error: 2 }
        fs.rmdirSync(path.join(app.getPath("userData"), "animuConfig"))
        const zip = new AdmZip(path.join(backupFolder, file))
        zip.extractAllTo(path.join(app.getPath("userData"), "animuConfig"), true)
        await initialBackend()
        return { success: true }
    } catch (error) {
        console.error("Error when restoring backup", error)
        return { success: false, error: 1 }
    }
}

ipcMain.handle("restoreBackup", async (_event, file: string) => RestoreBackup(file));
ipcMain.handle("makeBackup", async (_event) => createBackup());
ipcMain.handle("backupList", async (_event) => (await getBackupList()).sort((a, b) => a.date.getTime() - b.date.getTime()));

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