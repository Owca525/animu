import AnilistApi from "@renderer/plugins/anilistApi";
import { FilterPluginsParams, informationPluginManagerFormat, informationPluginFormat, playerPluginManagerFormat, Anilist_ListMutation, playerPluginInstanceFormat, AnimeData, cardData, episodeList, episodeMetadata, playerData } from "./types";
import { getPluginRepo, setPlayerPlugin, setPluginPlayerList } from "./stores/plugins";
import { getConfig } from "./stores/config";
import { detectIndex, getPluginInitialConfig, getPluginsList, getRenderPath, request, setHomeData } from "./functions";
import semver from "semver";

const payload = `
<!DOCTYPE html>
<html>
<body>
<div id="root"></div>
  <script type="module">
    const pending = new Map();

    async function functionWrapper(values, func, id) {
        try {
            const response = await func(...Object.values(values))
            window.parent.postMessage({
                type: "RESULT",
                uuid: id,
                value: response,
            },"*");
        } catch (error) {
            window.parent.postMessage({
                type: "RESULT",
                uuid: id,
                value: undefined,
            },"*");
        }
    }

    function detectFunctionInObject(object) {
        if (object == undefined) return undefined

        try {
            let endobject = Array.isArray(object) ? [] : {}
            if (Array.isArray(object)) {
                for (let index = 0; index < object.length; index++) {
                    const element = object[index];
                    endobject.push(detectFunctionInObject(element));
                }
            } else {
                for (const [key, value] of Object.entries(object)) {
                    if (typeof value == "function") {
                        const id = crypto.randomUUID();
                        pending.set(id, async (values) => await functionWrapper(values, value, id));

                        endobject = {
                            ...endobject,
                            [key]: {
                                callbackID: id
                            }
                        }
                    } else {
                        endobject = {
                            ...endobject,
                            [key]: value
                        }
                    }
                }
            }

            return endobject;
        } catch (error) {
            return undefined
        }
    }

    async function wrapperFunction(func, value) {
        try {
            return await window["loadedPlugin"][func](...Object.values(value))
        } catch (error) {
            console.error("Sandbox/wrapperFunction", error);
            return 
        }
    }

    window.addEventListener("message", async (event) => {
        const data = event.data;

        if (data.type === "RESULT" && data.uuid) {
            const resolve = pending.get(data.uuid);
            if (resolve) {
                resolve(data.value);
                pending.delete(data.uuid);
            }
        }
        
        if (data.type === "RUN_FUNCTION") {
            window.parent.postMessage({
                type: "RESULT",
                value: detectFunctionInObject(await wrapperFunction(data["func"], data["value"])),
                uuid: data["uuid"],
                func: data["func"]
            },"*");
        }
    });

    window["api"] = {
        request: async (url, options, noCors) => await callMainProcess("REQUESTAPI", { url, options, noCors })
    }

    function callMainProcess(type, value) {
        return new Promise((resolve) => {
            const id = crypto.randomUUID();

            pending.set(id, resolve);
            window.parent.postMessage({
                type: type,
                uuid: id,
                value,
            },"*");
        });
    }
  </script>
  <script type="module">
    import("CHANGETOPLUGIN").then((v) => {
        window["loadedPlugin"] = new v.default
        window.parent.postMessage({
            type: "PLUGIN_METADATA",
            value: window["loadedPlugin"]["metadata"],
        },"*");
    })
  </script>
</body>
</html>
`

class playerPluginInstance implements playerPluginInstanceFormat {
    metadata = {
        version: "1.0",
        name: "PluginLoader",
        author: "Owca525",
        supportLang: [],
    }
    instance: HTMLIFrameElement | undefined = undefined
    pendingRequest = new Map<string, (value: unknown) => void>()
    removeInstanceWait: () => any = () => ""

    wrapperFunction = async (func: string, value: any) => {
        return new Promise((resolve, reject) => {
            if (!this.instance && !this.instance!.contentWindow) return reject(new Error("Instance Dosen't Exist"))
            const id = crypto.randomUUID();

            this.pendingRequest.set(id, resolve);
            this.instance!.contentWindow!.postMessage({
                type: "RUN_FUNCTION",
                uuid: id,
                value,
                func
            }, "*");
        });
    }

    wrapperObjectFunction = async (value, uuid) => {
        return new Promise((resolve, reject) => {
            if (!this.instance && !this.instance!.contentWindow) return reject(new Error("Instance Dosen't Exist"))

            this.pendingRequest.set(uuid, resolve);
            this.instance!.contentWindow!.postMessage({
                type: "RESULT",
                uuid: uuid,
                value,
            }, "*");
        });
    }

