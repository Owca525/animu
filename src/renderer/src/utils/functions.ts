import {
    AnimeData,
    cardData,
    containerData,
    ContextMenuProps,
    DateObject,
    deepLinkData,
    episodeList,
    FilterParams,
    FilterPluginsParams,
    homeData,
    informationPluginFormat,
    playerChapterList,
    playerPluginFormat,
    themeMetadata
} from './types';
import { DropdownOption } from '@renderer/components/dropDown';
import { getConfig } from './stores/config';
import { getAnimuHistory, getGlobalCache, setActiveThemes, setGlobalToken, todayAnimeInAnilist } from './stores/global';
import { getHomeCache, setAllHomeData, setHomeNewData } from './stores/home';
import { showDialog } from './context/DialogContext';
import { t, useI18n } from './i18n';
import { unwrap } from 'solid-js/store';
import { getInformationPlugin, getPlayerPluginList } from './stores/plugins';
import { removeToast, toast, updateToast } from './context/ToastNotification';
import { readPlaylist, updatePlaylist } from './FilesManager/playlist';
import pluginManager, { playerPluginInstance } from './pluginManager';
import { sendNotification } from "./NotificationManager"

export function decodeHtmlEntities(str: string | undefined) {
    if (!str) return ""
    const parser = new DOMParser();
    const doc = parser.parseFromString(str, 'text/html');
    return doc.documentElement.textContent;
}

