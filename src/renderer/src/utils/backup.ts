import { toast } from "./context/ToastNotification"
import { t } from "./i18n"

export async function CreateBackup() {
    /* IFDEF DEBUG|PROD */
    let data = await window.api.backup.make()
    if (!data.success) {
        toast(t("settings.backup.failed"), { type: "error" })
        console.error("Error in CreateBackup", data.error)
        return
    }
    toast(t("settings.backup.created"), { type: "success" })
    /* ENDIF */
}

export async function RestoreBackup(file: string) {
    /* IFDEF DEBUG|PROD */
    const backupProgress = await window.api.backup.restore(file)
    if (backupProgress.error) return toast(t("settings.backup.failed"), { type: "error" })
    toast(t("settings.backup.restored"), { type: "success" })
    return location.reload()
    /* ENDIF */
}