    detectObjectHasAFunction = (object) => {
        let finalObject: any[] | { [key: string]: any } = Array.isArray(object) ? [] : {}

        if (Array.isArray(object)) {
            for (let index = 0; index < object.length; index++) {
                const element = object[index];
                finalObject.push(this.detectObjectHasAFunction(element))
            }
        } else {
            for (const [key, value] of Object.entries(object)) {
                if (typeof value!["callbackID"] == "object") {
                    finalObject = {
                        ...finalObject,
                        [key]: async (...args) => this.wrapperObjectFunction(args, value!["callbackID"])
                    }
                } else {
                    finalObject = {
                        ...finalObject,
                        [key]: value
                    }
                }
            }
        }
        return finalObject
    }

    extractPlayerData = async (type: string, episode: string, id: string): Promise<playerData[]> => {
        if (!this.instance) return []
        return this.wrapperFunction("extractPlayerData", { type, episode, id }) as any
    }
    extractEpisodeList = async (animeData?: AnimeData, anime_id?: string): Promise<episodeList | undefined> => {
        if (!this.instance) return undefined
        return this.wrapperFunction("extractEpisodeList", { animeData, anime_id }) as any
    }
    extractOnlyEpisodesList = async (type: string, anime_id: string): Promise<episodeMetadata[]> => {
        if (!this.instance) return []
        return this.wrapperFunction("extractOnlyEpisodesList", { type, anime_id }) as any
    }
    searchAnime = async (name: string, page: number, params?: FilterPluginsParams): Promise<cardData[]> => {
        if (!this.instance) return []
        return this.wrapperFunction("searchAnime", { name, page, params }) as any
    }

    runInstance = async (pluginCode: string): Promise<void> => {
        if (!pluginCode.startsWith("http")) {
            const blobCode = new Blob([detectIndex(pluginCode)], { type: "text/javascript" });
            pluginCode = URL.createObjectURL(blobCode);
        }

        let iframe = document.createElement("iframe")
        iframe.sandbox.add("allow-scripts")
        iframe.style.display = "none"
        const blob = new Blob([payload.replace("CHANGETOPLUGIN", pluginCode)], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        iframe.src = url
        this.instance = iframe

        let resolvePromise: (value: unknown) => void = () => ""
        const promise = new Promise((resolve) => {
            resolvePromise = resolve;
            setTimeout(() => {
                resolve("Failed Run Sandbox")
            }, 1000)
        });

        const eventListener = async (event: MessageEvent<any>) => {
            const data = event.data

            if (data.type === "RESULT" && data.uuid) {
                const resolve = this.pendingRequest.get(data.uuid);
                if (!resolve) return

                let finalObject = {}
                if (typeof data["value"] == "object") {
                    finalObject = this.detectObjectHasAFunction(data["value"])
                }

                resolve(Object.entries(finalObject).length > 0 ? finalObject : data.value);
                this.pendingRequest.delete(data.uuid);
            }

            if (data["type"] === "REQUESTAPI" && iframe.contentWindow) {
                iframe.contentWindow.postMessage({
                    type: "RESULT",
                    value: await request(data["value"]["url"], data["value"]["options"], data["value"]["noCors"]),
                    uuid: data["uuid"]
                }, "*")
            }

            if (data["type"] === "PLUGIN_METADATA" && iframe.contentWindow) {
                this.metadata = data["value"]
                resolvePromise(data["value"])
            }
        }

        window.addEventListener("message", eventListener)
        this.removeInstanceWait = () => window.removeEventListener("message", eventListener)

        document.body.appendChild(iframe)

        return promise as any
    }
    destroy = () => {
        this.removeInstanceWait()
        if (this.instance) this.instance.remove()
    }

}

export class PlayerPluginManager implements playerPluginManagerFormat {
    currentPlugin: playerPluginInstanceFormat | undefined;
    pluginList: playerPluginManagerFormat["pluginList"] = [];

    changePlugin = async (plugin_id: string): Promise<playerPluginInstanceFormat> => {
        if (this.currentPlugin && this.currentPlugin["metadata"]["name"] == plugin_id) return this.currentPlugin

        const loadedPlugins = this.pluginList
        if (this.currentPlugin) this.currentPlugin.destroy()
        const pluginLoader = new playerPluginInstance()

        try {
            for (let index = 0; index < loadedPlugins.length; index++) {
                const element = loadedPlugins[index]
                if (element.metadata.name == plugin_id) {
                    await pluginLoader.runInstance(element["code"])
                    setPlayerPlugin(pluginLoader)
                    this.currentPlugin = pluginLoader
                    return pluginLoader
                }
            }
            await pluginLoader.runInstance(loadedPlugins[0]["code"])
            this.currentPlugin = pluginLoader
            return pluginLoader
        } catch (error) {
            console.error(error)
            await pluginLoader.runInstance(loadedPlugins[0]["code"])
            return pluginLoader
        }
    }
    loadOtherPlugins = async () => {
        const plugins = await getPluginsList()
        const conf = getConfig()
        const repoPlugins = getPluginRepo()

        for (let index = 0; index < plugins.length; index++) {
            const plugin = plugins[index];
            if (plugin.pluginType == "information") continue
            if (plugin.type != "official" && !conf.plugins.userPlugins) continue

            const tmpPlugin = repoPlugins.find((v) => v.name.toLowerCase() == plugin.file.replaceAll(".js", "").toLowerCase())

            if (tmpPlugin && plugin.type != "user" && tmpPlugin.sha256 != plugin.sha256) continue
            const content = detectIndex(plugin.content)
            const pluginLoader = new playerPluginInstance()
            try {
                await pluginLoader.runInstance(content)
                this.pluginList = [
                    ...this.pluginList,
                    {
                        metadata: pluginLoader.metadata,
                        code: content
                    }
                ]
                pluginLoader.destroy()
            } catch (error) {
                console.error("pluginManager/loadOtherPlugins", error)
                pluginLoader.destroy()
            }
        }
    }

