import Button from '@renderer/components/buttons';
import ContainerWrong from './components/containerWrong';
import Drop from './components/drop';
import Dropdown from '@renderer/components/dropDown';
import { Anilist_ListMutation, AnimeData, animulistProps, cardData, episodeMetadata, indentityPlayer, informationTmpProps, playerData } from '@renderer/utils/types';
import {
    calculateDays,
    changeTitleAnimu,
    convertDateToDateObject,
    convertDateToFormattedString,
    convertSeconds,
    CreateContextMenuOptions,
    dateToUnix,
    decodeHtmlEntities,
    detectTitleConfig,
    ExtractVideo,
    getGradientColor,
    openUrlFolder,
    refetchHistory,
    SaveToClipboard,
    segregatePlugins,
    sortCharacterType,
    sortEpisodes,
    sortRelationType,
    unixToDateTime,
} from '@renderer/utils/functions';
import {
    For,
    Match,
    onCleanup,
    onMount,
    Show,
    Switch
} from 'solid-js';
import { animulistData, getAnimuHistory, getGlobalCache, informationCache, PlayerCache } from '@renderer/utils/stores/global';
import { getInformationPlugin, getPlayerPLugin } from '@renderer/utils/stores/plugins';
import { OpenContextMenu } from '@renderer/utils/context/ContextMenu';
import { createStore, unwrap } from 'solid-js/store';
import { useNavigate } from '@solidjs/router';
import './information.css';
import ImageViewer from '@renderer/components/imageViewer';
import { useResponse } from '@renderer/utils/hooks/useResponse';
import { useI18n } from '@renderer/utils/i18n';
import CharacterContainer from './components/characterContainer';
import { getConfig } from '@renderer/utils/stores/config';
import Container from '../home/components/container';
import { toast, updateToast } from '@renderer/utils/context/ToastNotification';
import { hideCustomMenu, isCustomMenuActive, showCustomMenu } from '@renderer/utils/context/menuContext';
import RelationCard from './components/relationCard';
import ButtonGroup from '../settings/components/buttonGroup';
import { requestAnimeMedia } from '@renderer/utils/animeThemes';
import { updateHistoryData } from '@renderer/utils/FilesManager/history';
import { addToAnimuList, removeFromAnimulist, updateDataInAnimulist } from '@renderer/utils/FilesManager/animulist';
// import OpeningPlayer from './components/openingPlayer';
import { readPlaylist, removeInPlaylist, saveToPlaylist } from '@renderer/utils/FilesManager/playlist';
import AnimulistMenu from '@renderer/components/animulistMenu';
import { updateGenres } from '../home/components/filter';
import { getHomeCache, getHomeSidebarData } from '@renderer/utils/stores/home';
import { setNewActivePage, StartHomeSearch } from '../home';
import EpisodeBox from './components/episodeBox';
import { SheepShortcut } from '@renderer/utils/hooks/useKeyPress';
import pluginManager from '@renderer/utils/pluginManager';
import Player from '../player/Player';

// TODO: RE-ADD OPENING MUSIC IN INFORMATION

interface informationContentType {
    type: string;
    metadata: {
        anime: AnimeData;
        playerID: string | undefined;
        plugin: string | undefined;
    } | string | AnimeData;
    error: string;
}

function createMiniTitle(anime: AnimeData): string {
    let synonyms = anime["synonyms"]
    let titles: string[] = []

    if (synonyms) synonyms.forEach((value) => titles.push(value))

    const keys = Object.values(anime.title)
    keys.forEach((element) => {
        if (element) titles.push(element)
    })

    titles = [...new Set(titles)]
    return titles.join(" \u25CF ")
}

function DetectTypeAnimeAndShare(anime: AnimeData) {
    const info = getInformationPlugin()
    if (!info["metadata"]["shareWebsite"]) return console.error("Failed Share URL, Missing shareWebsite")

    openUrlFolder(`${info["metadata"]["shareWebsite"][`${anime["type"]}`.toLocaleLowerCase()]}${anime["id"]}`)
}

async function FetchEpisodes(params: { anime: AnimeData, playerID: string | undefined, plugin: string | undefined }) {
    if (params.anime.format == "MANGA" || params.anime.format == "NOVEL" || params.anime.format == "ONE_SHOT") return
    if (params.anime.status == "NOT_YET_RELEASED" || params.anime.type != "ANIME") return
    if (!params.plugin) return

    let plugin = await pluginManager.changePlayerPlugin(params.plugin)

    let response = await plugin.extractEpisodeList(params.anime, params.playerID)

    return sortEpisodes(response)
}

async function FetchAnimeOpening(anime: AnimeData): Promise<playerData[]> {
    if (!parseInt(anime.id)) return []

    console.log(anime)

    const response = await requestAnimeMedia(parseInt(anime.id))

    return response.map((item) => {
        const firstPartTitle = item.type == "OP" ? "Opening" : "Ending"
        return {
            // embedTitle: `${firstPartTitle} ${item.musicTitle} ${item.variant ? item.variant : ""}`,
            hostname: `${firstPartTitle} ${item.musicTitle} ${item.variant ? item.variant : ""}`,
            resolution: item.videos.map((item) => ({
                res: item.resolution.toString(),
                url: item.url,
                canBeDownloaded: true
            }))
        }
    })
}

