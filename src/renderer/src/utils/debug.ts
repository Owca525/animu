import { unwrap } from "solid-js/store";
import { getConfig } from "./stores/config";
import { getGlobalCache } from "./stores/global";
import { getHomeCache } from "./stores/home";
import { getInformationPlugin, getPlayerPLugin, getPluginRepo, pluginManager } from "./stores/plugins";
import { request, sendNotification } from "./functions";
import { t } from "./i18n";
import icon from '@resources/icon.png';

(window as any).getConfig = () => unwrap(getConfig());
(window as any).getGlobalCache = () => unwrap(getGlobalCache());
(window as any).getHomeCache = () => unwrap(getHomeCache());
(window as any).getInformationPlugin = () => unwrap(getInformationPlugin());
(window as any).getPlayerPLugin = () => unwrap(getPlayerPLugin());
(window as any).getPluginRepo = () => unwrap(getPluginRepo());
(window as any).pluginManager = () => unwrap(pluginManager());
(window as any).sendNotification = sendNotification;
(window as any).request = request;
(window as any).testNotitication = () => {
    sendNotification({
        title: t("update.available", { ver: window["animuAppInfo"]["ver"] }),
        description: "New Update is Avaible",
        icon: icon
    })
}