import { FilterPluginsParams, informationPluginFormat, Anilist_ListMutation, playerPluginInstanceFormat, AnimeData, cardData, episodeList, episodeMetadata, playerData, PluginManagerFormat, informationPluginInstanceFormat, playerPluginFormat, PluginMetadataFormat, PluginLoadedFormat, WorkerWrapperInstance, containerData, pluginRepoExpanded } from "./types";
import { setInformationPlugin, setInformationPluginList, setPlayerPlugin, setPluginPlayerList, setPluginRepo } from "./stores/plugins";
import { getConfig } from "./stores/config";
import { CreateSHA256, dateToUnix, detectIndex, getPluginInitialConfig, getPluginsList, getRenderPath, request, setHomeData, updateObject } from "./functions";
import semver from "semver";
import pluginFunctions from "./pluginFunctions.js?raw"
import { saveConfig } from "./FilesManager/config";
import { toast, updateToast } from "./context/ToastNotification";
import { unwrap } from "solid-js/store";
const blob = new Blob([pluginFunctions], { type: "text/javascript" });
const pluginFunctionsURL = URL.createObjectURL(blob);

const availbeFunctions: { name: string, func: (...args) => Promise<any> }[] = [{
    name: "request",
    func: request as any
}, {
    name: "yt-dlp",
    func: window.api.yt_dlp.run
}]

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
export const CreateSHA256 = () => {};
export const getConfig = () => {};
export const getGlobalCache = () => {};
export const timeCovertToMs = () => {};
`

const workerPayloadMetadataExtractor = `
var window = {  location: ${JSON.stringify(location)} };

globalThis.window = window;