    initialPlugins = async (): Promise<void> => {
        this.pluginList = []

        const importedModules = import.meta.glob("../plugins/*.ts", {
            eager: true,
            query: "?compiledRaw",
            import: "default"
        })
        const moduleList = Object.entries(importedModules).map(([path, code]) => ({
            path,
            code: code as string
        }))

        for (let index = 0; index < moduleList.length; index++) {
            const element = moduleList[index];
            if (element["code"] == "") continue
            if (element["path"].includes("anilistApi")) continue
            const pluginLoader = new playerPluginInstance()
            try {
                let code = ""

                /* IFDEF DEBUG */
                await pluginLoader.runInstance(`${getRenderPath()}src${element["path"].replaceAll("..", "")}`)
                code = `${getRenderPath()}src${element["path"].replaceAll("..", "")}`
                /* ENDIF */

                /* IFDEF PROD */
                await pluginLoader.runInstance(element["code"])
                code = element["code"];
                /* ENDIF */

                this.pluginList = [
                    ...this.pluginList,
                    {
                        metadata: pluginLoader.metadata,
                        code: code
                    }
                ]
                pluginLoader.destroy()
            } catch (error) {
                console.error("Failed Load Plugin", error)
                pluginLoader.destroy()
            }
        }
        await this.loadOtherPlugins()

        // const localPlugins = [Allmanga, Anizone, Animetsu, LycorisCafe, AniDap, AnimePahe, ...(await this.loadPlugin(plugins))]

        // for (let index = 0; index < localPlugins.length; index++) {
        //     try {
        //         const plugin = localPlugins[index] as any;
        //         const tmp = new plugin
        //         if (tmp.config) tmp.config = await getPluginInitialConfig(tmp.metadata.name, tmp.config)
        //         this.pluginList.push(tmp)
        //     } catch (error) {
        //         console.warn("Failed Load Module", error, localPlugins[index])
        //     }
        // }

        this.pluginList = this.pluginList.filter((item, _, arr) => {
            return !arr.some(
                other =>
                    other.metadata.name === item.metadata.name &&
                    semver.gt(semver.coerce(other.metadata.version) as any, semver.coerce(item.metadata.version) as any)
            );
        })

        this.pluginList = this.pluginList.filter(
            (item, index, self) =>
                index === self.findIndex(i => i.metadata.name === item.metadata.name)
        )

        // this.currentPlugin = this.pluginList[0]
        // setPlayerPlugin(this.pluginList[0])

        setPluginPlayerList(this.pluginList)
        const config = getConfig()
        for (let index = 0; index < this.pluginList.length; index++) {
            const element = this.pluginList[index];
            if (element.metadata.name == config.plugins.player) {
                const pluginLoader = new playerPluginInstance()
                await pluginLoader.runInstance(element.code)

                setPlayerPlugin(pluginLoader)
                this.currentPlugin = pluginLoader
                return
            }
        }

        const pluginLoader = new playerPluginInstance()
        await pluginLoader.runInstance(this.pluginList[0].code)
        setPlayerPlugin(pluginLoader)
        this.currentPlugin = pluginLoader
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
            // if (tmp.config) tmp.config = await getPluginInitialConfig(tmp.metadata.name, tmp.config)
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

    searchAnime = (name: string, page: number, params?: FilterPluginsParams) => {
        setHomeData(async () => await this.currentPlugin.search(name, page, params))
    };
    schedule = (airingStart: number, airingEnd: number) => {
        return this.currentPlugin.schedule(airingStart, airingEnd)
    }
    home = () => {
        setHomeData(this.currentPlugin.home)
    }
    anime = async (id: string) => {
        return await this.currentPlugin.anime({ id: id })
    }
    getManga = async (id: string) => {
        return await this.currentPlugin.getManga(id)
    }

    getAnimeList = async () => {
        return await this.currentPlugin.getAnimeList()
    };
    setAnimeInList = async (variable: Anilist_ListMutation) => {
        return await this.currentPlugin.setAnimeInList(variable)
    };
}