export function convertDateToFormattedString(year: number | undefined, month: number | undefined, hour: number | undefined, minute: number | undefined, day: number | undefined) {
    if (year == undefined) year = 0
    if (month == undefined) month = 0
    if (hour == undefined) hour = 0
    if (minute == undefined) minute = 0
    if (day == undefined) day = 0
    const { currentLang } = useI18n()
    return new Intl.DateTimeFormat(currentLang(), { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(year, month, day, hour, minute));
}

export function capitalizeFirstLetter(text: string | undefined | null) {
    if (!text) return ""
    if (text.length === 0) return '';
    if (text.length <= 3) return text.toUpperCase().replace("_", " ")
    text = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    return text.replaceAll("_", " ");
}

export function convertSeconds(totalSeconds: number | undefined) {
    if (!totalSeconds) return
    const days = Math.floor(totalSeconds / 86400);
    totalSeconds %= 86400;
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return { days, hours, minutes, seconds };
}

export function checkDate(date: number, type: string) {
    const currentDate = new Date().toString();
    switch (type) {
        case "Every Week":
            return calculateDays(date, dateToUnix(currentDate)) >= 7;
        case "Every Day":
            return calculateDays(date, dateToUnix(currentDate)) >= 1;
        case "Every Month":
            return calculateDays(date, dateToUnix(currentDate)) >= 30;
    }
    return false
}

export function calculateZoomLevel(percentage: number): number {
    if (isNaN(percentage)) return 1
    return percentage / 100
}

export function formatTime(seconds: number | undefined): string {
    if (!seconds) return "0:00";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const hoursPart = hours > 0 ? `${hours}:` : '';
    return `${hoursPart}${hoursPart != "" && minutes < 10 ? "0" : ""}${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

function createHTMLLinkElement(css: string) {
    const blob = new Blob([css], { type: "text/css" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
}

export async function changeTheme(activeTheme: Map<number, themeMetadata>) {
    let old = document.querySelectorAll<HTMLLinkElement>("link")
    for (let index = 0; index < old.length; index++) {
        const element = old[index];
        if (element.id == "theme-stylesheet") continue
        if (element.crossOrigin) continue
        element.remove()
    }

    setActiveThemes(activeTheme)

    activeTheme.forEach(async (theme) => {
        if (theme.themeName != "DarkerAnimu") createHTMLLinkElement(theme.mainCSS)

        if (!theme.options) return
        const conf = await window.api.themes.config(theme)
        for (const key in conf) {
            let content = theme.options.find((value) => value.name == key)
            if (!content) continue

            if (content.css && conf[key] == true) createHTMLLinkElement(content.css)
            if (content.dropDown) content.dropDown.map((value) => value.option == conf[key] ? createHTMLLinkElement(value.css) : "")
        }
    })
}

export function changeTitleAnimu(title: string) {
    let dev = import.meta.env.DEV
    document.title = dev ? title + " - Development" : title
}

export function convertKeybinds(inputString: string) {
    const convert: Record<string, string> = {
        "control": "ctrl",
        "shift": "shift",
        "alt": "alt",
        "escape": "esc",
        "tab": "tab",
        "delete": "del",
        "end": "end",
        " ": "space",
        "space": "Space"
    }
    for (const key in convert) {
        if (convert.hasOwnProperty(key)) {
            inputString = inputString.toUpperCase().replace(key.toUpperCase(), convert[key].toUpperCase())
        }
    }
    return inputString
}


export function convertMsToMinutes(ms: number): number {
    return Math.floor(ms / 60000);
}

export async function refetchHistory() {
    let data: homeData = getHomeCache()
    if (data.activePage != "global.history") return
    let history = getHistory()
    if (data.data.sections[0].title == "global.continuewatch" && data.data.sections.length != 2) {
        setHomeNewData({ sections: [{ title: "global.continuewatch", data: history.continue, horizontal: false }] })
        return
    }

    if (data.data.sections[0].title == "global.history" && data.data.sections.length != 2) {
        setHomeNewData({ sections: [{ title: "global.history", data: history.history as cardData[], horizontal: false }] })
        return
    }

    if (data.data.sections[0].title == "global.continuewatch" && data.data.sections[1].title == "global.history") {
        setHomeNewData({
            sections: [
                {
                    title: "global.continuewatch",
                    data: history.continue.slice(0, 20),
                    horizontal: true,
                    onTitleClick: async () => ({
                        title: "global.continuewatch",
                        data: history.continue,
                        horizontal: false,
                    })
                },
                {
                    title: "global.history",
                    data: history.history.slice(0, 20) as cardData[],
                    horizontal: true,
                    onTitleClick: async () => ({
                        title: "global.history",
                        data: history.history as any,
                        horizontal: false,
                    })
                },
            ]
        })
        return
    }
}

export function CreateContextMenuOptions(start?: ContextMenuProps, center?: ContextMenuProps, end?: ContextMenuProps) {
    let ContextMenu: ContextMenuProps = []
    if (start) {
        for (let index = 0; index < start.length; index++) {
            const element = start[index];
            ContextMenu.push(element)
        }
    }
    ContextMenu.push({ option: t("dialog.reload"), onClick: () => reloadWebsite() })
    if (center) {
        ContextMenu.push({ option: "", line: true })
        for (let index = 0; index < center.length; index++) {
            const element = center[index];
            ContextMenu.push(element)
        }
    }
    ContextMenu.push({ option: "", line: true })
    if (end) {
        for (let index = 0; index < end.length; index++) {
            const element = end[index];
            ContextMenu.push(element)
        }
    }
    let config = getConfig()
    if (config.Developer.DeveloperMode && window.api) ContextMenu.push({ option: t("contextMenu.devtools"), onClick: window.BrowserWindow.openDevTools })
    ContextMenu.push({
        option: t("dialog.exit"), onClick: () => showDialog({
            type: "info",
            title: t("global.action"),
            description: t("global.exitAnimu"),
            buttons: [
                {
                    title: t("dialog.yes"),
                    onClick: () => window.api ? window.BrowserWindow.exit() : ""
                },
                {
                    title: t("dialog.no"),
                    onClick: () => ""
                },
            ]
        })
    })
    return ContextMenu
}

export function genYearsList(stopYear: number): string[] {
    let yearList: string[] = []
    const currentYear = new Date().getFullYear();
    for (let index = (currentYear + 1); index > (stopYear - 1); index--) {
        yearList.push(index.toString())
    }
    return yearList
}

export function getGradientColor(value: number | undefined | null): string {
    if (!value) return ""
    const clamped = Math.max(0, Math.min(100, value));

    const red = clamped < 50 ? 255 : Math.floor(255 - ((clamped - 50) * 5.1));
    const green = clamped > 50 ? 128 : Math.floor((clamped * 2.56));

    return `rgb(${red}, ${green}, 0)`;
}

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function detectTitle(data: { title: AnimeData["title"], ep: string, format?: string } | undefined): string {
    try {
        if (!data) return ""
        if (data.format?.toLowerCase().includes("movie")) return t('player.TitleMovie', { name: detectTitleConfig(data.title) })
        return t('player.TitleEpisode', { ep: data.ep, name: detectTitleConfig(data.title) })
    } catch (error) {
        console.error(error)
        return data ? t('player.TitleEpisode', { ep: data.ep, name: detectTitleConfig(data.title) }) : ""
    }
}

export async function convertPath(path: string) {
    if ((await window.api.getOSDetails()).platform == "win32" && !window.api) return path.replace("/", "\\")
    return path
}

export function isNumberString(str: string): boolean {
    if (!str) return false
    return str.trim() !== "" && !isNaN(Number(str));
}

export function timeToSeconds(time: string): number {
    const [hms] = time.split(".");
    const parts = hms.split(":").map(Number);
    const [hours, minutes, seconds] = parts;

    return hours * 3600 + minutes * 60 + seconds;
}

export async function convertChaptersVTT(url: string, options?: { method?: "POST" | "GET"; headers?: { [key: string]: any }; body?: any }): Promise<playerChapterList[]> {
    let req = await request(url, options)
    if (!req.success) return []
    let lines = req.text.split("\n")

    let finnalListChapters: playerChapterList[] = []
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("-->")) {
            const [start, end] = lines[i].split(" --> ");
            const next = lines[i + 1];

            if (next == "") continue;

            finnalListChapters.push({
                start: timeToSeconds(start),
                end: timeToSeconds(end),
                type: "other",
                name: next
            })
        }
    }

    return finnalListChapters
}

export function segregatePlugins(func: (name: string) => void): DropdownOption[] {
    let data = loadedPluginsList()
    let list: DropdownOption[] = []
    for (let index = 0; index < data.length; index++) {
        const element = data[index];
        let icon = "check_circle"
        let iconclass = "green"

        if (element["serverStatus"]) {
            const values = Object.values(element["serverStatus"])

            const filtered = values.filter((v) => v["time"] > 1000)
            if (filtered.length > 0) {
                icon = "info"
                iconclass = "yellow"
            }

            values.forEach((v) => {
                if (!v["work"]) {
                    icon = "block"
                    iconclass = "red"
                }
            })
        } else {
            icon = "help"
            iconclass = "gray"
        }

        list.push({
            label: element.metadata.name,
            onClick: () => func(element.metadata.name),
            icon: icon,
            classIcon: iconclass
        })
    }

    return list
}

export function getEpisodeDay(unixTime: number, episode: number): string {
    const episodeDate = new Date(unixTime * 1000);
    const today = new Date();

    const isToday =
        episodeDate.getFullYear() === today.getFullYear() &&
        episodeDate.getMonth() === today.getMonth() &&
        episodeDate.getDate() === today.getDate();


    let todayHours = `${episodeDate.getHours().toString().padStart(2, "0")}:${episodeDate.getMinutes().toString().padStart(2, "0")}`
    if (isToday) return t("week.infoCommunicatToday", { ep: episode, day: t("week.today"), hours: todayHours });

    const days = [t("week.sunday"), t("week.monday"), t("week.tuesday"), t("week.wednesday"), t("week.thursday"), t("week.friday"), t("week.saturday")];
    let todayName = days[episodeDate.getDay()]
    return t("week.infoCommunicat", { ep: episode, day: todayName, hours: todayHours });
}

export function makeSmallText(text: string | undefined) {
    if (!text) return text
    return text.toLowerCase()
}

export function updateObject<T, U>(path: string, value: U, object: T): T {
    const keys = path.split('.')
    const newObject = unwrap(object)

    let current: any = newObject
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i]

        if (!current[key]) current[key] = {}
        current = current[key]
    }

    current[keys[keys.length - 1]] = value
    return newObject
}

export async function request(url: string, options?: { method?: "POST" | "GET", headers?: { [key: string]: string }, body?: any }, noCors: boolean = false): Promise<{ text: string, json: { [key: string]: any } | undefined, buffer: Buffer, status: number, statusText: string, url: string, success: boolean, responseHeader: Map<string, string> }> {
    try {
        /* IFDEF WEB */
        const response = await fetch(noCors ? url : "/api/request", noCors ? options : {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                url: url,
                requestOptions: options
            })
        })
        const respTextClone = response.clone()
        let text = "";
        try {
            text = await respTextClone.text()
        } catch (error) { }

        let bufferCloned = response.clone()
        let jsontext;

        try {
            jsontext = await response.json()
        } catch (error) { }

        return {
            text: text,
            json: jsontext,
            buffer: await bufferCloned.arrayBuffer() as any,
            status: response.status,
            statusText: response.statusText,
            url: response.url,
            success: response.ok,
            responseHeader: response.headers as any
        };
        /* ENDIF */

        /* IFDEF DEBUG|PROD */
        return await window.api.request(url, options)
        /* ENDIF */
    } catch (error) {
        console.error("error in requestGET", error)
        return {
            text: (error as Error).message,
            json: undefined,
            buffer: [] as any,
            status: 500,
            statusText: "Error",
            url: url,
            success: false,
            responseHeader: {} as any
        }
    }
}

export async function SaveToClipboard(type: "text" | "image", content: string) {
    /* IFDEF WEB */
    if (type == "image") {
        const blob = await (await fetch(content)).blob()
        const item = new ClipboardItem({ [blob.type]: blob });
        return await navigator.clipboard.write([item]);
    }

    const blob = new Blob([content], { type: "text/plain" });
    const item = new ClipboardItem({ "text/plain": blob });
    return await navigator.clipboard.write([item]);
    /* ENDIF */

    /* IFDEF DEBUG|PROD */
    return window.api.saveToClipboard(type, content)
    /* ENDIF */
}

export function openUrlFolder(content: string) {
    /* IFDEF DEBUG|PROD */
    return window.api.open(content)
    /* ENDIF */

    /* IFDEF WEB */
    return window.open(content, "_blank");
    /* ENDIF */
}

export function toggleFullscreen(toggle: boolean = false) {
    /* IFDEF DEBUG|PROD */
    return window.BrowserWindow.setFullscreen(toggle)
    /* ENDIF */

    /* IFDEF WEB */
    if (toggle) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
    /* ENDIF */
}

export function getWeek(): { startWeekUnix: number, endWeekUnix: number, startWeekDay: number, endWeekDay: number, month: number } {
    let today = new Date()
    let startWeek = new Date()
    let endWeek = new Date()
    startWeek.setDate(today.getDate() - today.getDay())
    endWeek.setDate(startWeek.getDate() + 7)
    return {
        startWeekUnix: Math.floor(startWeek.getTime() / 1000),
        endWeekUnix: Math.floor(endWeek.getTime() / 1000),
        startWeekDay: startWeek.getDate(),
        endWeekDay: endWeek.getDate(),
        month: today.getMonth()
    }
}

export function getHistory() {
    let global = getAnimuHistory().values().toArray()

    let continueWatch: cardData[] = []
    for (let index = 0; index < global.length; index++) {
        const element = global[index];
        if (element.saveData && (element.saveData.last_Time != 0 || element.saveData.isStarted)) {
            continueWatch.push(element)
        }
    }
    return {
        continue: continueWatch,
        history: global.map((value) => ({ ...value, saveData: { ...value.saveData, last_Time: 0, isStarted: false } }))
    }
}

export function convertText(text: string) {
    let uri = encodeURI(text.replaceAll("[", "").replaceAll("]", ""))
    return uri.replaceAll("+", "%2B")
        .replaceAll("%20", "+")
}

export function getRenderPath(): string {
    return `${location.origin}${location.pathname.replace("index.html", "")}`
}

export function savePluginConfig(_: { [key: string]: any }) {}

export async function getPluginConfig(instance: playerPluginFormat | informationPluginFormat): Promise<{ [key: string]: any; } | undefined> {
    if (!instance.config) return
    return await window.api.plugins.getConfig(instance.metadata.name, instance.config)
}

export function loadedPluginsList() {
    const plugins = getPlayerPluginList()
    const hiddenPlugins = new Set(getConfig().plugins.hiddenPlugins)
    return plugins.filter((p) => !hiddenPlugins.has(p.metadata.name))
}

export function detectIndex(str: string, customINDEX: string = "") {
    let index = customINDEX
    const renderer = ["utils/functions", "utils/i18n", "utils/types", "utils/stores/config", "utils/stores/global"]

    if (customINDEX == "") index = `${getRenderPath()}index.js`
    if (str.includes("@renderer/")) {
        for (let i = 0; i < renderer.length; i++) {
            const element = renderer[i];
            str = str.replace(`@renderer/${element}`, index)
        }
        return str
    }

    if (str.includes(`"./index.js"`)) return str.replaceAll(`"./index.js"`, `"${index}"`)
    else return str.replaceAll(`"index.js"`, `"${index}"`)
}

export async function setHomeData(wrapper?: (() => Promise<homeData["data"] | containerData | undefined | { error: string }>) | homeData["data"] | containerData) {
    const uuid = crypto.randomUUID()
    if (!wrapper) return
    try {
        setGlobalToken(uuid)
        setAllHomeData({ data: { sections: [] }, isLoading: true, isError: false } as any)
        if (typeof wrapper == "object" && "sections" in wrapper) {
            setAllHomeData({ data: wrapper, isLoading: false, isError: false } as any)
            return
        }
        if (typeof wrapper == "object") {
            setAllHomeData({ data: { sections: [wrapper] }, isLoading: false, isError: false } as any)
            return
        }

        const respons = await wrapper()
        if (getGlobalCache().token && getGlobalCache().token != uuid) return
        if (!respons || respons["error"]) return setAllHomeData({ data: { sections: [] }, isLoading: false, isError: respons ? respons["error"] : true } as any)
        if ("sections" in respons) return setAllHomeData({ data: respons, isLoading: false, isError: false } as any)
        setAllHomeData({ data: { sections: [respons] }, isLoading: false, isError: false } as any)
    } catch (error) {
        console.error("Error in setHomeData", error)
        setAllHomeData({ data: { sections: [] }, isLoading: false, isError: true, } as any)
    }
}

export async function updateHomeContainer(data: homeData["data"] | containerData[]) {
    try {
        const tmp = unwrap(getHomeCache())
        if (data instanceof Array) {
            setHomeData({
                ...tmp.data,
                sections: data
            })
            return
        }
        if (data instanceof Object) {
            setHomeData(data)
            return
        }
    } catch (error) {
        console.error("Error in updateHomeContainer", error)
    }
}

export async function runYT_DLP(commands: string[]) {
    return await window.api.yt_dlp.run(commands)
}

export async function getPluginsList() {
    /* IFDEF DEBUG|PROD */
    return await window.api.plugins.list()
    /* ENDIF */
    return []
}

export async function getPluginInitialConfig(name: string, config: { [key: string]: any; }): Promise<{ [key: string]: any; }> {
    /* IFDEF WEB */
    localStorage.setItem(name, JSON.stringify(config))
    return config
    /* ENDIF */

    /* IFDEF DEBUG|PROD */
    return await window.api.plugins.getConfig(name, config)
    /* ENDIF */
}


export function SheepFinderAnime2000(animeList: AnimeData[], anime: AnimeData): string | undefined {
    try {
        if (anime.id != "") {
            console.log("ID Check")
            const findedID = animeList.find((item) => item.id == anime.id)
            if (findedID) return findedID.player_ID
        }

        console.log("First Check", animeList)
        // FIRST CHECK
        if (animeList.length <= 0) return undefined
        if (animeList.length == 1) return animeList[0].player_ID

        // Second Check
        let seasonYearFilter = animeList.filter((element) => element.seasonYear == anime.seasonYear)
        console.log("Second Check", seasonYearFilter)
        if (seasonYearFilter.length <= 0) return undefined
        if (seasonYearFilter.length == 1) return seasonYearFilter[0].player_ID

        // Third Check
        let seasonFilter = seasonYearFilter.filter((element) => makeSmallText(element.season) == makeSmallText(anime.season))
        console.log("Third Check", seasonYearFilter)
        if (seasonFilter.length <= 0) return undefined
        if (seasonFilter.length == 1) return seasonFilter[0].player_ID

        // Four Check
        let episodesFilter: AnimeData[] | undefined = undefined
        if (anime.episodes) {
            episodesFilter = seasonFilter.filter((element) => element.episodes == anime.episodes)
            console.log("Four Check", episodesFilter)
            if (episodesFilter.length <= 0) return undefined
            if (episodesFilter.length == 1) return episodesFilter[0].player_ID
        }

        // Five Check
        let durationFilter: AnimeData[] = []
        if (episodesFilter) durationFilter = episodesFilter.filter((element) => element.duration == anime.duration)
        else durationFilter = seasonFilter.filter((element) => element.duration == anime.duration)
        console.log("Five Check", durationFilter)
        if (durationFilter.length <= 0) return undefined
        if (durationFilter.length == 1) return durationFilter[0].player_ID

        // Six Check
        let formatFilter = durationFilter.filter((element) => makeSmallText(element.format) == makeSmallText(anime.format))
        console.log("Six Check", formatFilter)
        if (formatFilter.length <= 0) return undefined
        if (formatFilter.length == 1) return formatFilter[0].player_ID

        return formatFilter[0].player_ID
    } catch (error) {
        console.error("Functions SheepFinderAnime2000 error", error)
        return animeList[0].player_ID
    }
}

export function dateToUnix(dateStr: string): number {
    const date = new Date(dateStr);
    return Math.floor(date.getTime() / 1000);
}

export function unixToDateTime(unixTimestamp: number | undefined): string {
    if (unixTimestamp == undefined) return t("player.other.unknown")
    const date = new Date(unixTimestamp * 1000);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function searchDataInCards(cards: cardData[], search: string, params: FilterPluginsParams | undefined) {
    let results: cardData[] = []

    results = cards.filter((item) =>
        item.AnimeData.title["romaji"] ?
            item.AnimeData.title["romaji"].toLowerCase().includes(search.toLowerCase()) :
            false
    )
    results = [...results, ...cards.filter((item) =>
        item.AnimeData.title["native"] ?
            item.AnimeData.title["native"].toLowerCase().includes(search.toLowerCase()) :
            false
    )]
    results = [...results, ...cards.filter((item) =>
        item.AnimeData.title["english"] ?
            item.AnimeData.title["english"].toLowerCase().includes(search.toLowerCase()) :
            false
    )]

    if (!params) return results.filter(
        (item, index, self) =>
            index === self.findIndex(t => t.AnimeData.id === item.AnimeData.id)
    )

    if (params["years"]) results = results.filter((val) => new String(val.AnimeData.seasonYear) == params["years"])
    if (params["season"]) results = results.filter((val) => new String(val.AnimeData.season) == params["season"])
    if (params["format"]) results = results.filter((val) => new String(val.AnimeData.format) == params["format"])
    if (params["airing"]) results = results.filter((val) => new String(val.AnimeData.status) == params["airing"])
    if (params["genres"]) results = results.filter((val) => [...new Set(val.AnimeData.genres)].includes(params["genres"]))

    return results.filter(
        (item, index, self) =>
            index === self.findIndex(t => t.AnimeData.id === item.AnimeData.id)
    )
}

export function calculateDays(unix1?: number, unix2?: number): number {
    if (!unix1 || !unix2) return 0
    const date1 = new Date(unix1 * 1000);
    const date2 = new Date(unix2 * 1000);

    date1.setHours(0, 0, 0, 0);
    date2.setHours(0, 0, 0, 0);

    return -((date2.getTime() - date1.getTime()) / 86400000);
}

export function convertSecondsToHoursFormat(seconds: number): string {
    if (seconds < 0) seconds = 0;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export function detectTitleConfig(titles: AnimeData["title"]): string {
    try {
        const config = unwrap(getConfig())
        const title = titles[config.anilist.titleFormat.toLocaleLowerCase()]
        if (title) return title
        if (titles["romaji"]) return titles["romaji"]
        return Object.values(titles)[0]
    } catch (error) {
        console.error("detectTitleConfig Error", error)
        return Object.values(titles)[0]
    }
}

export function timeCovertToMs(time: { day?: number, month?: number, min?: number, hour?: number }) {
    if (time["day"]) return time["day"] * 86400000
    if (time["month"]) return time["month"] * 2678400000
    if (time["min"]) return time["min"] * 60000
    if (time["hour"]) return time["hour"] * 3600000
    return 0
}

// export function runService(func: () => Promise<any> | any, time: number, name: string, disable: boolean = false, dontRun: boolean = false) {
//     const interval = disable ? undefined : setInterval(func, time)
//     const tmp = {
//         name: name,
//         interval: interval,
//         uuid: crypto.randomUUID(),
//         func: func
//     }
//     if (!disable && !dontRun) {
//         try {
//             func()
//         } catch (error) { console.error("Failed Run Service", time, name) }
//     }

//     let services = unwrap(getServices()).filter((v) => v.name != name)
//     ActiveService([...services, tmp])
// }

export function globalNavigate(path: string) {
    /* IFDEF PROD */
    location.href = `${location.pathname}#${path}`
    /* ENDIF */
    /* IFDEF DEBUG */
    location.href = `${location.origin}/#${path}`
    /* ENDIF */
}

/* IFDEF DEBUG|PROD */
export function fetchDeepLink(fetchedeeplink: string) {
    const deeplink = new URL(fetchedeeplink)
    if (deeplink.host.length <= 0 && deeplink["search"].length == 0) return
    getGlobalCache().deepLinks.forEach((item) => {
        if (item.code == "" && deeplink["host"].length > 0) return item.func(deeplink.host, item.code)
        if (deeplink.search.startsWith(`?${item.code}`)) return item.func(deeplink.search.replaceAll(`?${item.code}=`, ""), item.code)
    })
}

export async function fetchAnimeDeepLink(deeplink: string) {
    if (deeplink.replaceAll(" ", "").length <= 0) return
    let anime: deepLinkData | undefined;
    try {
        const str = atob(deeplink.replaceAll("animu://", ""))
        if (str.startsWith("{")) anime = JSON.parse(str)
        else {
            const tmp = str.split(",")
            if (tmp.length <= 0) throw "Failed Parse"
            if (tmp.length == 1) anime = { animeID: tmp[0] }
            if (tmp.length != 6) throw "Failed Parse"
            anime = {
                animeID: tmp[0],
                player: {
                    plugin: tmp[1],
                    type: tmp[2],
                    id: tmp[3],
                    episode: tmp[4],
                    time: parseInt(tmp[5])
                }
            }
        }
    } catch (error) { console.error(t("deeplink.failed"), error) }
    if (!anime) return

    const infoPlugin = getInformationPlugin()
    const idToast = toast(t("notification.fetchinganime"), { type: "loading", timer: true })
    const response = await infoPlugin.anime(anime.animeID)
    if (!response) return updateToast(idToast, t("notification.failedanime"), { type: "error", timer: false })
    updateToast(idToast, t("notification.successanime"), { type: "success", timer: false })

    if (!anime.player) {
        localStorage.setItem("informationCache", JSON.stringify({ anime: response }))
        globalNavigate("/info")
        return
    }

    const toastID = toast(t("notification.episodesfetching"), { type: "loading", timer: true })
    const currentPLugin = await pluginManager.changePlayerPlugin(anime.player.plugin)
    const episodeList = await currentPLugin.extractOnlyEpisodesList(anime.player.type, anime.player.id);

    if (episodeList.length <= 0) {
        updateToast(toastID, t("notification.episodesfailed"), { type: "error", timer: false })
        return
    }

    removeToast(toastID)

    localStorage.setItem("playerCache", JSON.stringify({
        data: {
            ...response,
            player_ID: anime.player.id
        },
        save: {
            pluginName: currentPLugin.metadata.name,
            last_Time: anime.player.time,
            episode: anime.player.episode,
            type: anime.player.type,
        },
        episodelist: episodeList,
    }))

    globalNavigate("/player");
}
/* ENDIF */

export function reloadWebsite() {
    /* IFDEF WEB */
    location.reload()
    /* ENDIF */

    /* IFDEF DEBUG|PROD */
    window.BrowserWindow.reload()
    /* ENDIF */
}

export function convertDateToDateObject(date: number | undefined): DateObject {
    try {
        if (!date) return { day: undefined, month: undefined, year: undefined }
        const tmp = new Date(unixToDateTime(date))
        return { day: tmp.getDay(), month: tmp.getMonth(), year: tmp.getFullYear() }
    } catch (error) {
        console.error("convertDateToDateObject/functions ", error)
        return { day: undefined, month: undefined, year: undefined }
    }
}

export function convertEpisode(ep: string): number {
    try {
        return parseInt(parseInt(ep).toFixed(0))
    } catch (error) {
        console.error("convertEpisode/functions ", error)
        return 1
    }
}

export async function getTodayAnilistAnime() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return await getInformationPlugin().schedule(dateToUnix(startOfDay.toString()), dateToUnix(endOfDay.toString()))
}

