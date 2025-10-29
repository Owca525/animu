import { toast } from "react-toastify";
import { saveConfig } from "./FilesManager/config";
import { notificationProps } from "./GlobalInterface";
import { t } from "i18next";
import store from "./store";

export async function checkUpdate(alwaysShow: boolean = false) {
    try {
        let update = await window.api.update.checkUpdate()
        if (update.available) {
            toast.info(t('update.available', { ver: update.version }), { ...notificationProps, onClick: () => { window.api.update.downloadUpdate(); downloadUpdate(toast.loading(t("update.progress", { procent: 0 }), notificationProps)) } });
        } else if (alwaysShow) {
            toast.info(t("update.same", notificationProps))
        }
        
        let config = store.getState().config
        if (config) {
            const currentDate = new Date();
            config.update.lastTime = currentDate.toString()
            saveConfig(config)
        }
    } catch (error) {
        console.error("Error in checkUpdate", error)
        toast.error("Failed Check is update avaible")
    }
}

export function downloadUpdate(updateNotification: any) {
    window.api.update.updateProgress((_event, percent) => {
        toast.update(updateNotification, { render: t("update.progress", { procent: percent.toFixed(1) }) })
        if (percent.toFixed(0) == '100') {
            toast.dismiss(updateNotification)
            toast.success(t("update.done"), notificationProps)
        }
    });
}