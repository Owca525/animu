import { toast } from "react-toastify";
import { notificationProps, SettingsConfig } from "./interface";
import { saveConfig } from "./config";

export function checkUpdate(t: any, config: SettingsConfig | undefined) {
    window.api.update.updateAvailable((_event, isAvailable, version) => {
        if (isAvailable) {
            toast.info(t('toast.update', { version: version }), { ...notificationProps, onClick: () => { window.api.update.downloadUpdate(); downloadUpdate(toast.loading(`Download Progress 0%`, notificationProps)) } });
        }
    });
    if (config) {
        const currentDate = new Date();
        config.update.lastTime = currentDate.toString()
        saveConfig(config)
    }
}

export function downloadUpdate(updateNotification: any) {
    window.api.update.updateProgress((_event, percent) => {
        toast.update(updateNotification, { render: `Download Progress ${percent.toFixed(1)}%` })
        if (percent.toFixed(0) == '100') {
            toast.dismiss(updateNotification)
            toast.success("Updated Download, please restart application", notificationProps)
        }
    });
}