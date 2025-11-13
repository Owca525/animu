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