export async function checkAnimeTodayReleaseEpisode() {
    const todayANimeId = unwrap(todayAnimeInAnilist()).map((v) => v.AnimeData.id)
    const todayAnime = unwrap(todayAnimeInAnilist())

    const waitingPlaylist = await readPlaylist("global.waitingplaylist")

    const sortedList = waitingPlaylist.filter((v) => todayANimeId.includes(v.anime.AnimeData.id))

    for (let index = 0; index < sortedList.length; index++) {
        const element = sortedList[index];
        if (element.customData) continue

        const tmpplugin = new playerPluginInstance

        try {
            const codePlugin = getPlayerPluginList().find((v) => v["metadata"]["name"] == element['anime']["saveData"]!["name"])
            if (!codePlugin) {
                tmpplugin.clear()
                continue
            }
            await tmpplugin.CreateInstance(codePlugin)

            let episodes = await tmpplugin.extractOnlyEpisodesList(element.anime.saveData?.type!, element.anime.AnimeData.player_ID!)
            if (episodes.length <= 0) {
                tmpplugin.clear()
                continue
            }

            let asdasdads = episodes.map((v) => v.ep.toString())

            const tmpEpisode = todayAnime.find((v) => v.AnimeData.id == element.anime.AnimeData.id)!.AnimeData.nextAiringEpisode!.episode.toString()
            if (asdasdads.includes(tmpEpisode)) {
                sendNotification({
                    title: `New Episode Avaible in ${tmpplugin.metadata.name} plugin`,
                    description: `Watch Episode ${tmpEpisode} Of ${detectTitleConfig(element.anime.AnimeData.title)}`,
                    icon: element.anime.AnimeData.coverImage
                })
            }
            await updatePlaylist("global.waitingplaylist", { ...{
                ...element,
                anime: {
                    ...element["anime"],
                    saveData: {
                        ...element["anime"]["saveData"]!,
                        episode: tmpEpisode
                    }
                }
            }, customData: true })

            tmpplugin.clear()
        } catch (error) {
            console.error("Error function/checkAnimeTodayReleaseEpisode", error)
            tmpplugin.clear()
        }
    }

    const notTodayANime = waitingPlaylist.filter((v) => !todayANimeId.includes(v.anime.AnimeData.id))
    notTodayANime.forEach(async (anime) => {
        if (anime.customData) await updatePlaylist("global.waitingplaylist", { ...anime, customData: false })
    })
}

