import { t } from "i18next";
import { homeData } from "./GlobalInterface";
import store from "./store";
import { setHomeData } from "./pluginApi";
import { ReadContinue } from "./history/continueWatch";
import { ReadHistory } from "./history/history";

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
    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(year, month, day, hour, minute));
}

export function capitalizeFirstLetter(text: string) {
    if (text.length === 0) return '';
    if (text.length <= 2) return text.toUpperCase().replace("_", " ")
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

export function checkDate(date: string, type: "week" | "day") {
    const givenDate = new Date(date);
    const currentDate = new Date();
    const milliseconds = currentDate.getTime() - givenDate.getTime();
    switch (type) {
        case "week":
            return milliseconds >= 7 * 24 * 60 * 60 * 1000;
        case "day":
            return milliseconds >= 24 * 60 * 60 * 1000;
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
    return `${hoursPart}${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

export async function changeTheme(name: string) {
    const themes = await window.api.getlistThemes()
    themes.forEach((element) => {
        if (element.filename.replace(".css", "") === name) {
            let link = document.getElementById("theme-stylesheet") as HTMLLinkElement
            if (link) link.href = element.path
        }
    })
}

export function convertKeybinds(inputString: string) {
    const convert: Record<string, string> = {
        "control": "ctrl",
        "shift": "shft",
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

export function similarityText(text1: string, text2: string): number {
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
    let data: homeData = store.getState().home
    if (data.data.length > 2) return
    if (data.data.length <= 0) return
    if (data.data.length == 1 && data.data[0].title == t("global.continuewatch")) {
        await setHomeData(async () => [{ title: t("global.continuewatch"), data: await ReadContinue(), horizontal: false }])
        return
    }

    if (data.data.length == 1 && data.data[0].title == t("global.history")) {
        await setHomeData(async () => [{ title: t("global.History"), data: await ReadHistory(), horizontal: false }])
        return
    }

    if (data.data[0].title == t("global.continuewatch") && data.data[1].title == t("global.history")) {
        await setHomeData(async () => {
            return [
                {
                    title: t("global.continuewatch"),
                    data: await ReadContinue(20),
                    horizontal: true,
                    onTitleClick: () => setHomeData(async () => [{ title: t("global.continuewatch"), data: await ReadContinue(), horizontal: false }])
                },
                {
                    title: t("global.history"),
                    data: await ReadHistory(20),
                    horizontal: true,
                    onTitleClick: () => setHomeData(async () => [{ title: t("global.history"), data: await ReadHistory(), horizontal: false }])
                },
            ]
        })
        return
    }
}