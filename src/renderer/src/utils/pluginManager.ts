import AnilistApi from "@renderer/plugins/anilistApi";
import { containerData, genresSearchFormat, informationPluginManagerFormat, informationPluginFormat, playerPluginManagerFormat, playerPluginFormat } from "./types";
import { setAllHomeData } from "./stores/home";
import { getPlayerPLugin, setPlayerPlugin, setPluginPlayerList } from "./stores/plugins";
import Allmanga from "@renderer/plugins/allmanga";
import Anizone from "@renderer/plugins/anizone";
import GojoLive from "@renderer/plugins/gojoLive";
import LycorisCafe from "@renderer/plugins/lycoriscafe";
import { getConfig } from "./stores/config";
import { getRenderPath } from "./functions";
import semver from "semver";
// import Aowu from "@renderer/plugins/aowu";

export function saveConfig(config: { [key: string]: any }) {
    const manager = getPlayerPLugin()
    if (!manager) return
    window.api.plugins.saveConfig(manager.metadata.name, config)
}

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
    initialPlugins = async (): Promise<void> => {
        const localPlugins = [Allmanga, Anizone, GojoLive, LycorisCafe]
        let externalPlugins: any[] = []
        const conf = getConfig()

        const index = `${getRenderPath()}index.js`
        const plugins = await window.api.plugins.list()
        plugins.forEach(async (plugin) => {
            try {
                if (plugin.file == "anilistApi.js") return
                const newBlob = new Blob([plugin.content.replaceAll("./index.js", index).replaceAll("index.js", index)], { type: "application/javascript" });
                const newUrl = URL.createObjectURL(newBlob);
                /* @vite-ignore */
                const newModule = await import(newUrl);
                if (plugin.type == "official") externalPlugins.push(newModule.default)
                else if (conf.plugins.userPlugins) externalPlugins.push(newModule.default)
            } catch (error) {
                console.warn("Failed Load Module", error)
            }
        })

        for (let index = 0; index < localPlugins.length; index++) {
            try {
                const plugin = localPlugins[index];
                const tmp = new plugin
                if (tmp.config) tmp.config = await window.api.plugins.getConfig(tmp.metadata.name, tmp.config ? tmp.config : {})
                this.pluginList.push(tmp)
            } catch (error) {
                console.warn("Failed Load Module", error)
            }
        }

        for (let index = 0; index < externalPlugins.length; index++) {
            try {
                const plugin = externalPlugins[index];
                const tmp = new plugin
                if (tmp.config) tmp.config = await window.api.plugins.getConfig(tmp.metadata.name, tmp.config ? tmp.config : {})
                this.pluginList.push(tmp)
            } catch (error) {
                console.warn("Failed Load Module", error)
            }
        }

        console.log(this.pluginList)

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
        // TODO: End this
        const conf = getConfig()
        const plugins = await window.api.plugins.list()

        for (let index = 0; index < plugins.length; index++) {
            const element = plugins[index];
            if (element.file != "anilistApi.js") continue

            if (element.type == "official" && !conf.plugins.userPlugins) {

            }
        }

    }

    //   private plugins: informationPluginFormat[] = [];
    currentPlugin: informationPluginFormat = new AnilistApi()

    searchAnime = (name: string, page: number, params?: genresSearchFormat) => {
        setAllHomeData({ data: { sections: [] }, isLoading: true, isError: false, } as any)
        this.currentPlugin.search({ name, page, params }, {
            onSuccess: (data: containerData) => {
                setAllHomeData({ data: { sections: [data] }, isLoading: false, isError: false, } as any)
            },
            onError: (_error: string) => {
                setAllHomeData({ data: { sections: [] }, isLoading: false, isError: true, } as any)
            }
        });
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
        setAllHomeData({ data: { sections: [] }, isLoading: true, isError: false, } as any)
        this.currentPlugin.home({
            onSuccess: (data: { topCards?: containerData; sections: containerData[]; }) => {
                setAllHomeData({
                    data: { topCards: data.topCards, sections: data.sections },
                    isLoading: false,
                    isError: false,
                } as any)
            },
            onError: (_error: string) => {
                setAllHomeData({ data: { sections: [] }, isLoading: false, isError: true, } as any)
            }
        })
    }
    anime = async (id: string) => {
        return await this.currentPlugin.anime({ id: id })
    }
}