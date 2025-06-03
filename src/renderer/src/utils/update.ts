import { toast } from "react-toastify";
import { saveConfig } from "./config";
import { notificationProps } from "./GlobalInterface";
import { t } from "i18next";
import store from "./store";

export function checkUpdate() {
    window.api.update.updateAvailable((_event, isAvailable, version) => {
        if (isAvailable) {
            toast.info(t('toast.update', { version: version }), { ...notificationProps, onClick: () => { window.api.update.downloadUpdate(); downloadUpdate(toast.loading(t("update.progress", { procent: 0 }), notificationProps)) } });
        }
    });
    let config = store.getState().config
    if (config) {
        const currentDate = new Date();
        config.update.lastTime = currentDate.toString()
        saveConfig(config)
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