/* IFDEF DEBUG|PROD */
(window as any).showProcessMemory = async (number = 5000) => {
    setInterval(async () => {
        console.info(await window.backend.debug())
    }, number)
};
/* ENDIF */

export function convertStringToDateObject(date: string | undefined): DateObject | undefined {
    try {
        if (!date) return undefined
        const data = new Date(date)
        return { month: data.getMonth(), day: data.getDay(), year: data.getFullYear() }
    } catch (error) {
        console.error("convertStringToDateObject/functions", error)
        return undefined
    }
}

export function convertParams(data: FilterParams | undefined): FilterPluginsParams | undefined {
    if (!data) return undefined

    return Object.entries(data).reduce<FilterPluginsParams>(
        (acc, [key, value]) => {
            acc[key] = value.val;
            return acc;
        },
        {}
    );
}

export function convertTimeStringToSeconds(time: string | undefined) {
    if (!time) return undefined
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
}

export function formatDate(dateInput: string) {
    const date = new Date(dateInput);
    const now = new Date();

    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 24) {
        if (diffHours <= 0) return "Just Now";
        return `${diffHours} Hour${diffHours !== 1 ? "s" : ""} Ago`;
    }

    if (diffDays < 7) {
        return `${diffDays} Day${diffDays !== 1 ? "s" : ""} Ago`;
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}.${month}.${year}`;
}

export async function CreateSHA256(text: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    const hashBuffer = await crypto.subtle.digest("SHA-256", data);

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");

    return hashHex;
};

export function checkTimeDriffrentUnix(start: number, end: number): { hour: number; min: number; sec: number; } {
    const diff = Math.abs(end - start);

    const hour = Math.floor(diff / 3600);
    const min = Math.floor((diff % 3600) / 60);
    const sec = diff % 60;

    return { hour, min, sec };
}

export function parseEpisode(ep: string) {
    const match = ep.match(/^(\d+)([a-zA-Z]*)$/);

    return {
        num: match ? parseInt(match[1], 10) : Infinity,
        suffix: match ? match[2] : ""
    };
}

export function sortEpisodes(data: episodeList | undefined): episodeList | undefined {
    if (!data) return

    return {
        ...data,
        episodesData: data["episodesData"].map((v) => ({
            ...v,
            episodes: v["episodes"].sort((a, b) => {
                const epA = parseEpisode(a.ep.toString());
                const epB = parseEpisode(b.ep.toString());

                if (epA.num !== epB.num) return epA.num - epB.num;
                return epA.suffix.localeCompare(epB.suffix);
            })
        }))
    }
}

export function sortCharacterType(content: AnimeData["characters"]) {
    if (!content) return []

    const priority = {
        "MAIN": 0,
        "SUPPORTING": 1,
    };

    return content.sort((a, b) => {
        return (priority[a.role] ?? 999) - (priority[b.role] ?? 999);
    });
}

export function sortRelationType(content: AnimeData["relations"]) {
    if (!content) return []

    const priority = {
        "ADAPTATION": 0,
        "SEQUEL": 1,
        "PREQUEL": 2
    };

    return content.sort((a, b) => {
        return (priority[a.relationType] ?? 999) - (priority[b.relationType] ?? 999);
    });
}

export async function GenerateSha256(text: string) {
  const data = new TextEncoder().encode(text);

  const hashBuffer = await crypto.subtle.digest(
    'SHA-256',
    data
  );

  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function deepMerge(target: any, source: any): any {
    for (const key in source) {
        if (source[key] && typeof source[key] === "object") {
            if (!target[key]) {
                target[key] = {};
            }
            deepMerge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}

export function LoopReplace(str: string, strings: [string, string][]) {
    strings.forEach((value) => {
        str = str.replace(value[0], value[1])
    })

    return str
}

export function RemoveAnimeDataCache(data: AnimeData | cardData) {
    if (!data) return data

    let paths: string[] = []

    if (data["AnimeData"]) paths = ["AnimeData.nextAiringEpisode", "AnimeData.recommendations"]
    else {
        paths = ["nextAiringEpisode", "recommendations"]
    }

    let tmpData = data
    paths.forEach((item) => {
        tmpData = updateObject(item, undefined, tmpData)
    })

    return tmpData
}

export function createElement<K extends keyof HTMLElementTagNameMap>(tag: K, options: { [key: string]: any } = {}): HTMLElementTagNameMap[K] {
    const element = document.createElement(tag);
    Object.assign(element, options)
    return element;
}

export async function requestCloudflare(url: string): Promise<{ cookie: string, header: {[key: string]: any} }> {
    return new Promise((resolve) => {
        let interval = setInterval(() => {
            resolve({ cookie: "", header: {} })
        }, 10000)
        toast("Verify Cloudflare to use plugin. Click to open window", { type: "info", onClick: async () => {
            clearInterval(interval)
            resolve(await window.BrowserWindow.createWindow({ url: url, type: "CloudFlare" }))
        }, duration: 10000})
    })
}