async function initial() {
  try {
    const mod = await import("SET_WORKER_URL");
    const loaded = new mod.default
    self.postMessage({
      ok: true,
      result: {
        metadata: loaded["metadata"],
        config: loaded["config"],
      },
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

const WorkerPayload = `
var window = { 
    location: ${JSON.stringify(location)},
    global: this,
    request: async (...args) => await callMainProcess("request", args),
    yt_dlp: async (...args) => await callMainProcess("yt-dlp", args),
    animuAppInfo: "PLEASE_REPLACE_ME_ANIMU_FOR_NEW_INFORMATION",
    config: "CHANGE_TO_CONFIG_WHEN_ARE_PERMISIONS"
};

globalThis.window = window;

const AnimuPendingFunctions = new Map();

async function functionWrapper(values, func, id) {
    try {
        if (!values) values = {}

        const response = await func(...Object.values(values))
        self.postMessage({
                type: "RESULT",
                uuid: id,
                value: detectFunctionInObject(response),
            });
        } catch (error) {
            console.error("functionWrapper", error)
            self.postMessage({
                type: "RESULT",
                uuid: id,
                value: undefined,
            });
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
                if (Array.isArray(value)) {
                    endobject = {
                        ...endobject,
                        [key]: value.map((v) => detectFunctionInObject(v))
                    }
                    continue
                }

                if (typeof value == "function") {
                    const id = crypto.randomUUID();
                    AnimuPendingFunctions.set(id, async (values) => await functionWrapper(values, value, id));

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
        if (!value) value = {}
        return await window["loadedPlugin"][func](...Object.values(value))
    } catch (error) {
        console.error("Sandbox/wrapperFunction", error);
        return 
    }
}

self.onmessage = async (event) => {
    const data = event.data;

    if (data.type === "RESULT" && data.uuid) {
        const resolve = AnimuPendingFunctions.get(data.uuid);
        if (!resolve) return
        resolve(data.value);
        if (!data["stay"]) AnimuPendingFunctions.delete(data.uuid);
    }

    if (data.type === "CONFIG") {
        window["config"] = data.value
    }
        
    if (data.type === "RUN_FUNCTION") {
        const values = detectFunctionInObject(await wrapperFunction(data["func"], data["value"]))
        self.postMessage({
            type: "RESULT",
            value: values != undefined ? JSON.parse(JSON.stringify(values)) : values,
            uuid: data["uuid"],
            func: data["func"],
            stay: data["stay"]
        });
    }
    
    if (data.type === "CLEAR_CACHCE") {
        if (!data["value"]) return

        data["value"].forEach((v) => {
            if (AnimuPendingFunctions.get(v)) AnimuPendingFunctions.delete(v)
        })
    }
};

function callMainProcess(func, args) {
    return new Promise((resolve) => {
        const id = crypto.randomUUID();

        AnimuPendingFunctions.set(id, resolve);
        self.postMessage({
            type: "API_FUNCTION",
            uuid: id,
            value: func,
            args: args
        });
    });
}

import("CHANGETOPLUGIN").then((v) => {
    window["loadedPlugin"] = new v.default
    self.postMessage({
        type: "PLUGIN_METADATA",
        value: window["loadedPlugin"]["metadata"],
    });
})
`

class WorkerWrapper implements WorkerWrapperInstance {
    instance: Worker = undefined as any
    pendingRequest = new Map<string, (value: unknown) => void>()
    otherDataPermision: boolean = false

    weakRefCachce: { ref: WeakRef<{}>, id: string }[] = []
    intervalCache: NodeJS.Timeout | undefined

    constructor(otherDataPermision = false) {
        this.otherDataPermision = otherDataPermision
    }

    wrapperFunction = async (func: string, value?: { [key: string]: any }, stay: boolean = false): Promise<any> => {
        return new Promise((resolve, reject) => {
            if (!this.instance) return reject(new Error("Instance Dosen't Exist"))
            const id = crypto.randomUUID();
            if (this.otherDataPermision) {
                this.instance.postMessage({
                    type: "CONFIG",
                    value: unwrap(getConfig()),
                });
            }

            this.pendingRequest.set(id, resolve);
            this.instance.postMessage({
                type: "RUN_FUNCTION",
                uuid: id,
                value,
                func,
                stay
            });
        });
    }

    wrapperObjectFunction = async (value, uuid): Promise<any> => {
        return new Promise((resolve, reject) => {
            if (!this.instance) return reject(new Error("Instance Dosen't Exist"))

            this.pendingRequest.set(uuid, resolve);
            this.instance!.postMessage({
                type: "RESULT",
                uuid: uuid,
                value: JSON.parse(JSON.stringify(value)),
                stay: true
            });
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
                if (Array.isArray(value)) {
                    finalObject = {
                        ...finalObject,
                        [key]: this.detectObjectHasAFunction(value)
                    }
                    continue
                }

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

    runInstance = async (pluginCode: string): Promise<PluginMetadataFormat> => {
        if (!pluginCode.startsWith("http")) {
            const blobCode = new Blob([detectIndex(pluginCode, pluginFunctionsURL)], { type: "text/javascript" });
            pluginCode = URL.createObjectURL(blobCode);
        }
        let payload = WorkerPayload.replace("CHANGETOPLUGIN", pluginCode).replace(`"PLEASE_REPLACE_ME_ANIMU_FOR_NEW_INFORMATION"`, JSON.stringify(window["animuAppInfo"]))
        if (this.otherDataPermision) payload = payload.replace(`"CHANGE_TO_CONFIG_WHEN_ARE_PERMISIONS"`, JSON.stringify(getConfig()))

        const payloadBLob = new Blob([payload], { type: "text/javascript" });
        const payloadURL = URL.createObjectURL(payloadBLob);

        const worker = new Worker(payloadURL);

        worker.onerror = (ev) => {
            console.error(ev)
        }

        let resolvePromise: (val: PluginMetadataFormat) => void = () => ""
        const promise = new Promise((resolve: (val: PluginMetadataFormat) => void) => {
            resolvePromise = resolve;
            setTimeout(() => {
                resolve({
                    version: "",
                    name: "",
                    author: "",
                    type: "player"
                })
            }, 1000)
        });

        worker.onmessage = async (event: MessageEvent<any>) => {
            const data = event.data

            if (data.type === "RESULT" && data["uuid"]) {
                const resolve = this.pendingRequest.get(data.uuid);
                if (!resolve) return

                let finalObject = {}
                if (typeof data["value"] == "object") {
                    finalObject = this.detectObjectHasAFunction(data["value"])
                }

                if (data["stay"] && Object.entries(finalObject).length > 0) {

                    this.weakRefCachce = [
                        ...this.weakRefCachce,
                        {
                            ref: new WeakRef(finalObject),
                            id: data["uuid"]
                        }
                    ]
                }

                resolve(Object.entries(finalObject).length > 0 ? finalObject : data.value);
                if (!data["stay"]) this.pendingRequest.delete(data.uuid);
            }

            if (data["type"] === "API_FUNCTION" && data["uuid"]) {
                if (!data["value"]) return
                const tmp = availbeFunctions.find((v) => v["name"] == data["value"])
                if (!tmp) return

                try {
                    worker.postMessage({
                        type: "RESULT",
                        value: await tmp["func"](...data["args"]),
                        uuid: data["uuid"]
                    })
                } catch (error) {
                    console.error("Error Run Func", error)
                    worker.postMessage({
                        type: "RESULT",
                        value: undefined,
                        uuid: data["uuid"]
                    })
                }
            }

            if (data["type"] === "PLUGIN_METADATA") {
                resolvePromise(data["value"])
            }
        }

        this.intervalCache = setInterval(() => {
            const cache = this.weakRefCachce.filter((v) => {
                if (!v["ref"]) return true

                if (v["ref"].deref() == undefined) {
                    console.log(`${v["id"]} cleared`)
                    return true
                }
                return false
            })

            if (this.instance) {
                this.instance.postMessage({
                    type: "CLEAR_CACHCE",
                    value: cache.map((v) => v["id"])
                })
            }
        }, 30000)

        this.instance = worker

        return promise as any
    }
    destroy = () => {
        if (this.intervalCache) clearInterval(this.intervalCache)
        if (this.instance) this.instance.terminate()
    }
}

export class playerPluginInstance implements playerPluginInstanceFormat {
    metadata: PluginMetadataFormat = {
        version: "1.0",
        name: "PluginLoader",
        author: "Owca525",
        supportLang: [],
        type: "player",
    }
    instance: WorkerWrapperInstance = undefined as any

    extractPlayerData = async (type: string, episode: episodeMetadata, id: string): Promise<playerData[]> => {
        if (!this.instance) return []
        return await this.instance.wrapperFunction("extractPlayerData", { type, episode, id }, true) as any
    }
    extractEpisodeList = async (animeData?: AnimeData, anime_id?: string): Promise<episodeList | undefined> => {
        if (!this.instance) return undefined
        return await this.instance.wrapperFunction("extractEpisodeList", { animeData, anime_id }) as any
    }
    extractOnlyEpisodesList = async (type: string, anime_id: string): Promise<episodeMetadata[]> => {
        if (!this.instance) return []
        return await this.instance.wrapperFunction("extractOnlyEpisodesList", { type, anime_id }) as any
    }
    searchAnime = async (name: string, page: number, params?: FilterPluginsParams): Promise<cardData[]> => {
        if (!this.instance) return []
        return await this.instance.wrapperFunction("searchAnime", { name, page, params }) as any
    }

    CreateInstance = async (pluginCode: string): Promise<void> => {
        this.instance = new WorkerWrapper()
        this.metadata = await this.instance.runInstance(pluginCode)
    }

    clear = () => {
        if (this.instance) this.instance.destroy()
    }
}

export class InformationPluginInstance implements informationPluginInstanceFormat {
    metadata: PluginMetadataFormat = {
        version: "1.0",
        name: "PluginLoader",
        author: "Owca525",
        supportLang: [],
        type: "information",
    }
    instance: WorkerWrapperInstance = undefined as any;

    search = async (name: string, page: number, params?: FilterPluginsParams): Promise<containerData | { error: string; } | undefined> => {
        if (!this.instance) return
        return await this.instance.wrapperFunction("search", { name, page, params }, true) as any
    }

    home = async (): Promise<{ topCards?: containerData; sections: containerData[]; } | { error: string; } | undefined> => {
        if (!this.instance) return
        return await this.instance.wrapperFunction("home", undefined, true) as any
    }

    anime = async (id: string): Promise<AnimeData | undefined> => {
        if (!this.instance) return
        return await this.instance.wrapperFunction("anime", { id }) as any
    }

    schedule = async (airingStart: number, airingEnd: number): Promise<cardData[]> => {
        if (!this.instance) return []
        return await this.instance.wrapperFunction("schedule", { airingStart, airingEnd }) as any
    };

    getManga = async (id: string): Promise<AnimeData | undefined> => {
        if (!this.instance) return
        return await this.instance.wrapperFunction("getManga", { id }) as any
    };

    getAnimeList = async (): Promise<cardData[]> => {
        if (!this.instance) return []
        return await this.instance.wrapperFunction("getAnimeList") as any
    };

    setAnimeInList = async (variable: Anilist_ListMutation): Promise<boolean> => {
        if (!this.instance) return false
        return await this.instance.wrapperFunction("setAnimeInList", { variable }) as any
    };

    CreateInstance = async (pluginCode: string): Promise<void> => {
        this.instance = new WorkerWrapper(true)
        this.metadata = await this.instance.runInstance(pluginCode)
    }

    clear = () => {
        if (this.instance) this.instance.destroy()
    }
}

export class PluginManager implements PluginManagerFormat {
    activePlayerPlugin: playerPluginInstanceFormat = new playerPluginInstance;
    activeInformationPlugin: informationPluginInstanceFormat = new InformationPluginInstance

    playerPluginList: PluginLoadedFormat[] = [];
    informationPluginList: PluginLoadedFormat[] = [];

    isInitializingPlugins: boolean = false;

    dummyLoader = async (plugins: { path: string; code: string; official: boolean }[]): Promise<PluginLoadedFormat[]> => {
        let loadedPlugins: PluginLoadedFormat[] = []

        const blobDummy = new Blob([workerDummyimport], { type: "text/javascript" });
        let dummyImportURL = URL.createObjectURL(blobDummy);

        let promiseResolve: (value: any) => void
        const promise = new Promise((resolve: (v: PluginLoadedFormat[]) => void, reject) => {
            promiseResolve = resolve
            setTimeout(() => {
                reject("Failed Load All Plugins")
            }, 50 * plugins.length)
        })

        plugins.forEach((element, index) => {
            const blobCode = new Blob([detectIndex(element["code"], dummyImportURL)], { type: "text/javascript" });
            let codeURL = URL.createObjectURL(blobCode);

            const mainCode = new Blob([workerPayloadMetadataExtractor.replace("SET_WORKER_URL", codeURL)], { type: "text/javascript" });
            let mainCodeURL = URL.createObjectURL(mainCode);

            const worker = new Worker(mainCodeURL, { type: "module" });

            worker.onmessage = async (e) => {
                if (e.data["ok"]) {

                    loadedPlugins = [
                        ...loadedPlugins,
                        {
                            metadata: e["data"]["result"]["metadata"],
                            config: e["data"]["result"]["config"],
                            code: element["code"],
                            sha256: await CreateSHA256(element["code"])
                        }
                    ]

                    if (plugins.length == index + 1) promiseResolve(loadedPlugins)
                } else console.error("FAILED LOAD PLUGIN", e, element)
                worker.terminate()
            };

        })

        return promise
    }

    initialPlugins = async (): Promise<void> => {
        console.time('Animu Plugin Initializer Timer');
        /* IFDEF DEBUG|PROD|WEB */
        const importedModules = import.meta.glob("../plugins/*.ts", {
            eager: true,
            query: "?compiledRaw",
            import: "default"
        })
        /* ENDIF */
        let moduleList = Object.entries(importedModules).map(([path, code]) => ({
            path,
            code: code as string,
            official: true
        }))

        moduleList = [
            ...moduleList,
            ...(await getPluginsList()).map((v) => ({
                path: v["file"],
                code: v["content"],
                official: v["type"] == "official"
            }))
        ].filter((v) => v["code"] != "")

        console.time('Plugins Taken Metadata');
        let pluginsMetadata = await this.dummyLoader(moduleList)
        console.timeEnd('Plugins Taken Metadata');

        pluginsMetadata = pluginsMetadata.filter((item, _, arr) => {
            return !arr.some(
                other =>
                    other.metadata.name === item.metadata.name &&
                    semver.gt(semver.coerce(other.metadata.version) as any, semver.coerce(item.metadata.version) as any)
            );
        })

        pluginsMetadata = pluginsMetadata.filter(
            (item, index, self) =>
                index === self.findIndex(i => i.metadata.name === item.metadata.name)
        )

        this.informationPluginList = pluginsMetadata.filter((v) => v["metadata"]["type"] == "information")
        this.playerPluginList = pluginsMetadata.filter((v) => v["metadata"]["type"] == "player")
        setInformationPluginList(this.informationPluginList)
        setPluginPlayerList(this.playerPluginList)

        if (this.informationPluginList.length <= 0) throw Error("No Information Plugin Critial State")
        if (this.playerPluginList.length <= 0) throw Error("No Player Plugins Critial State")
        console.timeEnd('Animu Plugin Initializer Timer');
    }

    changePlayerPlugin = async (name: string): Promise<playerPluginFormat> => {
        console.time('Player Plugin Change Timer');
        let findedPlugin = this.playerPluginList.find((p) => p["metadata"]["name"] == name);

        if (!findedPlugin) findedPlugin = this.playerPluginList[0]

        this.activePlayerPlugin.clear()
        await this.activePlayerPlugin.CreateInstance(findedPlugin["code"])

        setPlayerPlugin(this.activePlayerPlugin)
        console.timeEnd('Player Plugin Change Timer');
        return this.activePlayerPlugin
    }

    changeInformationPlugin = async (name: string): Promise<informationPluginFormat> => {
        console.time('Information Plugin Change Timer');
        let findedPlugin = this.informationPluginList.find((p) => p["metadata"]["name"] == name);

        if (!findedPlugin) findedPlugin = this.informationPluginList[0]

        this.activeInformationPlugin.clear()
        await this.activeInformationPlugin.CreateInstance(findedPlugin["code"])

        setInformationPlugin(this.activeInformationPlugin)
        console.timeEnd('Information Plugin Change Timer');
        return this.activeInformationPlugin
    }

    checkUpdates = async (): Promise<void> => {
        const config = getConfig()
        let tmp: pluginRepoExpanded[] = []

        for (let index = 0; index < config.plugins.repoURL.length; index++) {
            const element = config.plugins.repoURL[index];
            const resp = await request(`${element}/database.json`)

            if (!resp["success"] || !resp["json"]) continue

            tmp = [...tmp, ...resp["json"].map((v) => ({ ...v, repoURL: element }))];
        }

        localStorage.setItem("AnimuPluginDatabase ", JSON.stringify(tmp))
        setPluginRepo(tmp)
        saveConfig(updateObject("plugins.lastTimeCheck", dateToUnix(new Date().toString()), config))

        const plugins = [...this.informationPluginList, ...this.playerPluginList]

        const reloadPlugin = tmp.filter((plugin) => {
            const tmp = plugins.find((v) => v.metadata.name == plugin.name)
            if (!tmp) return false

            const ver1 = semver.coerce(plugin.name)
            const ver2 = semver.coerce(tmp.metadata.version)

            if (!ver1 || !ver2) return false

            return semver.gt(ver1, ver2)
        })

        for (let index = 0; index < reloadPlugin.length; index++) {
            const element = reloadPlugin[index];
            this.installPlugin(element)
        }
    }

    installPlugin = async (plugin: pluginRepoExpanded): Promise<void> => {
        const plugins = [...this.informationPluginList, ...this.playerPluginList]

        const tmp = plugins.find((v) => v.metadata.name == plugin.name)
        if (tmp) {
            const id = toast(`Update ${plugin.name} from ${tmp["metadata"]["version"]} to ${plugin.ver}`, { type: "loading", timer: true })
            await window.api.plugins.installUpdate(plugin)
            updateToast(id, `Update Succesfully Installed for ${plugin["name"]}`, { type: "success", timer: false })

            // if (this.activeInformationPlugin["metadata"]["name"] == plugin["name"] || this.activePlayerPlugin["metadata"]["name"] == plugin["name"]) {
            //     let interval = setInterval(() => {
            //         if (plugin["type"] == "player" && location.href)

            //         clearInterval(interval)
            //     }, 10000)
            // }
        } else {
            const id = toast(`Instaling Plugin ${plugin["name"]}`, { type: "loading", timer: true })
            await window.api.plugins.installUpdate(plugin)
            updateToast(id, `Succesfully Installed Plugin: ${plugin["name"]}`, { type: "success", timer: false })
        }

        await this.initialPlugins()
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