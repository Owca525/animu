import { t } from "i18next";
import { cardData, ContextMenuProps, homeData, playerChapterList, SettingsConfig, themeMetadata } from "./types";
import { showDialog } from "./context/DialogContext";
import i18n from "./i18n";
import { DropdownOption } from "@renderer/components/dropDown";
import { getHomeCache, setHomeNewData } from "./stores/home";
import { getGlobalCache } from "./stores/global";
import { getConfig } from "./stores/config";
import { getPluginList } from "./stores/plugins";
import { unwrap } from "solid-js/store";

export function decodeHtmlEntities(str: string) {
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
    return new Intl.DateTimeFormat(i18n.language, { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(year, month, day, hour, minute));
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

export function checkDate(date: string | number, type: "Every Day" | "Every Week" | "Every Month") {
    const givenDate = new Date(date);
    const currentDate = new Date();
    const milliseconds = currentDate.getTime() - givenDate.getTime();
    switch (type) {
        case "Every Week":
            return milliseconds >= 7 * 24 * 60 * 60 * 1000;
        case "Every Day":
            return milliseconds >= 24 * 60 * 60 * 1000;
        case "Every Month":
            return milliseconds >= (24 * 60 * 60 * 1000) * 30;
    }
}

export function calculateZoomLevel(percentage: number): number {
    if (isNaN(percentage)) return 0
    if (percentage < 50 || percentage > 200) return 0
    return Math.log(percentage / 100) / Math.log(1.2)
}

export function formatTime(seconds: number | undefined): string {
    if (!seconds) return "0:00";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const hoursPart = hours > 0 ? `${hours}:` : '';
    return `${hoursPart}${hoursPart != "" && minutes < 10 ? "0" : ""}${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

export async function changeTheme(name: string) {
    if (!window.api) return
    let old = document.getElementById("theme-stylesheet") as HTMLLinkElement
    if (old) old.remove()
    document.title = ""

    const themes = await window.api.getlistThemes()
    let theme: themeMetadata = themes[0]

    themes.forEach((element) => {
        if (element.name === name) {
            theme = element
        }
    })

    const link = document.createElement('link');
    link.id = 'theme-stylesheet';
    link.rel = 'stylesheet';
    link.href = theme.pathcss;
    document.head.appendChild(link);

    if (theme.animuTitle) document.title = theme.animuTitle
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
        " ": "space"
    }
    for (const key in convert) {
        if (convert.hasOwnProperty(key)) {
            inputString = inputString.toUpperCase().replace(key.toUpperCase(), convert[key].toUpperCase())
        }
    }
    return inputString
}

export function similarityText(text1: string | undefined, text2: string | undefined): number {
    if (!text1) return 0
    if (!text2) return 0

    const len1 = text1.length;
    const len2 = text2.length;

    const dp: number[][] = Array.from({ length: len1 + 1 }, () =>
        Array(len2 + 1).fill(0)
    );

    for (let i = 0; i <= len1; i++) dp[i][0] = i;
    for (let j = 0; j <= len2; j++) dp[0][j] = j;

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            if (text1[i - 1] === text2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
            }
        }
    }

    const maxLen = Math.max(len1, len2);
    const distance = dp[len1][len2];
    const similarity = ((maxLen - distance) / maxLen) * 100;

    return Math.round(similarity * 100) / 100;
}

export function convertMsToMinutes(ms: number): number {
    return Math.floor(ms / 60000);
}

export async function refetchHistory() {
    let data: homeData = getHomeCache()
    if (data.activePage != "history") return
    let history = getHistory()
    if (data.data.sections[0].title == t("global.continuewatch") && data.data.sections.length != 2) {
        setHomeNewData({ sections: [{ title: t("global.continuewatch"), data: history.continue, horizontal: false }] })
        return
    }

    if (data.data.sections[0].title == t("global.history") && data.data.sections.length != 2) {
        setHomeNewData({ sections: [{ title: t("global.history"), data: history.history as cardData[], horizontal: false }] })
        return
    }

    if (data.data.sections[0].title == t("global.continuewatch") && data.data.sections[1].title == t("global.history")) {
        setHomeNewData({
            sections: [
                {
                    title: t("global.continuewatch"),
                    data: history.continue.slice(0, 20),
                    horizontal: true,
                    titlevent: {
                        onTitleClick: () =>
                            setHomeNewData({
                                sections: [
                                    {
                                        title: t("global.continuewatch"),
                                        data: history.continue,
                                        horizontal: false,
                                    },
                                ],
                            }),
                    }
                },
                {
                    title: t("global.history"),
                    data: history.history.slice(0, 20) as cardData[],
                    horizontal: true,
                    titlevent: {
                        onTitleClick: () =>
                            setHomeNewData({
                                sections: [
                                    {
                                        title: t("global.history"),
                                        data: history.history as any,
                                        horizontal: false,
                                    },
                                ],
                            })
                    }
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
    ContextMenu.push({ option: i18n.t("dialog.reload"), onClick: () => location.reload() })
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
    if (config.Developer.DeveloperMode && window.api) ContextMenu.push({ option: i18n.t("contextMenu.devtools"), onClick: window.BrowserWindow.openDevTools })
    ContextMenu.push({
        option: i18n.t("dialog.exit"), onClick: () => showDialog({
            type: "info",
            title: "Action",
            description: i18n.t("global.exitAnimu"),
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

export function detectTitle(data: { title: { english?: string | undefined; native: string; romaji: string; }, ep: string, format?: string }): string {
    try {
        if (data.format?.toLowerCase().includes("movie")) return t('player.TitleMovie', { name: data.title.romaji })
        return t('player.TitleEpisode', { ep: data.ep, name: data.title.romaji })
    } catch (error) {
        console.error(error)
        return t('player.TitleEpisode', { ep: data.ep, name: data.title.romaji })
    }
}

export async function convertPath(path: string) {
    if ((await window.api.getOSDetails()).platform == "win32" && !window.api) return path.replace("/", "\\")
    return path
}

export function toSeconds(time: string) {
    const [h, m, s] = time.split(":");
    return parseFloat(h) * 3600 + parseFloat(m) * 60 + parseFloat(s);
};

export function isNumberString(str: string): boolean {
    return str.trim() !== "" && !isNaN(Number(str));
}

export function timeToSeconds(time: string): number {
    const [hms] = time.split(".");
    const parts = hms.split(":").map(Number);
    const [hours, minutes, seconds] = parts;

    return hours * 3600 + minutes * 60 + seconds;
}

export async function convertChaptersVTT(url: string): Promise<playerChapterList[]> {
    let req = await fetch(url)
    if (!req.ok) return []
    let lines = (await req.text()).split("\n")

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
    let data = getPluginList()
    let list: DropdownOption[] = []
    for (let index = 0; index < data.length; index++) {
        const element = data[index];
        list.push({ label: element.metadata.name, onClick: () => func(element.metadata.name) })
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

export function updateObjectConfig(path: string, value: string | number | boolean, config: SettingsConfig): SettingsConfig {
    const keys = path.split('.')
    const newConfig = config

    let current: any = newConfig
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i]

        if (!current[key]) current[key] = {}
        current = current[key]
    }

    current[keys[keys.length - 1]] = value
    return newConfig
}

export async function request(url: string, options?: { method?: "POST" | "GET", headers?: { [key: string]: string } }): Promise<{ text: string, json: { [key: string]: any } | undefined, buffer: Buffer, status: number, statusText: string, url: string, success: boolean, responseHeader: { [key: string]: string } }> {
    try {
        if (window.api) return await window.api.request.advanceRequest(url, options)

        const response = await fetch("/api/request", {
            method: "POST",
            body: JSON.stringify({
                requestOptions: options
            })
        })
        const respTextClone = response.clone()
        let text = "";
        try {
            text = await respTextClone.text()
        } catch (error) { }

        if (!response.ok) return { text: text, buffer: [] as any, status: response.status, statusText: response.statusText, url: response.url, success: response.ok, json: undefined, responseHeader: response.headers as any }
        let bufferCloned = response.clone()
        let jsontext;

        try {
            jsontext = await response.json()
        } catch (error) { }

        return {
            text: text,
            json: jsontext,
            buffer: Buffer.from(await bufferCloned.arrayBuffer()),
            status: response.status,
            statusText: response.statusText,
            url: response.url,
            success: response.ok,
            responseHeader: response.headers as any
        };
    } catch (error) {
        console.error("error in requestGET", error)
        return {
            text: (error as Error).message,
            json: undefined,
            buffer: Buffer.from(""),
            status: 500,
            statusText: "Error",
            url: url,
            success: false,
            responseHeader: {}
        }
    }
}

export async function SaveToClipboard(type: "text" | "image", content: string) {
    if (window.api) return window.api.saveToClipboard(type, content)
    if (type == "image") {
        const blob = await (await fetch(content)).blob()
        const item = new ClipboardItem({ [blob.type]: blob });
        await navigator.clipboard.write([item]);
        return
    }

    const blob = new Blob([content], { type: "text/plain" });
    const item = new ClipboardItem({ "text/plain": blob });
    await navigator.clipboard.write([item]);
    return
}

export function openUrlFolder(content: string) {
    if (window.api) return window.api.open(content)
    return window.open(content, "_blank");
}

export function toggleFullscreen(toggle: boolean = false) {
    if (window.api) return window.BrowserWindow.setFullscreen(toggle)
    if (toggle) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
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
    let global = unwrap(getGlobalCache().history)
    let continueWatch: cardData[] = []
    for (let index = 0; index < global.length; index++) {
        const element = global[index];
        if (element.saveData && (element.saveData.last_Time != 0 || element.saveData.isStarted)) {
            continueWatch.push(element)
        }
    }
    return {
        continue: continueWatch,
        history: global.map((value) => ({ ...value, saveData: { ...value.saveData, last_Time: 0 } }))
    }
}

export function convertText(text: string) {
    let uri = encodeURI(text.replaceAll("[", "").replaceAll("]", ""))
    return uri.replaceAll("+", "%2B")
        .replaceAll("%20", "+")
}