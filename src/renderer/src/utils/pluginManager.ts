import AnilistApi from "@renderer/plugins/anilistApi";
import { containerData, genresSearchFormat, informationPluginManagerFormat, informationPluginFormat, playerPluginManagerFormat, playerPluginFormat } from "./types";
import { setAllHomeData } from "./stores/home";
import { setPlayerPlugin, setPluginPlayerList } from "./stores/plugins";
import Allmanga from "@renderer/plugins/allmanga";
import Anizone from "@renderer/plugins/anizone";
import GojoLive from "@renderer/plugins/gojoLive";
import LycorisCafe from "@renderer/plugins/lycoriscafe";
import { getConfig } from "./stores/config";
// import Aowu from "@renderer/plugins/aowu";

export class PlayerPluginManager implements playerPluginManagerFormat {
    currentPlugin: playerPluginFormat | undefined;
    pluginList: playerPluginFormat[] = [
        new Allmanga,
        new Anizone,
        new GojoLive,
        new LycorisCafe,
        // new Aowu,
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
    initialPlugins = (): void => {
        setPluginPlayerList(this.pluginList)
        const config = getConfig()
        for (let index = 0; index < this.pluginList.length; index++) {
            const element = this.pluginList[index];
            if (element.metadata.name == config.plugins.player) {
                setPlayerPlugin(element)
                return
            }
        }
        setPlayerPlugin(this.pluginList[0])
    }
}

export class informationPluginManager implements informationPluginManagerFormat {
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
                setAllHomeData({ data: { topCards: data.topCards, sections: data.sections }, 
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