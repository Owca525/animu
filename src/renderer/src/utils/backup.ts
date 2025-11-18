import toast from "solid-toast"

export async function CreateBackup() {
    if (!window.api) return
    let data = await window.api.backup.make()
    if (!data.success) {
        toast.error("Failed Maked backup")
        console.error("Error in CreateBackup", data.error)
        return
    }
    toast.success("Backup created succesfuly")
}

export async function RestoreBackup(file: string) {
    const backupProgress = await window.api.backup.restore(file)
    if (backupProgress.error) return toast.error("Failed making backup")
    toast.success("Succesfully restored backup, restart application now")
    return location.reload()
}