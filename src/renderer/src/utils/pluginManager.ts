import AnilistApi from "@renderer/plugins/anilistApi";
import { FilterPluginsParams, informationPluginManagerFormat, informationPluginFormat, playerPluginManagerFormat, Anilist_ListMutation, playerPluginInstanceFormat, AnimeData, cardData, episodeList, episodeMetadata, playerData, playerPluginFormatList, PluginManagerFormat, informationPluginFormatList, informationPluginInstanceFormat, playerPluginFormat } from "./types";
import { getPluginRepo, setPlayerPlugin, setPluginPlayerList } from "./stores/plugins";
import { getConfig } from "./stores/config";
import { CreateSHA256, detectIndex, getPluginInitialConfig, getPluginsList, getRenderPath, request, setHomeData } from "./functions";
import semver from "semver";

const payload = `
<!DOCTYPE html>
<html>
<body>
<div id="root"></div>
  <script type="module">
    const pending = new Map();
    window.animuAppInfo = "PLEASE_REPLACE_ME_ANIMU_FOR_NEW_INFORMATION"

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

const workerDummyimport = `
export const SheepFinderAnime2000 = () => {};
export const capitalizeFirstLetter = () => {};
export const checkDate = () => {};
export const convertChaptersVTT = () => {};
export const convertMsToMinutes = () => {};
export const convertSeconds = () => {};
export const convertText = () => {};
export const dateToUnix = () => {};
export const genYearsList = () => {};
export const getWeek = () => {};
export const request = () => {};
export const runYT_DLP = () => {};
export const t = () => {};
export const timeToSeconds = () => {};
export const updateObject = () => {};
export const makeSmallText = () => {};
`

const workerPayloadMetadataExtractor = `
var window = { location: ${JSON.stringify(location)}, ...this };
globalThis.window = window;

