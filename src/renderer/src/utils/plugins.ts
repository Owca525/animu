import { toast, updateToast } from "./context/ToastNotification";
import { saveConfig } from "./FilesManager/config";
import { dateToUnix, request, updateObject } from "./functions";
import { getConfig } from "./stores/config";
import { getInformationPlugin, getPluginList, pluginManager, setPluginRepo } from "./stores/plugins";
import { informationPluginFormatList, playerPluginFormatList, pluginRepoExpanded } from "./types";
import semver from "semver";

export async function checkUpdateRepoPlugins() {
    const config = getConfig()
    let tmp: pluginRepoExpanded[] = []

    for (let index = 0; index < config.plugins.repoURL.length; index++) {
        const element = config.plugins.repoURL[index];
        const resp = await request(`${element}/database.json`)
        if (resp.success && resp.json && resp.json != {} as any) tmp = [...tmp, ...resp.json.map((v) => ({ ...v, repoURL: element }))];
    }

    localStorage.setItem("AnimuPluginDatabase ", JSON.stringify(tmp))
    setPluginRepo(tmp)
    saveConfig(updateObject("plugins.lastTimeCheck", dateToUnix(new Date().toString()), config))
    return tmp
}

export async function checkUpdatePlugins() {
    const pluginList = await checkUpdateRepoPlugins()

    const plugins = getPluginList()
    let reInitialInformation = false
    let reInitialPlayer = false

    const reloadPlugin = pluginList.filter((plugin) => {
        const tmp = plugins.find((v) => v.metadata.name == plugin.name)
        if (!tmp) return false

        const ver1 = semver.coerce(plugin.name)
        const ver2 = semver.coerce(tmp.metadata.version)

        if (!ver1 || !ver2) return false

        return semver.gt(ver1, ver2)
    })

    for (let index = 0; index < reloadPlugin.length; index++) {
        const element = reloadPlugin[index];
        const tmp = plugins.find((v) => v.metadata.name == element.name)
        if (!tmp) continue

        if (element["metadata"]["type"] == "player") reInitialPlayer = true
        if (element["metadata"]["type"] == "information") reInitialInformation = true

        const id = toast(`Update ${tmp.metadata.name} from ${element.ver} to ${tmp.metadata.version}`, { type: "loading", timer: true })
        await window.api.plugins.installUpdate(element)
        updateToast(id, "Update Succesfully Installed", { type: "success", timer: false })
    }

    if (reInitialInformation) await getInformationPlugin().initial()
    if (reInitialPlayer) await pluginManager().initialPlugins()
}

export async function reloadAllPlugins() {
    await pluginManager().initialPlugins()
    await getInformationPlugin().initial()
}

export async function changePlugin(plugin: playerPluginFormatList | informationPluginFormatList) {
    if (plugin["metadata"]["type"] == "information") {
        // TODO: ADD FUNCTIONALITY
        return
    }

    if (plugin["metadata"]["type"] == "player") {
        await pluginManager().changePlugin(plugin["metadata"]["name"])
    }
}