import { toast } from "./context/ToastNotification"


export async function CreateBackup() {
    if (!window.api) return
    let data = await window.api.backup.make()
    if (!data.success) {
        toast("Failed Maked backup", { type: "error" })
        console.error("Error in CreateBackup", data.error)
        return
    }
    toast("Backup created succesfuly", { type: "success" })
}

export async function RestoreBackup(file: string) {
    const backupProgress = await window.api.backup.restore(file)
    if (backupProgress.error) return toast("Failed making backup", { type: "error" })
    toast("Succesfully restored backup, restart application now", { type: "success" })
    return location.reload()
}