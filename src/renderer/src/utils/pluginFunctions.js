
/**
 *
 * @export
 * @param {AnimeData[]} animeList 
 * @param {AnimeData} anime 
 * @returns {(string | undefined)} 
 */
export function SheepFinderAnime2000(animeList, anime) {
    try {
        if (anime.id != "") {
            console.log("ID Check")
            const findedID = animeList.find((item) => item.id == anime.id)
            if (findedID) return findedID.player_ID
        }

        // console.log("First Check", animeList)
        // FIRST CHECK
        if (animeList.length <= 0) return undefined
        if (animeList.length == 1) return animeList[0].player_ID

        // Second Check
        let seasonYearFilter = animeList.filter((element) => element.seasonYear == anime.seasonYear)
        // console.log("Second Check", seasonYearFilter)
        if (seasonYearFilter.length <= 0) return undefined
        if (seasonYearFilter.length == 1) return seasonYearFilter[0].player_ID

        // Third Check
        let seasonFilter = seasonYearFilter.filter((element) => makeSmallText(element.season) == makeSmallText(anime.season))
        // console.log("Third Check", seasonYearFilter)
        if (seasonFilter.length <= 0) return undefined
        if (seasonFilter.length == 1) return seasonFilter[0].player_ID

        // Four Check
        let episodesFilter = undefined
        if (anime.episodes) {
            episodesFilter = seasonFilter.filter((element) => element.episodes == anime.episodes)
            // console.log("Four Check", episodesFilter)
            if (episodesFilter.length <= 0) return undefined
            if (episodesFilter.length == 1) return episodesFilter[0].player_ID
        }

        // Five Check
        let durationFilter = []
        if (episodesFilter) durationFilter = episodesFilter.filter((element) => element.duration == anime.duration)
        else durationFilter = seasonFilter.filter((element) => element.duration == anime.duration)
        // console.log("Five Check", durationFilter)
        if (durationFilter.length <= 0) return undefined
        if (durationFilter.length == 1) return durationFilter[0].player_ID

        // Six Check
        let formatFilter = durationFilter.filter((element) => makeSmallText(element.format) == makeSmallText(anime.format))
        // console.log("Six Check", formatFilter)
        if (formatFilter.length <= 0) return undefined
        if (formatFilter.length == 1) return formatFilter[0].player_ID

        return formatFilter[0].player_ID
    } catch (error) {
        console.error("Functions SheepFinderAnime2000 error", error)
        return animeList[0].player_ID
    }
}

/**
 *
 * @export
 * @param {(string | undefined)} text 
 * @returns {string} 
 */
export function capitalizeFirstLetter(text) {
    if (!text) return ""
    if (text.length === 0) return '';
    if (text.length <= 3) return text.toUpperCase().replace("_", " ")
    text = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    return text.replaceAll("_", " ");
}

/**
 *
 * @export
 * @param {number} date 
 * @param {string} type 
 * @returns {boolean | boolean} 
 */