async function initial() {
  try {
    const mod = await import("SET_WORKER_URL");
    self.postMessage({
      ok: true,
      result: (new mod.default).metadata,
    });
  } catch (err) {
    self.postMessage({
      ok: false,
      error: err.message,
    });
  }
}
initial()
`

class playerPluginInstance implements playerPluginInstanceFormat {
    metadata: playerPluginFormatList["metadata"] = {
        version: "1.0",
        name: "PluginLoader",
        author: "Owca525",
        supportLang: [],
        type: "player"
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
                value: JSON.parse(JSON.stringify(value)),
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
                if (value && value["callbackID"]) {
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

    extractPlayerData = async (type: string, episode: episodeMetadata, id: string): Promise<playerData[]> => {
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
        const blob = new Blob([payload.replace("CHANGETOPLUGIN", pluginCode).replace(`"PLEASE_REPLACE_ME_ANIMU_FOR_NEW_INFORMATION"`, window["animuAppInfo"])], { type: "text/html" });
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
    isInitializingPlugins: boolean = false

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
                        code: content,
                        sha256: await CreateSHA256(content)
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
        if (this.isInitializingPlugins) return
        this.isInitializingPlugins = true

        this.pluginList = []

        try {

            /* IFDEF DEBUG|PROD|WEB */
            const importedModules = import.meta.glob("../plugins/*.ts", {
                eager: true,
                query: "?compiledRaw",
                import: "default"
            })
            /* ENDIF */
            const moduleList = Object.entries(importedModules).map(([path, code]) => ({
                path,
                code: code as string
            }))

            this.pluginList = []

            async function LoadFastPlugins(params: { path: string; code: string; }[]) {
                let plugins: playerPluginManagerFormat["pluginList"] = []

                const blobDummy = new Blob([workerDummyimport], { type: "text/javascript" });
                let dummyImportURL = URL.createObjectURL(blobDummy);

                let promiseResolve: (value: unknown) => void
                const promise = new Promise((resolve) => {
                    promiseResolve = resolve
                })

                console.log(params)

                params.forEach((element) => {
                    const blobCode = new Blob([detectIndex(element["code"], dummyImportURL)], { type: "text/javascript" });
                    let codeURL = URL.createObjectURL(blobCode);

                    console.log(detectIndex(element["code"]))

                    const mainCode = new Blob([workerPayloadMetadataExtractor.replace("SET_WORKER_URL", codeURL)], { type: "text/javascript" });
                    let mainCodeURL = URL.createObjectURL(mainCode);

                    const worker = new Worker(mainCodeURL, { type: "module" });

                    worker.onmessage = async (e) => {
                        if (e.data["ok"]) {
                            let code = element["code"];

                            /* IFDEF DEBUG */
                            code = `${getRenderPath()}src${element["path"].replaceAll("..", "")}`
                            /* ENDIF */

                            plugins = [
                                ...plugins,
                                {
                                    metadata: e["data"]["result"],
                                    code: code,
                                    sha256: await CreateSHA256(code)
                                }
                            ]

                            if (plugins.length == params.length) promiseResolve(plugins)
                        } else {
                            console.error("FAILED LOAD PLUGIN", e)
                        }
                        worker.terminate()
                    };

                    /* IFDEF DEBUG */
                    // pluginLoader.runInstance(`${getRenderPath()}src${element["path"].replaceAll("..", "")}`).then(async () => {
                    //     let code = `${getRenderPath()}src${element["path"].replaceAll("..", "")}`
                    // plugins = [
                    //     ...plugins,
                    //     {
                    //         metadata: pluginLoader.metadata,
                    //         code: code,
                    //         sha256: await CreateSHA256(code)
                    //     }
                    // ]

                    //     if (plugins.length == params.length) promiseResolve(plugins)
                    // })
                    /* ENDIF */

                    /* IFDEF PROD */
                    // pluginLoader.runInstance(element["code"]).then(async () => {
                    //     plugins = [
                    //         ...plugins,
                    //         {
                    //             metadata: pluginLoader.metadata,
                    //             code: element["code"],
                    //             sha256: await CreateSHA256(element["code"])
                    //         }
                    //     ]

                    //     if (plugins.length == params.length) promiseResolve(plugins)
                    // })
                    /* ENDIF */
                })

                return promise
            }

            // console.time('newLoader');
            // console.log(await LoadFastPlugins(moduleList.filter((v) => v["code"] != "" && !v["path"].includes("anilistApi"))))
            // console.timeEnd('newLoader');

            console.time('oldLoader');
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
                            code: code,
                            sha256: await CreateSHA256(code)
                        }
                    ]
                    pluginLoader.destroy()
                } catch (error) {
                    console.error("Failed Load Plugin", error)
                    pluginLoader.destroy()
                }
            }
            console.timeEnd('oldLoader');
            await this.loadOtherPlugins()

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
        } catch (error) {
            console.error("Failed Initialize Plugins", error)
            this.isInitializingPlugins = false
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

export class PluginManager implements PluginManagerFormat {
    activePlayerPlugin: playerPluginInstanceFormat = undefined as any;
    activeInformationPlugin: informationPluginInstanceFormat = undefined as any;

    playerPluginList: playerPluginFormatList[] = [];
    informationPluginList: informationPluginFormatList[] = [];

    isInitializingPlugins: boolean = false;

    dummyLoader = async (plugins: { path: string; code: string; }[]): Promise<(playerPluginFormatList | informationPluginFormatList)[]> => {
        let loadedPlugins: (playerPluginFormatList | informationPluginFormatList)[] = []

        const blobDummy = new Blob([workerDummyimport], { type: "text/javascript" });
        let dummyImportURL = URL.createObjectURL(blobDummy);

        let promiseResolve: (value: any) => void
        const promise = new Promise((resolve: (v: (playerPluginFormatList | informationPluginFormatList)[]) => void, reject) => {
            promiseResolve = resolve
            setTimeout(() => {
                reject("Failed Load All Plugins")
            }, 1000 * plugins.length)
        })

        console.log(150 * plugins.length)

        plugins.forEach((element, index) => {
            const blobCode = new Blob([detectIndex(element["code"], dummyImportURL)], { type: "text/javascript" });
            let codeURL = URL.createObjectURL(blobCode);

            const mainCode = new Blob([workerPayloadMetadataExtractor.replace("SET_WORKER_URL", codeURL)], { type: "text/javascript" });
            let mainCodeURL = URL.createObjectURL(mainCode);

            console.log(index)

            const worker = new Worker(mainCodeURL, { type: "module" });

            worker.onmessage = async (e) => {
                console.log(e)
                if (e.data["ok"]) {
                    let code = element["code"];

                    /* IFDEF DEBUG */
                    code = `${getRenderPath()}src${element["path"].replaceAll("..", "")}`
                    /* ENDIF */

                    loadedPlugins = [
                        ...loadedPlugins,
                        {
                            metadata: e["data"]["result"],
                            code: code,
                            sha256: await CreateSHA256(code)
                        }
                    ]

                    if (loadedPlugins.length == index) promiseResolve(loadedPlugins)
                } else {
                    console.error("FAILED LOAD PLUGIN", e)
                }
                worker.terminate()
            };

        })

        return promise
    }

    initialPlugins = async (): Promise<void> => {
        /* IFDEF DEBUG|PROD|WEB */
        const importedModules = import.meta.glob("../plugins/*.ts", {
            eager: true,
            query: "?compiledRaw",
            import: "default"
        })
        /* ENDIF */
        let moduleList = Object.entries(importedModules).map(([path, code]) => ({
            path,
            code: code as string
        }))

        moduleList = [
            ...moduleList,
            ...(await getPluginsList()).map((v) => ({
                path: v["file"],
                code: v["content"]
            }))
        ].filter((v) => v["code"] != "")

        console.time('dummyLoader');
        console.log(await this.dummyLoader(moduleList))
        console.timeEnd('dummyLoader');
    }

    changePlayerPlugin = async (name: string): Promise<playerPluginFormat> => {
        return undefined as any
    }

    changeInformationPlugin = async (name: string): Promise<informationPluginFormat> => {
        return undefined as any
    }

    checkUpdates = async (): Promise<void> => {

    }

    installPlugin = async (): Promise<void> => {

    }

    reloadPlugins = async (hard?: boolean): Promise<void> => {

    }
}

/* IFDEF ONLYPLUGINS */
const d = import.meta.glob("../plugins/*.ts", {
    eager: false,
    import: "default",
})
console.log(d);
/* ENDIF */

(window as any).PluginManager = PluginManager;