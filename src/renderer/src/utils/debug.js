import { unwrap } from "solid-js/store";
import { getConfig } from "./stores/config";
import { getGlobalCache } from "./stores/global";
import { getHomeCache } from "./stores/home";
import { getAllPluginList, getInformationPlugin, getPlayerPLugin, getPluginRepo } from "./stores/plugins";
import { request } from "./functions";
import { t } from "./i18n";
import icon from '@resources/icon.png';
import { sendNotification } from "./NotificationManager";
import pluginManager from "./pluginManager";

window.getConfig = () => unwrap(getConfig());
window.getGlobalCache = () => unwrap(getGlobalCache());
window.getHomeCache = () => unwrap(getHomeCache());
window.getInformationPlugin = () => unwrap(getInformationPlugin());
window.getAllPluginList = () => unwrap(getAllPluginList());
window.getPlayerPLugin = () => unwrap(getPlayerPLugin());
window.getPluginRepo = () => unwrap(getPluginRepo());
window.pluginManager = () => pluginManager;
window.sendNotification = sendNotification;
window.request = request;
window.testNotitication = () => {
    sendNotification({
        title: t("update.available", { ver: window["animuAppInfo"]["ver"] }),
        description: "New Update is Avaible",
        icon: icon
    })
}