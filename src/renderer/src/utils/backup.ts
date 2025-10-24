import { toast } from "react-toastify"
import { notificationProps } from "./GlobalInterface"

export async function CreateBackup() {
    let data = await window.api.backup.make()
    if (!data.success) {
        toast.error("Failed Maked backup", notificationProps)
        console.error("Error in CreateBackup", data.error)
        return
    }
    toast.info("Backup created succesfuly", notificationProps)
}