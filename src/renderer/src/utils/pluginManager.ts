import AnilistApi from "@renderer/plugins/anilistApi";
import { genresSearchFormat, informationPluginManagerFormat, informationPluginFormat, playerPluginManagerFormat, playerPluginFormat } from "./types";
import { getPluginRepo, setPlayerPlugin, setPluginPlayerList } from "./stores/plugins";
import Allmanga from "@renderer/plugins/allmanga";
import Anizone from "@renderer/plugins/anizone";
import GojoLive from "@renderer/plugins/gojoLive";
import LycorisCafe from "@renderer/plugins/lycoriscafe";
import { getConfig } from "./stores/config";
import { detectIndex, getPluginInitialConfig, getPluginsList, getRenderPath, setHomeData } from "./functions";
import semver from "semver";
import yummyani from "@renderer/plugins/yummyani";
// import Aowu from "@renderer/plugins/aowu";

export class PlayerPluginManager implements playerPluginManagerFormat {
    currentPlugin: playerPluginFormat | undefined;
    pluginList: playerPluginFormat[] = [
        // new Allmanga,
        // new Anizone,
        // new GojoLive,
        // new LycorisCafe,
    ];
    changePlugin = (plugin_id: string): playerPluginFormat => {
        const loadedPlugins: playerPluginFormat[] = this.pluginList
        try {
            for (let index = 0; index < loadedPlugins.length; index++) {
                const element = loadedPlugins[index]
                if (element.metadata.name == plugin_id) {
                    setPlayerPlugin(element)
                    return element
                }
                if (plugin_id == "" && element.metadata.name == "Allmanga") {
                    setPlayerPlugin(element)
                    return element
                }
            }
            return loadedPlugins[0]
        } catch (error) {
            console.error(error)
            return loadedPlugins[0]
        }
    }
    loadPlugin = async (plugins: { file: string; content: string; type: "official" | "user"; sha256: string; pluginType: "player" | "information" }[]) => {
        const conf = getConfig()
        const repoPlugins = getPluginRepo()
        let tmp: any[] = []
        for (let index = 0; index < plugins.length; index++) {
            const plugin = plugins[index];
            if (plugin.pluginType == "information") continue
            if (plugin.type != "official" && !conf.plugins.userPlugins) continue
            const tmpPlugin = repoPlugins.find((v) => v.name.toLowerCase() == plugin.file.replaceAll(".js", "").toLowerCase())
            if (tmpPlugin && plugin.type != "user" && tmpPlugin.sha256 != plugin.sha256) continue 
            try {
                const newBlob = new Blob([detectIndex(plugin.content)], { type: "application/javascript" });
                const newUrl = URL.createObjectURL(newBlob);
                tmp.push((await import(newUrl)).default)
            } catch (error) {
                console.warn("Failed Load Module", error, plugin, detectIndex(plugin.content))
            }
        }
        return tmp
    }

    initialPlugins = async (): Promise<void> => {
        if (this.pluginList.length > 0) return
        const localPlugins = [Allmanga, Anizone, GojoLive, LycorisCafe, yummyani]

        const plugins = await getPluginsList()
        const externalPlugins = await this.loadPlugin(plugins)

        for (let index = 0; index < localPlugins.length; index++) {
            try {
                const plugin = localPlugins[index] as any;
                const tmp = new plugin
                if (tmp.config) tmp.config = await getPluginInitialConfig(tmp.metadata.name, tmp.config)
                this.pluginList.push(tmp)
            } catch (error) {
                console.warn("Failed Load Module", error, localPlugins[index])
            }
        }

        for (let index = 0; index < externalPlugins.length; index++) {
            try {
                const plugin = externalPlugins[index];
                const tmp = new plugin
                if (tmp.config) tmp.config = await getPluginInitialConfig(tmp.metadata.name, tmp.config)
                this.pluginList.push(tmp)
            } catch (error) {
                console.warn("Failed Load Module", error, externalPlugins[index])
            }
        }

        this.pluginList = this.pluginList.filter((item, _, arr) => {
            return !arr.some(
                other =>
                    other.metadata.name === item.metadata.name &&
                    semver.gt(semver.coerce(other.metadata.version) as any, semver.coerce(item.metadata.version) as any)
            );
        })

        this.currentPlugin = this.pluginList[0]
        setPlayerPlugin(this.pluginList[0])

        setPluginPlayerList(this.pluginList)
        const config = getConfig()
        for (let index = 0; index < this.pluginList.length; index++) {
            const element = this.pluginList[index];
            if (element.metadata.name == config.plugins.player) {
                setPlayerPlugin(element)
                this.currentPlugin = element
                return
            }
        }
    }
}

export class informationPluginManager implements informationPluginManagerFormat {
    initial = async () => {
        const conf = getConfig()
        const path = `${getRenderPath()}index.js`
        const plugins = await getPluginsList()
        const infoPlugins = plugins.filter((t) => t.pluginType == "information")
        const repoPlugins = getPluginRepo()

        if (infoPlugins.length <= 0) {
            const tmp = new AnilistApi()
            if (tmp.config) tmp.config = await getPluginInitialConfig(tmp.metadata.name, tmp.config)
            this.currentPlugin = tmp
            return
        }

        for (let index = 0; index < infoPlugins.length; index++) {
            const element = infoPlugins[index];
            if (element.file.toLowerCase() != "anilistapi.js") continue
            const tmpPlugin = repoPlugins.find((v) => v.name.toLowerCase() == element.file.replaceAll(".js", "").toLowerCase())
            if (tmpPlugin && tmpPlugin.sha256 != element.sha256) continue
            if (element.type == "official" && !conf.plugins.userPlugins) {
                const newBlob = new Blob([element.content.replaceAll("./index.js", element.file).replaceAll("index.js", path)], { type: "application/javascript" });
                const newUrl = URL.createObjectURL(newBlob);
                const tmp = new (await import(newUrl))
                if (tmp.config) tmp.config = await getPluginInitialConfig(tmp.metadata.name, tmp.config)
                this.currentPlugin = tmp
            }
        }
    }

    //   private plugins: informationPluginFormat[] = [];
    currentPlugin: informationPluginFormat = new AnilistApi()

    searchAnime = (name: string, page: number, params?: genresSearchFormat) => {
        setHomeData(async () => await this.currentPlugin.search(name, page, params))
    };
    // schedule = (airingStart?: number, airingEnd?: number): void => {
    //     this.currentPlugin.schedule({ airingStart, airingEnd }, {
    //         onSuccess: function (data: containerData): void {
    //             throw new Error("Function not implemented.");
    //         },
    //         onError: function (error: string): void {
    //             throw new Error("Function not implemented.");
    //         }
    //     })
    // }
    home = () => {
        setHomeData(this.currentPlugin.home)
    }
    anime = async (id: string) => {
        return await this.currentPlugin.anime({ id: id })
    }
}