export function checkDate(date, type) {
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

/**
 *
 * @export
 * @param {?number} [unix1] 
 * @param {?number} [unix2] 
 * @returns {number} 
 */
export function calculateDays(unix1, unix2) {
    if (!unix1 || !unix2) return 0
    const date1 = new Date(unix1 * 1000);
    const date2 = new Date(unix2 * 1000);

    date1.setHours(0, 0, 0, 0);
    date2.setHours(0, 0, 0, 0);

    return -((date2.getTime() - date1.getTime()) / 86400000);
}

/**
 *
 * @export
 * @async
 * @param {string} url 
 * @param {?({ method?: "POST" | "GET"; headers?: { [key: string]: any }; body?: any })} [options] 
 * @returns {Promise<playerChapterList[]>} 
 */
export async function convertChaptersVTT(url, options) {
    let req = await request(url, options)
    if (!req.success) return []
    let lines = req.text.split("\n")

    let finnalListChapters = []
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

/**
 *
 * @export
 * @param {number} ms 
 * @returns {number} 
 */
export function convertMsToMinutes(ms) {
    return Math.floor(ms / 60000);
}

/**
 *
 * @export
 * @param {(number | undefined)} totalSeconds 
 * @returns {{ days: any; hours: any; minutes: any; seconds: number; }} 
 */
export function convertSeconds(totalSeconds) {
    if (!totalSeconds) return
    const days = Math.floor(totalSeconds / 86400);
    totalSeconds %= 86400;
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return { days, hours, minutes, seconds };
}

/**
 *
 * @export
 * @param {string} text 
 * @returns {string} 
 */
export function convertText(text) {
    let uri = encodeURI(text.replaceAll("[", "").replaceAll("]", ""))
    return uri.replaceAll("+", "%2B")
        .replaceAll("%20", "+")
}

/**
 *
 * @export
 * @param {string} dateStr 
 * @returns {number} 
 */
export function dateToUnix(dateStr) {
    const date = new Date(dateStr);
    return Math.floor(date.getTime() / 1000);
}


/**
 *
 * @export
 * @param {number} stopYear 
 * @returns {string[]} 
 */
export function genYearsList(stopYear) {
    let yearList = []
    const currentYear = new Date().getFullYear();
    for (let index = (currentYear + 1); index > (stopYear - 1); index--) {
        yearList.push(index.toString())
    }
    return yearList
}

/**
 *
 * @export
 * @returns {{ startWeekUnix: number, endWeekUnix: number, startWeekDay: number, endWeekDay: number, month: number }} 
 */
export function getWeek() {
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


/**
 *
 * @export
 * @async
 * @param {string} url 
 * @param {?({ method?: "POST" | "GET", headers?: { [key: string]: string }, body?: any })} [options] 
 * @param {boolean} [noCors=false] 
 * @returns {Promise<{ text: string, json: { [key: string]: any } | undefined, buffer: Buffer, status: number, statusText: string, url: string, success: boolean, responseHeader: Map<string, string> }>} 
 */
export async function request(url, options, noCors = false) {
    try {
        let server = "/api/request"
        if (window["serverPort"]) server = `http://localhost:${window["serverPort"]}/api/request`
        const response = await fetch(noCors ? url : server, noCors ? options : {
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
        } catch (error) {
            if (noCors == false) {
                throw new Error("Failed Request")
            }
        }

        if (noCors == false) return jsontext

        return {
            text: text,
            json: jsontext,
            buffer: await bufferCloned.arrayBuffer(),
            status: response.status,
            statusText: response.statusText,
            url: url,
            success: response.ok,
            responseHeader: response.headers
        };
    } catch (error) {
        console.error("error in requestGET", error)
        return {
            text: error.message,
            json: undefined,
            buffer: [],
            status: 500,
            statusText: "Error",
            url: url,
            success: false,
            responseHeader: {}
        }
    }
}

/**
 *
 * @export
 * @async
 * @param {string} url 
 * @param {?string[]} [commands] 
 * @returns {{ [key: string]: any; }} 
 */
export async function runYT_DLP(commands) {
    return await window["yt_dlp"](commands)
    // return await window.api.yt_dlp.run(url, commands)
}

/**
 *
 * @export
 * @async
 * @param {string} path 
 * @returns {string} 
 */
export function t(path) {

}

/**
 *
 * @export
 * @param {string} time 
 * @returns {number} 
 */
export function timeToSeconds(time) {
    const [hms] = time.split(".");
    const parts = hms.split(":").map(Number);
    const [hours, minutes, seconds] = parts;

    return hours * 3600 + minutes * 60 + seconds;
}


/**
 *
 * @export
 * @template T 
 * @template U 
 * @param {string} path 
 * @param {U} value 
 * @param {T} object 
 * @returns {T} 
 */
export function updateObject(path, value, object) {
    const keys = path.split('.')
    const newObject = unwrap(object)

    let current = newObject
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i]

        if (!current[key]) current[key] = {}
        current = current[key]
    }

    current[keys[keys.length - 1]] = value
    return newObject
}

/**
 *
 * @export
 * @param {(string | undefined)} text 
 * @returns {*} 
 */
export function makeSmallText(text) {
    if (!text) return text
    return text.toLowerCase()
}

/**
 *
 * @export
 * @async
 * @param {string} text 
 * @returns {string} 
 */
export async function CreateSHA256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  return hashHex;
};

/**
 *
 * @export
 * @param {{ day?: number, month?: number, min?: number, hour?: number }} time 
 * @returns {number} 
 */
export function timeCovertToMs(time) {
    if (time["day"]) return time["day"] * 86400000
    if (time["month"]) return time["month"] * 2678400000
    if (time["min"]) return time["min"] * 60000
    if (time["hour"]) return time["hour"] * 3600000
    return 0
}

export const getConfig = () => {
    if (typeof window["config"] == "string") return
    return window["config"]
};
export const getGlobalCache = () => {};

/**
 *
 * @export
 * @param {string} url 
 * @returns {Promise<{ cookies: string, headers: { [key: string]: string } }>} 
 */
export function requestCloudflare(url) {
    return window["requestCloudflare"](url)
}

/**
 *
 * @export
 * @param {{ [key: string]: any }} config 
 * @returns {void} 
 */
export function savePluginConfig(config) {
    return window["savePluginConfig"](config)
}

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}