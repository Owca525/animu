import { unwrap } from "solid-js/store";
import { getConfig } from "./stores/config";
import { getGlobalCache } from "./stores/global";
import { getHomeCache } from "./stores/home";
import { getInformationPlugin, getPlayerPLugin, getPluginList, getPluginRepo, pluginManager } from "./stores/plugins";

(window as any).getConfig = () => unwrap(getConfig());
(window as any).getGlobalCache = () => unwrap(getGlobalCache());
(window as any).getHomeCache = () => unwrap(getHomeCache());
(window as any).getPluginList = () => unwrap(getPluginList());
(window as any).getInformationPlugin = () => unwrap(getInformationPlugin());
(window as any).getPlayerPLugin = () => unwrap(getPlayerPLugin());
(window as any).getPluginRepo = () => unwrap(getPluginRepo());
(window as any).pluginManager = () => unwrap(pluginManager());