function information() {
    document.querySelectorAll('*').forEach((element: any) => {
        element.tabIndex = -1
    });

    const { t } = useI18n()
    const navigate = useNavigate();
    let descriptionRef: HTMLDivElement | undefined
    let animeEpisodeReleasingTime: NodeJS.Timeout | undefined

    const config = getConfig()

    const [information, updateInfo] = createStore({
        cache: informationCache.anime,

        activePlayerID: informationCache.anime["anime"]["player_ID"],
        activePlugin: undefined as string | undefined,

        isSearchAnimeIsActive: false,
        isShowingPictureIsActive: false,

        ShowMoreDescription: false,
        ShowMoreTitles: false,

        youCanLeave: false,

        isInWaitingPlaylist: false,

        activePage: "Episodes",

        activeTime: undefined as { left: number, converted: { days: number; hours: number; minutes: number; seconds: number; } | undefined } | undefined,

        isFetchingAnime: false,

        isShowWrongActive: false,
        isImageViewerActive: false,

        buttonGroup: [] as { value: string; onClick: () => void; }[],
    })

    function GenerateButtons(): { value: string; onClick: () => void; }[] {
        if (information["cache"]["anime"].format == "MUSIC") {
            return [{
                value: 'Music',
                onClick: () => {
                    updateInfo({ activePage: "Music" })
                    contentResponse.Refetch({ type: "music", metadata: `${information["cache"]["anime"]["trailer"]!["id"]}`, error: "Music Not Found" })
                }
            }]
        }

        if (information["cache"]["anime"].type != "ANIME" || information["cache"]["anime"].status == "NOT_YET_RELEASED") {
            return [{
                value: 'Trailer',
                onClick: () => {
                    updateInfo({ activePage: "Trailer" })
                    contentResponse.Refetch({ type: "trailer", metadata: `${information["cache"]["anime"]["trailer"]!["id"]}`, error: "No Trailer Found" })
                }
            }]
        }

        let tmp = [{
            value: 'Episodes',
            onClick: () => {
                updateInfo({ activePage: "Episodes" })
                contentResponse.Refetch({
                    type: "episodes",
                    metadata: { anime: information["cache"]["anime"], playerID: information["activePlayerID"], plugin: information["activePlugin"] },
                    error: "global.notFound"
                })
            }
        }, {
            value: 'Opening/Ending',
            onClick: () => {
                updateInfo({ activePage: "Opening/Ending" })
                contentResponse.Refetch({ type: "opening", metadata: information["cache"]["anime"], error: "Opening Not Found" })
            }
        }]

        if (information["cache"]["anime"]["trailer"]) tmp.push({
            value: 'Trailer',
            onClick: () => {
                updateInfo({ activePage: "Trailer" })
                contentResponse.Refetch({ type: "trailer", metadata: `${information["cache"]["anime"]["trailer"]!["id"]}`, error: "No Trailer Found" })
            }
        })

        return tmp
    }

    const contentResponse = useResponse({
        queryKey: {
            type: "episodes",
            metadata: { anime: information["cache"]["anime"], playerID: information["activePlayerID"], plugin: information["activePlugin"] },
            error: "global.notFound"
        } as informationContentType,

        queryFn: async (queryKey) => {
            queryKey = unwrap(queryKey)

            /* IFDEF DEBUG */
            console.warn("contentResponse", queryKey)
            /* ENDIF */

            let content: any = undefined

            switch (queryKey["type"]) {
                case "episodes":
                    content = await FetchEpisodes(queryKey["metadata"] as any)
                    if (content) updateInfo({ activePlayerID: content["player_id"] })
                    break
                case "opening":
                    content = await FetchAnimeOpening(queryKey["metadata"] as any)
                    break
                case "trailer":
                    if (config["information"]["trailerplayertype"] == "player") {
                        content = await ExtractVideo(`https://www.youtube.com/watch?v=${queryKey["metadata"]}` as any)
                    } else {
                        content = ""
                    }
                    break
                case "music":
                    content = await ExtractVideo(`https://www.youtube.com/watch?v=${queryKey["metadata"]}` as any)
                    break
            }

            return { content, type: queryKey["type"], error: queryKey["error"] }
        },
        cacheTime: 7200000,
        disable: true,
    })


    function updateInformation(content: informationTmpProps) {
        informationCache.update(content)
        updateInfo({ cache: informationCache.anime })
    }


    function checkIsAnimeReleasing() {
        if (!information["cache"]["anime"]["nextAiringEpisode"]) return
        if (animeEpisodeReleasingTime) clearInterval(animeEpisodeReleasingTime)

        updateInfo({
            activeTime: {
                left: information["cache"]["anime"]["nextAiringEpisode"]["timeUntilAiring"],
                converted: convertSeconds(information["cache"]["anime"]["nextAiringEpisode"]["timeUntilAiring"])
            }
        })

        animeEpisodeReleasingTime = setInterval(() => {
            const prev = information["activeTime"]

            if (!prev) return updateInfo({ activeTime: undefined })
            if (prev.left <= 1) {
                clearInterval(animeEpisodeReleasingTime);

                if (information["cache"]["anime"]["status"] == "RELEASING") FetchAnimeForinformation()

                updateInfo({ activeTime: { left: 0, converted: convertSeconds(0) } })
                return
            }

            updateInfo({ activeTime: { left: prev.left - 1, converted: convertSeconds(prev.left - 1) } })
        }, 1000);
    }

    async function checkAnimeFetching() {

        updateInformation({
            ...information["cache"],
            anime: {
                ...information["cache"]["anime"],
                relations: sortRelationType(information["cache"]["anime"]["relations"]),
                characters: sortCharacterType(information["cache"]["anime"]["characters"])
            }
        })

        if (information["cache"]["anime"]["id"] == "") return

        if (information["cache"]["anime"]["nextAiringEpisode"] || !information["cache"]["saveData"]) return

        const lastTime = information["cache"]["saveData"]["lastAnimeDataUpdate"]

        if (information["cache"].anime.status == "RELEASING" || !lastTime || calculateDays(lastTime, dateToUnix(new Date().toString())) <= -1 || config.information.alwaysUpdateAnime) {
            await FetchAnimeForinformation()

            const tmpData = information["cache"]
            const tmpUpdate = {
                ...information["cache"],
                saveData: {
                    ...information["cache"]["saveData"],
                    lastAnimeDataUpdate: dateToUnix(new Date().toString())
                } as indentityPlayer
            }

            updateHistoryData(tmpData.anime.id, {
                AnimeData: {
                    ...tmpData.anime,
                    recommendations: undefined
                },
                saveData: tmpUpdate.saveData
            })

            updateInformation({
                ...information["cache"],
                anime: {
                    ...tmpData.anime,
                    recommendations: undefined
                },
                saveData: tmpUpdate.saveData
            })

            await refetchHistory()
        }
    }

    async function initialInformation() {
        updateInfo({ buttonGroup: GenerateButtons() })

        // if (config.information.openingininformation) searchAnimeOpenings()

        changeTitleAnimu(`Animu - ${detectTitleConfig(information["cache"]["anime"]["title"])}`)
        checkIsAnimeReleasing()

        // && information["cache"]["anime"]["status"] == "RELEASING"
        if (information["cache"]["saveData"]) FetchAnimeForinformation()

        if (information["cache"]["anime"]["nextAiringEpisode"]) checkIsAnimeReleasing()

        if (descriptionRef && descriptionRef.scrollHeight > descriptionRef.clientHeight) updateInfo({ ShowMoreDescription: true })

        const content = information["cache"]

        readPlaylist("global.waitingplaylist").then((v) => {
            if (v.find((v) => v.anime.AnimeData.id == content.anime.id)) updateInfo({ isInWaitingPlaylist: true })
            else updateInfo({ isInWaitingPlaylist: false })
        })

        let plugin = getPlayerPLugin()
        updateInfo({
            activePlugin: plugin.metadata.name
        })

        let tempHistory = getAnimuHistory()

        let history: cardData | undefined = undefined
        if (content.anime.id == "") {
            let tmp = tempHistory.entries().find(([_, item]) => item.AnimeData.title === content.anime.title)
            if (tmp) history = tmp[1]
        } else {
            history = tempHistory.get(content.anime.id)
        }

        if (history && !content["DontOverWrite"]) {
            let plugin = await pluginManager.changePlayerPlugin(history.saveData?.pluginName as string)
            if (plugin) if (plugin.metadata.name != history.saveData?.pluginName) updateInfo({
                activePlayerID: undefined
            })

            updateInfo({
                activePlugin: plugin.metadata.name
            })

            updateInformation({ ...content, saveData: { ...history.saveData, pluginName: information["activePlayerID"] as string } as indentityPlayer })
        }

        if (detectTrailerMusic()) return

        checkAnimeFetching()

        contentResponse.Refetch({
            type: "episodes",
            metadata: { anime: information["cache"]["anime"], playerID: information["activePlayerID"], plugin: information["activePlugin"] },
            error: "global.notFound"
        })
    }

    function detectTrailerMusic() {
        if (information["cache"]["anime"]["format"] == "MUSIC") {
            information.buttonGroup.forEach((v) => {
                if (v["value"] == "Music") v["onClick"]()
            })
            return true
        }

        if (information["cache"]["anime"]["type"] != "ANIME" || information["cache"]["anime"]["status"] == "NOT_YET_RELEASED") {
            information.buttonGroup.forEach((v) => {
                if (v["value"] == "Trailer") v["onClick"]()
            })
            return true
        }

        return false
    }

    onMount(() => {
        initialInformation()
        setTimeout(() => { updateInfo({ youCanLeave: true }) }, 300)

        if (config["information"]["preloadOpening"]) FetchAnimeOpening(information["cache"]["anime"])

        // TODO: RE-ADD THIS
        // if (config["information"]["preloadTrailer"] && config["information"]["trailerplayertype"] == "player")
        //     getAnimeTrailer(`https://www.youtube.com/watch?v=${information["cache"]["anime"]["trailer"]?.id}`)
    })

    onCleanup(() => {
        clearInterval(animeEpisodeReleasingTime)
        updateInfo({ youCanLeave: false })
    })

    function enterPlayer(episodes: episodeMetadata[], type: string, episode: string): any {
        if (!information["activePlayerID"]) return toast("No Player ID Found", { type: "error" })

        let tmp = information["cache"]
        let lastTime = 0

        if (tmp.saveData && tmp.saveData.episode.toString() === episode.toString()) lastTime = tmp.saveData.last_Time
        PlayerCache.update({
            anime: {
                ...tmp.anime,
                player_ID: information["activePlayerID"]
            },
            saveData: {
                last_Time: lastTime,
                type: type,
                pluginName: getPlayerPLugin()?.metadata.name,
                episode: episode
            },
            episodelist: episodes,
            animulist: tmp.animulist,
            continewatch: false
        })
        navigate("/player")
    }

    async function FetchAnimeForinformation(): Promise<any> {
        updateInfo({ isFetchingAnime: true })

        const anime = information["cache"]["anime"]

        const resp = await getInformationPlugin().anime(anime["id"])
        if (!resp) return updateInfo({ isFetchingAnime: false })

        updateInfo({ isFetchingAnime: false })

        const tmpnewFetch: AnimeData = {
            ...resp,
            player_ID: information["activePlayerID"],
            relations: sortRelationType(resp["relations"]),
            characters: sortCharacterType(resp["characters"])
        }

        updateInformation({
            ...informationCache.anime,
            anime: tmpnewFetch
        })

        updateHistoryData(anime.id, { AnimeData: tmpnewFetch, saveData: information["cache"]["saveData"] })
        checkIsAnimeReleasing()
    }

    async function ChangeAnimeInInformation(data: AnimeData): Promise<any> {
        const idToast = toast(t("notification.fetchinganime"), { timer: true, type: "loading" })
        const animulist = animulistData()
        let resp

        if (data.format == "MANGA" || data.format == "NOVEL" || data.format == "ONE_SHOT") {
            resp = await getInformationPlugin().getManga(data.id)
        } else {
            resp = await getInformationPlugin().anime(data.id)
        }

        if (!resp) return updateToast(idToast, t("notification.failedanime"), { type: "error", timer: false })
        updateToast(idToast, t("notification.successanime"), { type: "success", timer: false })

        let tmpAnimulist: any = animulist.get(resp["id"])
        if (tmpAnimulist) tmpAnimulist = tmpAnimulist["animulist"]

        if (information["activePlugin"]) await pluginManager.changePlayerPlugin(information["activePlugin"]!)

        updateInformation({ anime: resp, saveData: undefined, animulist: tmpAnimulist })

        updateInfo({
            activePage: "Episodes",
            ShowMoreTitles: false
        })

        initialInformation()
    }

    function makeButtons(episode: episodeMetadata[], type: string) {
        let tmpSaveData = information["cache"]
        return (
            <div class="information-buttons-episode-container">
                <For each={episode}>
                    {(data) => <EpisodeBox variant={config.information.episodeVariants}
                        enterPlayer={() => enterPlayer(episode, type, data.ep)}
                        saveData={tmpSaveData.saveData} episode={data} />
                    }
                </For>
            </div>
        )
    }

    SheepShortcut(["Escape"], () => {
        if (!location.href.includes("#/info") || !information["youCanLeave"]) return

        if (isCustomMenuActive()) return hideCustomMenu()
        if (information["isShowWrongActive"]) updateInfo({ isShowWrongActive: false })
        else if (information["isShowingPictureIsActive"]) updateInfo({ isShowingPictureIsActive: false })
        else navigate("/")
    })

    async function refreashInformation(name: string, force: boolean = false) {
        let content = contentResponse.queryData()

        if (information["activePage"] == "Episodes") {
            await pluginManager.changePlayerPlugin(name)

            updateInfo({
                activePlayerID: undefined,
                activePlugin: name
            })

            content = {
                ...content,
                metadata: {
                    ...content["metadata"] as any,
                    plugin: name,
                    playerID: undefined
                }
            }
        }

        contentResponse.Refetch(content, force)
    }

    async function modifySaveAnimuList(animulist: animulistProps, anime: AnimeData, edit: boolean = false) {
        if (edit) updateDataInAnimulist(anime.id, { AnimeData: anime, animulist }, true)
        else addToAnimuList(animulist, anime, true);

        updateInformation({ ...information["cache"], animulist: animulist })

        if (!getGlobalCache().anilist_user_data) return

        let tmp = {
            completedAt: convertDateToDateObject(animulist.endWatch),
            startedAt: convertDateToDateObject(animulist.startWatch),
            mediaId: parseInt(anime.id),
            progress: animulist.progress ?? 0,
            repeat: animulist.reapeat,
            score: animulist.score,
            status: animulist.status
        } satisfies Anilist_ListMutation

        if (await getInformationPlugin().setAnimeInList(tmp)) toast(t(`Succesfully Updated ${detectTitleConfig(anime.title)}`), { type: "success" })
        else toast(t(`Failed Updated ${detectTitleConfig(anime.title)}`), { type: "error" })
    }

    return (
        <>
            <main class="information" onContextMenu={(event) => OpenContextMenu(CreateContextMenuOptions([
                {
                    option: t("information.copylink"),
                    onClick: async () => await SaveToClipboard("text", `${config.deepLinkURL}/?anime=${btoa(`${information["cache"]["anime"]["id"]}`)}`)
                }
            ]), event)}>
                <div class="information-banner">
                    <sheep-img
                        class={information["cache"]["anime"]["bannerImage"] ? "information-banner-image" : "information-banner-image-blur"}
                        src={information["cache"]["anime"]["bannerImage"] ?
                            information["cache"]["anime"]["bannerImage"] :
                            information["cache"]["anime"]["coverImage"] ?
                                information["cache"]["anime"]["coverImage"] : ""
                        }
                        divClass='information-banner-image-placeholder'
                    />
                    <div class="information-fade"></div>
                </div>


                <div class="information-container">

                    <div class="information-top">
                        <div class="information-image-container">
                            {information["cache"].anime.averageScore && <div class="information-score" style={{ border: `3px solid ${getGradientColor(information["cache"].anime.averageScore)}` }}>{information["cache"].anime.averageScore}%</div>}
                            <sheep-img
                                class="information-cover"
                                divClass='information-cover-placeholder'
                                onClick={() => updateInfo({ isImageViewerActive: true })}
                                src={information["cache"]["anime"]["coverImage"] ? information["cache"]["anime"]["coverImage"] : ""}
                            />

                            {/* <div class="information-title-small-container">
                                <div class={`information-title-small ${moreMiniTitle() == false ? "click" : ""}`} onclick={() => setmoreMiniTitle(true)}>{createMiniTitle()}</div>
                            </div> */}
                        </div>
                        <div class="information-text-container">
                            <div class="information-title">{detectTitleConfig(information["cache"].anime.title)}</div>

                            <div
                                class={`information-mini-title ${information["ShowMoreTitles"] == false ? "click" : ""}`}
                                onclick={() => updateInfo({ ShowMoreTitles: true })}>

                                {createMiniTitle(information["cache"]["anime"])}
                            </div>

                            <div class="information-description" ref={descriptionRef}>
                                {decodeHtmlEntities(information["cache"].anime.description ?? t("information.descriptionnotfound"))}
                            </div>

                            <span class={`information-description-toggle ${information["ShowMoreDescription"] ? "show" : ""}`}
                                onclick={() => descriptionRef?.classList.add("moretext")}
                            >
                                {t("information.more")}
                            </span>
                        </div>
                        <div class="information-bar">
                            <Button
                                titleButton={t("information.bar.anilist")}
                                icon="open_in_new"
                                ButtonClass="information-bar-icon"
                                onClick={() => DetectTypeAnimeAndShare(information["cache"]["anime"])}
                            />

                            {/* <Show when={information["cache"].anime.trailer && !window.api}>
                                <Button titleButton={t("information.bar.trailer")} icon="theaters" ButtonClass="information-bar-icon" onClick={() => openUrlFolder(`https://www.youtube.com/watch?v=${information["cache"].anime.trailer?.id}`)} />
                            </Show> */}
                            <Show when={information["cache"].anime.type == "ANIME"}>
                                <Switch>
                                    <Match when={information["cache"].animulist == undefined}>
                                        <Button titleButton={"Add To Animulist"} icon="add" ButtonClass="information-bar-icon" onClick={() => showCustomMenu(AnimulistMenu({
                                            anime: information["cache"].anime,
                                            animulist: information["cache"].animulist,
                                            save: (animulist, anime) => { modifySaveAnimuList(animulist, anime) }
                                        }))} />
                                    </Match>
                                    <Match when={information["cache"].animulist}>
                                        <Button titleButton={"Edit Anime"} icon="edit" ButtonClass="information-bar-icon" onClick={() => showCustomMenu(AnimulistMenu({
                                            anime: information["cache"].anime,
                                            animulist: information["cache"].animulist,
                                            save: (animulist, anime) => { modifySaveAnimuList(animulist, anime, true) }
                                        }
                                        ))} />
                                        <Button titleButton={"Remove From Animulist"} icon="delete" ButtonClass="information-bar-icon" onClick={() => {
                                            removeFromAnimulist(information["cache"].anime.id, true);
                                            updateInformation({ ...information["cache"], animulist: undefined })
                                        }} />
                                    </Match>
                                </Switch>
                                <Show when={information["cache"].anime.nextAiringEpisode && information["cache"].anime.type == "ANIME"}>
                                    {/* TODO: ADD THIS TO SEPERATE FUNCTIONS */}
                                    <Switch>

                                        <Match when={!information["isInWaitingPlaylist"]}>
                                            <Button titleButton={"Add To Waiting Playlist"} icon="playlist_add" ButtonClass="information-bar-icon" onClick={async (): Promise<any> => {
                                                const tmp = information["cache"]
                                                const resp = await saveToPlaylist("global.waitingplaylist", {
                                                    anime: {
                                                        AnimeData: {
                                                            ...tmp.anime,
                                                            player_ID: information["activePlayerID"]
                                                        },
                                                        saveData: tmp.saveData == undefined ? {
                                                            pluginName: getPlayerPLugin()?.metadata.name!,
                                                            last_Time: 0,
                                                            episode: "1",
                                                            type: "sub",
                                                            isStarted: true,
                                                            lastAnimeDataUpdate: dateToUnix(new Date().toString()),
                                                        } : tmp.saveData
                                                    },
                                                    added: dateToUnix(new Date().toString()),
                                                    lastupdate: dateToUnix(new Date().toString())
                                                })
                                                if (!resp) return toast("Failed Add Anime to Waiting Playlist", { type: "error" })
                                                else {
                                                    updateInfo({ isInWaitingPlaylist: true })
                                                    toast("Succesfully added to waiting playlist", { type: "success" })
                                                }
                                            }} />
                                        </Match>

                                        <Match when={information["isInWaitingPlaylist"]}>
                                            <Button titleButton={"Remove From Waiting Playlist"} icon="playlist_remove" ButtonClass="information-bar-icon" onClick={async (): Promise<any> => {
                                                const tmp = information["cache"]
                                                const resp = await removeInPlaylist("global.waitingplaylist", tmp.anime.id)
                                                if (!resp) return toast("Failed Remove Anime to Waiting Playlist", { type: "error" })
                                                else {
                                                    updateInfo({ isInWaitingPlaylist: false })
                                                    toast("Succesfully Removed Anime from waiting playlist", { type: "success" })
                                                }
                                            }} />
                                        </Match>
                                    </Switch>
                                </Show>
                            </Show>
                        </div>
                    </div>

                    <div class="information-bottom">

                        <div class="information-right-bar">

                            <div class="information-info">
                                <Switch>
                                    <Match when={information["isFetchingAnime"] && information["cache"].anime.status == "RELEASING"}>
                                        <div class="information-info-content loading">
                                            <span class='material-symbols-outlined loading-animation icon'>progress_activity</span>
                                        </div>
                                    </Match>
                                    <Match when={information["cache"].anime.nextAiringEpisode && information["activeTime"] != undefined && information["activeTime"]!.left > 0 && !information["isFetchingAnime"]}>
                                        <div class="information-info-content">
                                            <div class="information-content-title">
                                                {t("information.airing")}: {information["cache"].anime.nextAiringEpisode?.episode}
                                            </div>
                                            {`${information["activeTime"]?.converted?.days}d ${information["activeTime"]?.converted?.hours}h ${information["activeTime"]?.converted?.minutes}m ${information["activeTime"]?.converted?.seconds}s`}
                                        </div>
                                    </Match>
                                </Switch>

                                <Show when={information["cache"].anime.format}>
                                    <div class="information-info-content">
                                        <div class="information-content-title">{t("information.format")}</div>
                                        {t(`anime_formats.${information["cache"].anime.format}`)}
                                    </div>
                                </Show>

                                <Show when={information["cache"].anime.episodes}>
                                    <div class="information-info-content">
                                        <div class="information-content-title">{t("information.episodes")}</div>
                                        {information["cache"].anime.episodes}
                                    </div>
                                </Show>

                                <Show when={information["cache"].anime.duration}>
                                    <div class="information-info-content">
                                        <div class="information-content-title">{t("information.duration")}</div>
                                        {information["cache"].anime.duration} {t("global.minutes")}
                                    </div>
                                </Show>

                                <Show when={information["cache"].anime.status}>
                                    <div class="information-info-content">
                                        <div class="information-content-title">{t("information.status")}</div>
                                        {t(`anime_statuses.${information["cache"].anime.status}`)}
                                    </div>
                                </Show>

                                <Show when={information["cache"].anime.startDate &&
                                    information["cache"].anime.startDate?.year != undefined &&
                                    information["cache"].anime.startDate?.day != undefined &&
                                    information["cache"].anime.startDate?.month != undefined}>
                                    <div class="information-info-content">
                                        <div class="information-content-title">{t("information.startdate")}</div>
                                        {convertDateToFormattedString(information["cache"].anime.startDate?.year, information["cache"].anime.startDate?.month, information["cache"].anime.startDate?.day, undefined, undefined)}
                                    </div>
                                </Show>

                                <Show when={information["cache"].anime.endDate &&
                                    information["cache"].anime.endDate?.year != undefined &&
                                    information["cache"].anime.endDate?.day != undefined &&
                                    information["cache"].anime.endDate?.month != undefined}>
                                    <div class="information-info-content">
                                        <div class="information-content-title">{t("information.endate")}</div>
                                        {convertDateToFormattedString(information["cache"].anime.endDate?.year, information["cache"].anime.endDate?.month, information["cache"].anime.endDate?.day, undefined, undefined)}
                                    </div>
                                </Show>

                                <Show when={information["cache"].anime.season && information["cache"].anime.seasonYear}>
                                    <div class="information-info-content">
                                        <div class="information-content-title">{t("information.season")}</div>
                                        {t(`anime_seasons.${information["cache"].anime.season}`)} {information["cache"].anime.seasonYear}
                                    </div>
                                </Show>

                                <Show when={information["cache"].anime.source}>
                                    <div class="information-info-content">
                                        <div class="information-content-title">{t("information.source")}</div>
                                        {t(`anime_source.${information["cache"].anime.source}`)}
                                    </div>
                                </Show>

                            </div>

                            <Show when={information["cache"].anime.genres}>
                                <div class="information-genres-container">
                                    <span class='information-genre-title'>Genres</span>
                                    <div class="information-genres-container-container">
                                        <For each={information["cache"].anime.genres}>
                                            {(item) => (
                                                <span onclick={() => {
                                                    if (isCustomMenuActive()) hideCustomMenu()
                                                    // if (showWrong()) setshowWrong(() => false)
                                                    // if (showImages()) setShowImages(false)

                                                    updateGenres("genres", item, `anime_genres.${item}`);
                                                    const cache = getHomeCache()
                                                    StartHomeSearch(cache.search, cache.filterTags)
                                                    setNewActivePage(getHomeSidebarData().top[0].text, false)

                                                    navigate("/")
                                                }} class='information-genre-button'>{t(`anime_genres.${item}`)}</span>
                                            )}
                                        </For>
                                    </div>
                                </div>
                            </Show>
                        </div>


                        <div class="information-bottom-content">

                            <Show when={information["cache"].animulist}>
                                <div class='information-animulist-container'>
                                    <span class='information-animulist-data'>
                                        Status {t(`animulist.status.${information["cache"].animulist?.status}`)}
                                    </span>&#8226;
                                    <span class='information-animulist-data'>
                                        Added {unixToDateTime(information["cache"].animulist?.added).split(" ")[0]}
                                    </span>&#8226;
                                    <span class='information-animulist-data'>
                                        Started Watching {unixToDateTime(information["cache"].animulist?.startWatch).split(" ")[0]}
                                    </span>&#8226;
                                    <span class='information-animulist-data'>
                                        Ended Watch {unixToDateTime(information["cache"].animulist?.endWatch).split(" ")[0]}
                                    </span>&#8226;
                                    <span class='information-animulist-data'>
                                        Repeat Watch {information["cache"].animulist?.reapeat}
                                    </span>
                                </div>
                            </Show>

                            <div class="information-episodes">
                                <div class="information-episodes-top-content">
                                    <div class="information-eopsodes-top-left">
                                        <Show when={information["cache"].anime.type == "ANIME" && information["cache"].anime.status != "NOT_YET_RELEASED" && information["cache"].anime.format != "MUSIC"}>
                                            <Button ButtonClass="information-episodes-button" icon="search" onClick={() => updateInfo({ isShowWrongActive: true })} />
                                        </Show>
                                        <ButtonGroup selectedValue={information["activePage"]} listValues={information["buttonGroup"]} />
                                    </div>
                                    <div class="information-episodes-space">
                                        <Show when={information["cache"].anime.type == "ANIME" && information["cache"].anime.status != "NOT_YET_RELEASED" && information["cache"].anime.format != "MUSIC"}>
                                            <Dropdown
                                                options={segregatePlugins(refreashInformation)}
                                                disableX
                                                buttonText={information["activePlugin"]}
                                            />
                                            <Button ButtonClass="information-episodes-button" icon="refresh" onClick={() => refreashInformation(getPlayerPLugin()?.metadata.name as string, true)} />
                                        </Show>
                                    </div>
                                </div>

                                <Switch>

                                    <Match when={!contentResponse.error() && contentResponse.loading()}>
                                        <div class="information-loading-container">
                                            <span class="material-symbols-outlined information-loading">progress_activity</span>
                                        </div>
                                    </Match>

                                    <Match when={contentResponse.error() && !contentResponse.loading()}>
                                        <div class="information-loading-container">
                                            <span class="information-error material-symbols-outlined">error</span>
                                            {t(contentResponse.data() ? contentResponse.data()!["error"] : "global.notFound")}
                                        </div>
                                    </Match>

                                    <Match when={!contentResponse.error() && !contentResponse.loading() && contentResponse.data() && (contentResponse.data()!["content"] == undefined || contentResponse.data()!["content"].length <= 0)}>
                                        <div class="information-loading-container">
                                            <span class="information-error material-symbols-outlined">search_off</span>
                                            {t(contentResponse.data() ? contentResponse.data()!["error"] : "global.notFound")}
                                        </div>
                                    </Match>

                                    <Match when={contentResponse.data() && (contentResponse.data()!["type"] == "trailer" || contentResponse.data()!["type"] == "music")}>
                                        <Switch>
                                            <Match when={config["information"]["trailerplayertype"] == "player"}>
                                                <Player
                                                    type='embed'
                                                    playerTitle=""
                                                    metadata={contentResponse.data()!["content"] as any}
                                                />
                                            </Match>
                                            <Match when={config["information"]["trailerplayertype"] == "embed"}>
                                                <iframe
                                                    height="610px"
                                                    class='information-iframe'
                                                    src={`https://www.youtube.com/embed/${information.cache.anime["trailer"] ? information.cache.anime["trailer"]["id"] : ""}`}
                                                    frameborder="0"
                                                    referrerpolicy='strict-origin-when-cross-origin'
                                                    allowfullscreen
                                                ></iframe>
                                            </Match>
                                        </Switch>
                                    </Match>

                                    <Match when={contentResponse.data() && contentResponse.data()!["type"] == "opening"}>
                                        <Player
                                            type='embed'
                                            playerTitle=""
                                            metadata={contentResponse.data()!["content"]}
                                        />
                                    </Match>

                                    <Match when={contentResponse.data() && contentResponse.data()!["type"] == "episodes"}>
                                        <For each={contentResponse.data()!["content"].episodesData} fallback={<div class="information-loading-container"><span class="information-error material-symbols-outlined">error</span>{t("information.errors")}</div>}>
                                            {(episode) => {
                                                if (episode.episodes.length <= 0) return <></>
                                                return <Drop
                                                    LeftHeader={<>
                                                        {episode.name ? t(episode.name) : t(`information.types.${episode.type}`)}
                                                        <Show when={contentResponse.data()!["langugeAvaible"]}>
                                                            <span class='information-avaible-langs-container'>
                                                                <For each={contentResponse.data()!["langugeAvaible"]}>
                                                                    {(v) => (
                                                                        <span class='information-avaible-lang'>{v}</span>
                                                                    )}
                                                                </For>
                                                            </span>
                                                        </Show>
                                                    </>}
                                                    RightHeader={t("information.listEpisodes", { number: episode.episodes.length })}
                                                    content={makeButtons(episode.episodes, episode.type)}
                                                />
                                            }}
                                        </For>
                                    </Match>

                                </Switch>

                            </div>

                            <Show when={information["cache"].anime.relations && information["cache"].anime.relations!.length > 0}>
                                <div class="information-relation-container">
                                    <For each={information["cache"].anime.relations}>
                                        {(rel) => <RelationCard
                                            id={rel.id}
                                            relationType={rel.relationType}
                                            title={rel.title}
                                            coverImage={rel.coverImage}
                                            onClick={() => ChangeAnimeInInformation({
                                                title: rel.title,
                                                id: rel.id.toString(),
                                                format: rel.format,
                                                type: rel.type
                                            })}
                                            status={rel.status}
                                            source={rel.format}
                                        />}
                                    </For>
                                </div>
                            </Show>
                            <Show when={information["cache"].anime.characters && information["cache"].anime.characters!.length > 0}>
                                <CharacterContainer title={t("information.characters")} cards={information["cache"].anime.characters!.map((char) => ({
                                    id: char.character.id,
                                    image: char.character.image,
                                    name: char.character.name,
                                    role: t(`information.role.${char.role}`),
                                    onClick: () => openUrlFolder(`https://anilist.co/character/${char.character.id}`)
                                }))} />
                            </Show>

                            <Show when={information["cache"].anime.characters && information["cache"].anime.characters!.map((tmp) => tmp.voiceActor).filter((item) => item != undefined).length > 0}>
                                <CharacterContainer title={t("information.actors")} cards={information["cache"].anime.characters!.map((char) => ({
                                    id: char.voiceActor?.id as string,
                                    image: char.voiceActor?.image as string,
                                    name: char.voiceActor?.name as string,
                                    role: char.character.name,
                                    onClick: () => openUrlFolder(`https://anilist.co/staff/${char.voiceActor ? char.voiceActor.id : ""}`)
                                }))} />
                            </Show>

                            <Switch>
                                <Match when={information["isFetchingAnime"]}>
                                    <div class="information-recomendation-loading">
                                        <span class='material-symbols-outlined loading-animation icon'>progress_activity</span>
                                    </div>
                                </Match>
                                <Match when={information["cache"].anime.recommendations && information["cache"].anime.recommendations!.length > 0 && !information["isFetchingAnime"] && information["cache"].anime.type == "ANIME"}>
                                    <Container title="information.recomendation" horizontal data={information["cache"].anime.recommendations!.map((item) => ({
                                        AnimeData: {
                                            title: item.title,
                                            bannerImage: item.bannerImage,
                                            coverImage: item.coverImage,
                                            type: item.type,
                                            format: item.format,
                                            id: item.id.toString(),
                                        },
                                        onClick: ChangeAnimeInInformation
                                    } as cardData))} />
                                </Match>
                            </Switch>
                        </div>
                    </div>
                </div>

                <Button icon="arrow_back" ButtonClass="information-exit-button" onClick={() => navigate("/")} />
            </main>
            <Show when={information["isShowWrongActive"]}>
                <ContainerWrong name={detectTitleConfig(information["cache"].anime.title)} refetchfunc={(id?: string) => {
                    updateInfo({ isShowWrongActive: false, activePlayerID: id })
                    contentResponse.Refetch({
                        type: "episodes",
                        metadata: { anime: information["cache"]["anime"], playerID: id, plugin: getPlayerPLugin()["metadata"]["name"] },
                        error: "global.notFound"
                    }, true)
                }}
                    exitfunc={() => updateInfo({ isShowWrongActive: false })}
                />
            </Show>

            <Show when={information["isImageViewerActive"]}>
                <ImageViewer
                    files={[information["cache"].anime.coverImage as string, information["cache"].anime.bannerImage as string].filter((value) => value != null)}
                    disable={() => updateInfo({ isImageViewerActive: false })}
                />
            </Show>

            {/* <Show when={currentAudio() && config.information.openingininformation}>
                <OpeningPlayer music={currentAudio()!} />
            </Show> */}
        </>
    )
}

export default information