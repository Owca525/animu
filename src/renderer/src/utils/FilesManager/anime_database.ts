import { ParamsObject } from "sql.js";
import { CreateDatabase } from "../database";
import { ConvertObjectToDatabase, ConvertObjectToNormal, GetAnimeIDObject } from "../functions";
import { AnimeData, animulistProps, cardData, indentityPlayer } from "../types";
import { CreateBackup } from "../backup";

export const animuDatabase = new CreateDatabase({
    createDatabase: [`CREATE TABLE IF NOT EXISTS anime (
                id TEXT PRIMARY KEY,
                averageScore INTEGER,
                bannerImage TEXT,
                coverImage TEXT,
                description TEXT,
                duration INTEGER,
                episodes INTEGER,
                format TEXT,
                genres TEXT,
                season TEXT,
                seasonYear INTEGER,
                characters TEXT,
                status TEXT,
                source TEXT,
                synonyms TEXT,
                studios TEXT,
                "title.english" TEXT,
                "title.native" TEXT,
                "title.romaji" TEXT,
                type TEXT,
                player_ID TEXT,
                isAdult TEXT,

                "trailer.id" TEXT,
                "trailer.site" TEXT,

                relations TEXT,

                "startDate.day" INTEGER,
                "startDate.month" INTEGER,
                "startDate.year" INTEGER,

                "nextAiringEpisode.airingAt" INTEGER,
                "nextAiringEpisode.episode" INTEGER,
                "nextAiringEpisode.timeUntilAiring" INTEGER,

                "endDate.day" INTEGER,
                "endDate.month" INTEGER,
                "endDate.year" INTEGER
            )`,
        `CREATE TABLE IF NOT EXISTS savedata (
                id TEXT PRIMARY KEY,
                pluginName TEXT,
                last_Time INTEGER,
                episode TEXT,
                type TEXT,
                duration INTEGER,
                isStarted TEXT,
                lastAnimeDataUpdate INTEGER,
                lastEpisodesUpdate INTEGER,
                episodes TEXT,
                FOREIGN KEY(id) REFERENCES anime(id)
            )`,
        `CREATE TABLE IF NOT EXISTS ids (
                id TEXT PRIMARY KEY,
                anilist TEXT,
                FOREIGN KEY(id) REFERENCES anime(id)
            )`,
        `CREATE TABLE IF NOT EXISTS animulist (
                id TEXT PRIMARY KEY,
                status TEXT,
                score INTEGER,
                reapeat INTEGER,
                startWatch INTEGER,
                endWatch INTEGER,
                added INTEGER,
                lastUpdate INTEGER,
                favorite TEXT,
                progress INTEGER,
                FOREIGN KEY(id) REFERENCES anime(id)
            )`
    ],
    storage: "animu_database"
})

export async function ConvertToNewFormat() {


    // if (window["initialMetadata"]["old"] == undefined) return
    // // await CreateBackup()

    // if (localStorage.getItem("animu_database")) return

    // const history = window["initialMetadata"]["old"]["history"]

    // for (let index = 0; index < history.length; index++) {
    //     const anime = history[index];
    //     console.log(anime)

    //     AddCardDataToDatabase({
    //         ...anime,
    //         AnimeData: {
    //             ...anime["AnimeData"],
    //             id: { anilist: anime["AnimeData"]["id"] as any }
    //         }
    //     }, true)
    // }

    // const animulist = window["initialMetadata"]["old"]["animulist"]

    // for (let index = 0; index < animulist.length; index++) {
    //     const data = animulist[index];

    //     AddCardDataToDatabase({
    //         AnimeData: {
    //             ...data.AnimeData,
    //             id: { anilist: data["AnimeData"]["id"] as any }
    //         },
    //         animulist: data.animulist
    //     }, true)
    // }

    // animuDatabase.saveDatabase()
    // delete window["initialMetadata"]["old"];
}

export function GetAnimeFromDatabase(id: cardData | string | number, row?: string): cardData | undefined {

    let findedID: { id: string | number, name: string } = { name: "anilist", id: "" }

    if (typeof id == "object") findedID = GetAnimeIDObject(id["AnimeData"]) ?? { id: id["AnimeData"]["id"]["anilist"], name: "anilist" }
    if (row) findedID = { ...findedID, name: row }

    const finded = animuDatabase.get({ table: "ids", row: `${findedID["name"]}`, value: `${findedID["id"]}` })

    if (!finded) return

    const anime = animuDatabase.get({ table: "anime", row: "id", value: finded["id"] as string })
    const savedata = animuDatabase.get({ table: "savedata", row: "id", value: finded["id"] as string })
    const animulist = animuDatabase.get({ table: "animulist", row: "id", value: finded["id"] as string })

    if (!anime) return

    if (savedata) delete savedata.id
    if (animulist) delete animulist.id

    delete finded.id

    return {
        AnimeData: {
            ...ConvertObjectToNormal(anime!),
            id: finded as any
        } as AnimeData,
        saveData: ConvertObjectToNormal(savedata!) as indentityPlayer,
        animulist: ConvertObjectToNormal(animulist!) as animulistProps
    }
}

export function AddCardDataToDatabase(anime: cardData, dontSave?: boolean) {

    const id = GetAnimeIDObject(anime)

    if (!id) {
        console.error("anime_database/AddCardDataToDatabase FAILED ADD ANIME", anime)
        return
    }

    const finded = animuDatabase.get({ table: "ids", row: id["name"], value: `${id["id"]}` })
    const oldIDS = structuredClone(anime.AnimeData.id)

    let uuid = `${crypto.randomUUID()}`

    if (finded) {
        uuid = finded["id"] as string
    }

    let tmp = ConvertObjectToDatabase(anime.AnimeData)
    delete tmp.trailer;
    delete tmp.popularity;
    delete tmp.episodesList;

    animuDatabase.updateDatabse({
        table: 'anime',
        key: 'id',
        obj: {
            ...tmp,
            id: uuid
        }
    })

    animuDatabase.updateDatabse({
        table: 'ids',
        key: 'id',
        obj: {
            ...oldIDS,
            id: uuid
        }
    })

    if (anime.saveData) {
        animuDatabase.updateDatabse({
            table: 'savedata',
            key: 'id',
            obj: {
                ...ConvertObjectToDatabase(anime.saveData),
                id: uuid
            }
        })
    }

    if (anime.animulist) {
        animuDatabase.updateDatabse({
            table: 'animulist',
            key: 'id',
            obj: {
                ...ConvertObjectToDatabase(anime.animulist),
                id: uuid
            }
        })
    }

    if (!dontSave) animuDatabase.saveDatabase()
}

export function GetAllAnimeFromDatabase(): cardData[] {
    const ids = animuDatabase.getAll("ids")

    let animes: cardData[] = []

    if (!ids) return []

    for (let index = 0; index < ids.length; index++) {
        const element = ids[index];

        const anime = animuDatabase.get({ table: "anime", row: "id", value: element["id"] as string })
        const savedata = animuDatabase.get({ table: "savedata", row: "id", value: element["id"] as string })
        const animulist = animuDatabase.get({ table: "animulist", row: "id", value: element["id"] as string })

        if (!anime) continue

        if (savedata) delete savedata.id
        if (animulist) delete animulist.id

        delete element["id"]

        animes.push({
            AnimeData: {
                ...ConvertObjectToNormal(anime!),
                id: element as any,
            } as AnimeData,
            saveData: ConvertObjectToNormal(savedata!) as indentityPlayer,
            animulist: ConvertObjectToNormal(animulist!) as animulistProps
        })

    }

    return animes
}

window["exportAnimuDatabase"] = function () {
    const data = animuDatabase.db.export();

    const blob = new Blob([data as any], {
        type: "application/x-sqlite3"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "database.sqlite";
    a.click();

    URL.revokeObjectURL(url);
}

export function getAnimuHistoryIContinue() {
    let global = GetAllAnimeFromDatabase()

    let continueWatch: cardData[] = []

    global.forEach((element) => {
        if (!element.saveData) return

        if (element.saveData.last_Time != 0 || element.saveData.isStarted) continueWatch.push(element)

    })

    return {
        continue: continueWatch,
        history: global.map((value) => ({
            ...value,
            saveData: { ...value.saveData, last_Time: 0, isStarted: false }
        }))
    }
}

window["getAnimuHistoryIContinue"] = getAnimuHistoryIContinue;
window["GetAllAnimeFromDatabase"] = GetAllAnimeFromDatabase;
