import Button from '@renderer/components/buttons';
import ContainerWrong from './components/containerWrong';
import Drop from './components/drop';
import Dropdown from '@renderer/components/dropDown';
import { Anilist_ListMutation, AnimeData, animeOpeningsFormat, animulistProps, cardData, ContextMenuProps, episodeMetadata, indentityPlayer, playerChapterList, playerSubtitlesFormat, resolutionFormat } from '@renderer/utils/types';
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
    getGradientColor,
    openUrlFolder,
    refetchHistory,
    SaveToClipboard,
    segregatePlugins,
    unixToDateTime,
} from '@renderer/utils/functions';
import {
    createEffect,
    createSignal,
    For,
    Match,
    onCleanup,
    onMount,
    Show,
    Switch
} from 'solid-js';
import { createShortcut } from '@solid-primitives/keyboard';
import { animulistData, getGlobalCache } from '@renderer/utils/stores/global';
import { getInformationPlugin, getPlayerPLugin, pluginManager } from '@renderer/utils/stores/plugins';
import { OpenContextMenu } from '@renderer/utils/context/ContextMenu';
import { unwrap } from 'solid-js/store';
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
import MiniPlayer, { MiniPlayerProps } from '@renderer/components/miniPlayer';
import { requestAnimeMedia } from '@renderer/utils/animeThemes';
import { updateHistoryData } from '@renderer/utils/FilesManager/history';
import { addToAnimuList, removeFromAnimulist, updateDataInAnimulist } from '@renderer/utils/FilesManager/animulist';
import OpeningPlayer from './components/openingPlayer';
import { readPlaylist, removeInPlaylist, saveToPlaylist } from '@renderer/utils/FilesManager/playlist';
import AnimulistMenu from '@renderer/components/animulistMenu';
import { updateGenres } from '../home/components/filter';
import { getHomeCache, getHomeSidebarData } from '@renderer/utils/stores/home';
import { setNewActivePage, StartHomeSearch } from '../home';
import EpisodeBox from './components/episodeBox';

interface informationTmpProps {
    anime: AnimeData,
    saveData?: indentityPlayer,
    animulist?: animulistProps
}

function information() {
    const { t } = useI18n()
    const navigate = useNavigate();
    let descriptionRef: HTMLDivElement | undefined
    let animeEpisodeReleasingTime: NodeJS.Timeout | undefined
    let isAOpeningFetching: boolean = false
    let isATrailerFetching: boolean = false

    const config = unwrap(getConfig())

    const [tempData, setTmpData] = createSignal<informationTmpProps>(JSON.parse(localStorage.getItem("informationCache") as string) as any)
    const [currentIDplayer, setCurrentId] = createSignal<string | undefined>(tempData().anime.player_ID)

    const [showWrong, setshowWrong] = createSignal<boolean>(false)
    const [isNeedMore, setNeedMore] = createSignal<boolean>(false)
    const [showImages, setShowImages] = createSignal<boolean>(false)
    const [fetchingAnime, setFetchingAnime] = createSignal<boolean>(false)
    const [moreMiniTitle, setmoreMiniTitle] = createSignal<boolean>(false)
    const [currentPlugin, setCurrentPlugin] = createSignal<string | undefined>(undefined)
    const [secondsLeft, setSecondsLeft] = createSignal<undefined | { left: number, converted: { days: number; hours: number; minutes: number; seconds: number; } | undefined }>(undefined);
    const [contextMenu, setcontextMenu] = createSignal<ContextMenuProps>([])

    const [isInWaitingPlaylist, setiswaitingplaylist] = createSignal<boolean>(false)

    const [buttonGroups, setButtonGroups] = createSignal<{ value: string; onClick: () => void; }[]>([])

    // Openings / Endings
    const [animeMedia, setAnimeMedia] = createSignal<animeOpeningsFormat[]>([])
    const [currentMedia, setCurrentAnimeMedia] = createSignal<MiniPlayerProps[] | undefined>(undefined)
    const [currentAudio, setCurrentAudio] = createSignal<animeOpeningsFormat[] | undefined>(undefined)

    // Banner
    const [isBannerLoading, setBannerLoadingData] = createSignal<boolean>(true)
    const [isBannerError, setBannerIsError] = createSignal<boolean>(false)
    // Cover
    const [isCoverLoading, setCoverIsLoading] = createSignal<boolean>(true)
    const [isCoverError, setCoverIsError] = createSignal<boolean>(false)

    // Content Managment
    const [isContentLoading, setContentLoading] = createSignal<boolean>(true)
    const [isContentError, setContentError] = createSignal<boolean>(false)
    const [isContentNoData, setContentNoData] = createSignal<string | undefined>(undefined)

    const [youCanleave, setYouCanLeave] = createSignal<boolean>(false)

    // Content yt-dlp
    const [contentyt_dlp, setContentYT_DLP] = createSignal<MiniPlayerProps[]>([])

    const [activePage, SetactivePage] = createSignal<string>("Episodes")

    const episodeResponse = useResponse({
        queryKey: [tempData()["anime"], currentIDplayer(), currentPlugin()],
        queryFn: async (queryKey) => {
            const [_, player_id, pluginName] = queryKey;
            if (tempData().anime.format == "MANGA" || tempData().anime.format == "NOVEL" || tempData().anime.format == "ONE_SHOT") return
            if (tempData().anime.status?.toUpperCase().replaceAll(" ", "_") == "NOT_YET_RELEASED" || tempData().anime.type != "ANIME") return
            // if (tempData().anime.id == "" && !player_id) return setEpisodeResponse(await plugin.extractEpisodeList(tempData().anime, undefined)) deprecated

            let plugin = await pluginManager().changePlugin(pluginName as string)
            if (!plugin) return
            let response = await plugin.extractEpisodeList(tempData().anime, player_id as string)
            return response
        },
        cacheTime: 7200000,
        disable: true,
    })

    function checkIsAnimeReleasing() {
        if (!tempData().anime.nextAiringEpisode) return
        if (animeEpisodeReleasingTime) clearInterval(animeEpisodeReleasingTime)
        setSecondsLeft({
            left: tempData().anime.nextAiringEpisode!.timeUntilAiring,
            converted: convertSeconds(tempData().anime.nextAiringEpisode!.timeUntilAiring)
        })

        animeEpisodeReleasingTime = setInterval(() => {
            setSecondsLeft(prev => {
                if (!prev) return undefined
                if (prev.left <= 1) {
                    clearInterval(animeEpisodeReleasingTime);
                    if (tempData().anime.status == "RELEASING") FetchAnimeForinformation()
                    return { left: 0, converted: convertSeconds(0) };
                }
                return { left: prev.left - 1, converted: convertSeconds(prev.left - 1) };
            });
        }, 1000);
    }

    function generateAnimeForContextMenu() {
        const config = unwrap(getConfig())

        setcontextMenu([
            {
                option: t("information.copylink"),
                onClick: async () => await SaveToClipboard("text", `${config.deepLinkURL}/?anime=${btoa(`${tempData().anime.id}`)}`)
            }
        ])
    }

    async function checkAnimeFetching() {
        if (tempData().anime.id == "") return

        if (tempData().anime["nextAiringEpisode"]) return

        const lastTime = tempData().saveData?.lastAnimeDataUpdate

        if (tempData().anime.status == "RELEASING" || !lastTime || calculateDays(lastTime, dateToUnix(new Date().toString())) >= 1 || config.information.alwaysUpdateAnime) {
            await FetchAnimeForinformation()
            const tmpData = unwrap(tempData())
            const tmpUpdate = {
                ...unwrap(tempData()),
                saveData: {
                    ...unwrap(tempData().saveData),
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

            localStorage.setItem("informationCache", JSON.stringify({
                ...unwrap(tempData()),
                anime: {
                    ...tmpData.anime,
                    recommendations: undefined
                },
                saveData: tmpUpdate.saveData
            }))

            await refetchHistory()
        }
    }

    async function initialInformation() {
        changeTitleAnimu(`Animu - ${detectTitleConfig(tempData().anime.title)}`)
        generateAnimeForContextMenu()

        if (config.information.openingininformation) searchAnimeOpenings()

        if (tempData().saveData && tempData().anime.status == "RELEASING") FetchAnimeForinformation()

        readPlaylist("global.waitingplaylist").then((v) => {
            if (v.find((v) => v.anime.AnimeData.id == tempData().anime.id)) setiswaitingplaylist(true)
            else setiswaitingplaylist(false)
        })

        let plugin = pluginManager().currentPlugin
        if (plugin) setCurrentPlugin(plugin.metadata.name)

        if (tempData().anime.nextAiringEpisode) checkIsAnimeReleasing()

        document.querySelectorAll('*').forEach((element: any) => {
            element.tabIndex = -1
        });

        if (descriptionRef && descriptionRef.scrollHeight > descriptionRef.clientHeight) setNeedMore(true)

        let tempHistory = unwrap(getGlobalCache().history)

        let history: cardData[] = []
        if (tempData().anime.id == "") {
            history = tempHistory.filter((anime) => detectTitleConfig(anime.AnimeData.title) == detectTitleConfig(tempData().anime.title))
        } else {
            history = tempHistory.filter((anime) => anime.AnimeData.id == tempData().anime.id)
        }

        if (history.length > 0) {
            let plugin = await pluginManager().changePlugin(history[0].saveData?.pluginName as string)
            if (plugin) if (plugin.metadata.name != history[0].saveData?.pluginName) setCurrentId(undefined)
            console.log(plugin)
            setCurrentPlugin(plugin.metadata.name)

            setTmpData({ ...tempData(), saveData: { ...history[0].saveData, pluginName: unwrap(currentPlugin()) as string } as indentityPlayer })
            localStorage.setItem("informationCache", JSON.stringify({ ...tempData(), saveData: { ...history[0].saveData, pluginName: unwrap(currentPlugin()) as string } as indentityPlayer }))
        }

        if (detectTrailerMusic()) return

        checkAnimeFetching()

        episodeResponse.Refetch([tempData()["anime"]["title"]["romaji"], currentIDplayer(), currentPlugin()])
    }

    function detectTrailerMusic() {
        if (tempData().anime.format == "MUSIC") {
            genereteButtonsGroup()
            setContentLoading(false)
            SetactivePage("Music")
            if (tempData().anime.trailer == undefined) setContentNoData("No Music Found")
            return true
        }

        if (tempData().anime.type != "ANIME" || tempData().anime.status == "NOT_YET_RELEASED") {
            genereteButtonsGroup()
            setContentLoading(false)
            SetactivePage("Trailer")
            if (tempData().anime.trailer == undefined) setContentNoData("No Trailer Found")
            return true
        }
        genereteButtonsGroup()
        return false
    }

    onMount(() => {
        setTimeout(() => { setYouCanLeave(true) }, 500)
        initialInformation()
        if (config["information"]["preloadOpening"]) searchAnimeOpenings(true)
        if (config["information"]["preloadTrailer"] && config["information"]["trailerplayertype"] == "player") 
            getAnimeTrailer(`https://www.youtube.com/watch?v=${tempData()["anime"]["trailer"]?.id}`)
    })

    onCleanup(() => {
        clearInterval(animeEpisodeReleasingTime)
        setTmpData(undefined as any)
        setYouCanLeave(false)
    })

    function enterPlayer(episodes: episodeMetadata[], type: string, episode: string) {
        let tmp = unwrap(tempData())
        let lastTime = 0
        if (tmp.saveData && tmp.saveData.episode.toString() === episode.toString()) lastTime = tmp.saveData.last_Time
        localStorage.setItem("playerCache", JSON.stringify(unwrap({
            data: {
                ...tmp.anime,
                player_ID: currentIDplayer() ? currentIDplayer() : episodeResponse.data()?.player_id
            },
            save: {
                last_Time: lastTime,
                type: type,
                pluginName: getPlayerPLugin()?.metadata.name,
                episode: episode
            },
            episodelist: episodes,
            animulist: tmp.animulist
        })))
        navigate("/player")
    }

    async function FetchAnimeForinformation(): Promise<any> {
        setFetchingAnime(true)
        const resp = await getInformationPlugin().anime(tempData().anime.id)
        if (!resp) return setFetchingAnime(false)
        setFetchingAnime(false)

        const tmpnewFetch: AnimeData = {
            ...resp,
            player_ID: currentIDplayer() ? unwrap(currentIDplayer()) : episodeResponse.data()?.player_id
        }

        setTmpData((prev) => ({ ...prev, anime: tmpnewFetch }))
        updateHistoryData(tempData().anime.id, { AnimeData: tmpnewFetch, saveData: unwrap(tempData().saveData) })
        checkIsAnimeReleasing()
    }

    async function ChangeAnimeInInformation(data: AnimeData): Promise<any> {
        const idToast = toast(t("notification.fetchinganime"), { timer: true, type: "loading" })
        const animulist = unwrap(animulistData())
        let tmpAnimulist
        let resp

        if (data.format == "MANGA" || data.format == "NOVEL" || data.format == "ONE_SHOT") {
            resp = await getInformationPlugin().getManga(data.id)
        } else {
            resp = await getInformationPlugin().anime(data.id)
            tmpAnimulist = animulist.find((v) => v.AnimeData.id == resp["anime"]["id"])?.animulist
        }

        if (!resp) return updateToast(idToast, t("notification.failedanime"), { type: "error", timer: false })
        updateToast(idToast, t("notification.successanime"), { type: "success", timer: false })
        resetContentVariable()
        setmoreMiniTitle(false)
        if (currentPlugin()) await pluginManager().changePlugin(currentPlugin()!)

        // Reseting Recomendation
        setTmpData((prev) => ({ ...prev, anime: { ...prev.anime, recommendations: undefined } }))

        setBannerIsError(false)
        setBannerLoadingData(true)
        setCoverIsLoading(true)
        setCoverIsError(false)

        SetactivePage("Episodes")
        setAnimeMedia([])
        setCurrentAnimeMedia(undefined)

        localStorage.setItem("informationCache", JSON.stringify({ anime: resp, saveData: undefined, animulist: tmpAnimulist }))
        setTmpData({ anime: resp, saveData: undefined, animulist: tmpAnimulist })
        initialInformation()
    }

    async function searchAnimeOpenings(noContentLoading: boolean = false): Promise<any> {
        if (animeMedia().length > 0) return
        if (!noContentLoading) {
            resetContentVariable()
            setContentLoading(true)
        }

        if (isAOpeningFetching && activePage() == "Opening/Ending") {
            resetContentVariable()
            setContentLoading(true)
            return
        }

        const response = await requestAnimeMedia(parseInt(tempData().anime.id))
        setAnimeMedia(response)
        if (response.length <= 0 && !noContentLoading) {
            isAOpeningFetching = false
            setContentLoading(false)
            return setContentNoData("Openings Not Found")
        }

        setCurrentAudio(response)

        setCurrentAnimeMedia(response.map((item) => {
            const firstPartTitle = item.type == "OP" ? "Opening" : "Ending"
            return {
                title: `${firstPartTitle} ${item.musicTitle} ${item.variant ? item.variant : ""}`,
                hostname: `${firstPartTitle} ${item.musicTitle} ${item.variant ? item.variant : ""}`,
                resolution: item.videos.map((item) => ({
                    res: item.resolution.toString(),
                    url: item.url,
                    canBeDownloaded: true
                }))
            } as MiniPlayerProps
        }))

        if (isAOpeningFetching && activePage() == "Opening/Ending") setContentLoading(false)

        isAOpeningFetching = false
        if (!noContentLoading) setContentLoading(false)
    }

    function resetContentVariable() {
        setContentLoading(true)
        setContentError(false)
        setContentNoData(undefined)
    }

    /* IFDEF DEBUG|PROD */
    async function getAnimeTrailer(url: string, noContentLoading = false) {
        try {
            if (config["information"]["trailerplayertype"]) return
            if (!noContentLoading) {
                resetContentVariable()
                setContentLoading(true)
            }

            if (isATrailerFetching && activePage() == "Trailer") {
                resetContentVariable()
                setContentLoading(true)
                return
            }

            let resolutions: resolutionFormat[] = []
            let storyBoard: string | undefined

            const response = await window.api.yt_dlp.run(url)
            console.log(response)
            if (response["url"]) {
                resolutions.push({
                    res: `${response["height"]}`,
                    url: response["url"],
                    reqHeader: response["http_headers"]
                })
            }

            if (response["formats"]) {
                const filtered = response["formats"].filter((v) => !v["container"] && v["protocol"] == "m3u8_native" && v["format_note"] != "storyboard")
                let tmpres = filtered.map((v) => ({
                    url: v["url"],
                    res: `${v["height"]}`,
                    reqHeader: v["http_headers"],
                    hls: true
                }))
                const audio = response["formats"].filter((v) => v["resolution"] == "audio only")
                const mediumAudio = audio.find((v) => v["format_note"] == "medium")
                // tmpres = tmpres.map((v) => ({
                //     ...v,
                //     audioUrl: {
                //         url: mediumAudio ? mediumAudio["url"] : audio[0]["url"]
                //     }
                // }))
                const storyBoardFinded: any[] = response["formats"].filter((v) => v["format_note"] != "storyboard")
                storyBoard = storyBoardFinded.at(-1)["url"]
                console.log(tmpres, audio, mediumAudio, storyBoard)
                tmpres.reverse()
                resolutions = tmpres
            }

            let chapters: playerChapterList[] = []
            if (response["chapters"]) chapters = response["chapters"].map((item) => (
                {
                    start: item["start_time"],
                    end: item["end_time"],
                    type: "other",
                    name: item["title"]
                }))

            let subtitles: playerSubtitlesFormat[] = []
            if (response["automatic_captions"]) {
                for (const key in response["automatic_captions"]) {
                    const value = response["automatic_captions"][key as keyof typeof response["automatic_captions"]];
                    const subFinded = value.find((item) => item["ext"] == "vtt")
                    if (!subFinded) continue
                    subtitles.push({
                        url: subFinded["url"],
                        lang: key,
                        label: subFinded["name"],
                        format: subFinded["ext"]
                    })
                }
            }

            setContentYT_DLP([{
                title: response["fulltitle"],
                hostname: "Youtube",
                listChapters: chapters,
                subtitles: subtitles,
                resolution: resolutions,
                splitHLS: resolutions.length != 1,
                // storyboardVTT: storyBoard
            }])
            isATrailerFetching = false
            setContentLoading(false)
        } catch (error) {
            console.error("Error in getAnimeTrailer", error)
            if (!noContentLoading) {
                setContentLoading(false)
                setContentError(true)
            }

            if (isATrailerFetching && activePage() == "Trailer") {
                setContentLoading(false)
                setContentError(true)
            }
        }
    }
    /* ENDIF */

    function makeButtons(episode: episodeMetadata[], type: string) {
        let tmpSaveData = tempData()
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

    createShortcut(["Escape"], () => {
        if (!location.href.includes("#/info") || !youCanleave()) return

        if (isCustomMenuActive()) return hideCustomMenu()
        if (showWrong()) setshowWrong(() => false)
        else if (showImages()) setShowImages(false)
        else navigate("/")
    })

    async function refreashInformation(name: string, force: boolean = false) {
        setCurrentId(undefined)
        await pluginManager().changePlugin(name)
        setCurrentPlugin(name)
        episodeResponse.Refetch([tempData()["anime"]["title"]["romaji"], currentIDplayer(), currentPlugin()], force)
    }

    createEffect(() => {
        if (activePage() == "Episodes") {
            setContentLoading(episodeResponse.loading())
            setContentError(episodeResponse.error())
            setContentNoData(episodeResponse.data() == undefined ? "global.notFound" : undefined)
        }
    })

    function createMiniTitle(): string {
        let synonyms = tempData().anime.synonyms
        let titles: string[] = []
        if (synonyms) synonyms.forEach((value) => titles.push(value))

        const keys = Object.keys(tempData().anime.title)
        for (let index = 0; index < keys.length; index++) {
            const element = tempData().anime.title[keys[index]]
            if (element) titles.push(element)
        }
        titles = [...new Set(titles)]
        return titles.join(" \u25CF ")
    }

    function genereteButtonsGroup(): any {
        if (tempData().anime.format == "MUSIC") {
            return setButtonGroups([{
                value: 'Music',
                onClick: () => {
                    SetactivePage("Music")
                    if (tempData().anime.trailer == undefined) setContentNoData("No Music Found")
                }
            }])
        }

        if (tempData().anime.type != "ANIME" || tempData().anime.status == "NOT_YET_RELEASED") {
            return setButtonGroups([{
                value: 'Trailer',
                onClick: () => {
                    SetactivePage("Trailer")
                    // /* IFDEF DEBUG|PROD */
                    getAnimeTrailer(`https://www.youtube.com/watch?v=${tempData().anime.trailer?.id}`)
                    // /* ENDIF */
                    if (tempData().anime.trailer == undefined) setContentNoData("No Trailer Found")
                }
            }])
        }


        let tmp = [{
            value: 'Episodes',
            onClick: () => SetactivePage("Episodes")
        }, {
            value: 'Opening/Ending',
            onClick: () => { SetactivePage("Opening/Ending"); searchAnimeOpenings() }
        }]

        if (tempData().anime.trailer) tmp.push({
            value: 'Trailer',
            onClick: () => {
                SetactivePage("Trailer")
                // /* IFDEF DEBUG|PROD */
                getAnimeTrailer(`https://www.youtube.com/watch?v=${tempData().anime.trailer?.id}`)
                // /* ENDIF */
            }
        })
 
        setButtonGroups(tmp)
    }

    async function modifySaveAnimuList(animulist: animulistProps, anime: AnimeData, edit: boolean = false) {
        if (edit) updateDataInAnimulist(anime.id, { AnimeData: anime, animulist }, true)
        else addToAnimuList(animulist, anime, true);

        setTmpData((p) => ({ ...p, animulist: animulist }))

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
            <main class="information" onContextMenu={(event) => OpenContextMenu(CreateContextMenuOptions(contextMenu()), event)}>
                <div class="information-banner">
                    <img class={tempData().anime.bannerImage ? "information-banner-image" : "information-banner-image-blur"}
                        onError={() => setBannerIsError(() => true)}
                        onLoad={() => setBannerLoadingData(() => false)}
                        src={tempData().anime.bannerImage ? tempData().anime.bannerImage : tempData().anime.coverImage ? tempData().anime.coverImage : ""}
                        style={isBannerLoading() ? { display: "none" } : isBannerError() ? { display: "none" } : { animation: "fadeIn 0.3s forwards" }}
                    />
                    <Show when={isBannerLoading() && isBannerError() == false}>
                        <div class="information-banner-image-placeholder"><span class="material-symbols-outlined home-loading-animation icon">progress_activity</span></div>
                    </Show>
                    <Show when={isBannerError() && isBannerLoading() == false}>
                        <div class="information-banner-image-placeholder"><span class="material-symbols-outlined">error</span></div>
                    </Show>
                    <div class="information-fade"></div>
                </div>


                <div class="information-container">

                    <div class="information-top">
                        <div class="information-image-container">
                            {tempData().anime.averageScore && <div class="information-score" style={{ border: `3px solid ${getGradientColor(tempData().anime.averageScore)}` }}>{tempData().anime.averageScore}%</div>}
                            <img class="information-cover" onClick={() => setShowImages(true)} onError={() => setCoverIsError(() => true)} onLoad={() => setCoverIsLoading(() => false)} src={tempData().anime.coverImage ? tempData().anime.coverImage : ""} style={isCoverLoading() ? { display: "none" } : isCoverError() ? { display: "none" } : { animation: "fadeIn 0.3s forwards" }}></img>
                            <Show when={isCoverLoading() && isCoverError() == false}>
                                <div class="information-cover-placeholder"><span class="material-symbols-outlined home-loading-animation icon">progress_activity</span></div>
                            </Show>
                            <Show when={isCoverError() && isCoverLoading() == false}>
                                <div class="information-cover-placeholder"><span class="material-symbols-outlined">error</span></div>
                            </Show>

                            {/* <div class="information-title-small-container">
                                <div class={`information-title-small ${moreMiniTitle() == false ? "click" : ""}`} onclick={() => setmoreMiniTitle(true)}>{createMiniTitle()}</div>
                            </div> */}
                        </div>
                        <div class="information-text-container">
                            <div class="information-title">{detectTitleConfig(tempData().anime.title)}</div>
                            <div class={`information-mini-title ${moreMiniTitle() == false ? "click" : ""}`} onclick={() => setmoreMiniTitle(true)}>{createMiniTitle()}</div>
                            <div class="information-description" ref={descriptionRef}>
                                {decodeHtmlEntities(tempData().anime.description ?? t("information.descriptionnotfound"))}
                            </div>
                            <span class={`information-description-toggle ${isNeedMore() ? "show" : ""}`}
                                onclick={() => descriptionRef?.classList.add("moretext")}
                            >
                                {t("information.more")}
                            </span>
                        </div>
                        <div class="information-bar">
                            <Button titleButton={t("information.bar.anilist")} icon="open_in_new" ButtonClass="information-bar-icon" onClick={() => openUrlFolder(`https://anilist.co/anime/${tempData().anime.id}`)} />
                            {/* <Show when={tempData().anime.trailer && !window.api}>
                                <Button titleButton={t("information.bar.trailer")} icon="theaters" ButtonClass="information-bar-icon" onClick={() => openUrlFolder(`https://www.youtube.com/watch?v=${tempData().anime.trailer?.id}`)} />
                            </Show> */}
                            <Show when={tempData().anime.type == "ANIME"}>
                                <Switch>
                                    <Match when={tempData().animulist == undefined}>
                                        <Button titleButton={"Add To Animulist"} icon="add" ButtonClass="information-bar-icon" onClick={() => showCustomMenu(AnimulistMenu({
                                            anime: unwrap(tempData().anime),
                                            animulist: tempData().animulist,
                                            save: (animulist, anime) => { modifySaveAnimuList(animulist, anime) }
                                        }))} />
                                    </Match>
                                    <Match when={tempData().animulist}>
                                        <Button titleButton={"Edit Anime"} icon="edit" ButtonClass="information-bar-icon" onClick={() => showCustomMenu(AnimulistMenu({
                                            anime: unwrap(tempData().anime),
                                            animulist: tempData().animulist,
                                            save: (animulist, anime) => { modifySaveAnimuList(animulist, anime, true) }
                                        }
                                        ))} />
                                        <Button titleButton={"Remove From Animulist"} icon="delete" ButtonClass="information-bar-icon" onClick={() => {
                                            removeFromAnimulist(tempData().anime.id, true);
                                            setTmpData((p) => ({ ...p, animulist: undefined }))
                                        }} />
                                    </Match>
                                </Switch>
                                <Show when={tempData().anime.nextAiringEpisode && tempData().anime.type == "ANIME"}>
                                    <Switch>
                                        <Match when={!isInWaitingPlaylist()}>
                                            <Button titleButton={"Add To Waiting Playlist"} icon="playlist_add" ButtonClass="information-bar-icon" onClick={async (): Promise<any> => {
                                                const tmp = unwrap(tempData())
                                                const resp = await saveToPlaylist("global.waitingplaylist", {
                                                    anime: {
                                                        AnimeData: {
                                                            ...tmp.anime,
                                                            player_ID: episodeResponse.data() ? episodeResponse.data()?.player_id : unwrap(currentIDplayer())
                                                        },
                                                        saveData: tmp.saveData == undefined ? {
                                                            pluginName: unwrap(getPlayerPLugin())?.metadata.name!,
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
                                                    setiswaitingplaylist(true)
                                                    toast("Succesfully added to waiting playlist", { type: "success" })
                                                }
                                            }} />
                                        </Match>
                                        <Match when={isInWaitingPlaylist()}>
                                            <Button titleButton={"Remove From Waiting Playlist"} icon="playlist_remove" ButtonClass="information-bar-icon" onClick={async (): Promise<any> => {
                                                const tmp = unwrap(tempData())
                                                const resp = await removeInPlaylist("global.waitingplaylist", tmp.anime.id)
                                                if (!resp) return toast("Failed Remove Anime to Waiting Playlist", { type: "error" })
                                                else {
                                                    setiswaitingplaylist(false)
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
                                    <Match when={fetchingAnime() && tempData().anime.status == "RELEASING"}>
                                        <div class="information-info-content loading">
                                            <span class='material-symbols-outlined loading-animation icon'>progress_activity</span>
                                        </div>
                                    </Match>
                                    <Match when={tempData().anime.nextAiringEpisode && secondsLeft() != undefined && secondsLeft()!.left > 0 && !fetchingAnime()}>
                                        <div class="information-info-content">
                                            <div class="information-content-title">
                                                {t("information.airing")}: {tempData().anime.nextAiringEpisode?.episode}
                                            </div>
                                            {`${secondsLeft()?.converted?.days}d ${secondsLeft()?.converted?.hours}h ${secondsLeft()?.converted?.minutes}m ${secondsLeft()?.converted?.seconds}s`}
                                        </div>
                                    </Match>
                                </Switch>

                                <Show when={tempData().anime.format}>
                                    <div class="information-info-content">
                                        <div class="information-content-title">{t("information.format")}</div>
                                        {t(`anime_formats.${tempData().anime.format}`)}
                                    </div>
                                </Show>

                                <Show when={tempData().anime.episodes}>
                                    <div class="information-info-content">
                                        <div class="information-content-title">{t("information.episodes")}</div>
                                        {tempData().anime.episodes}
                                    </div>
                                </Show>

                                <Show when={tempData().anime.duration}>
                                    <div class="information-info-content">
                                        <div class="information-content-title">{t("information.duration")}</div>
                                        {tempData().anime.duration} {t("global.minutes")}
                                    </div>
                                </Show>

                                <Show when={tempData().anime.status}>
                                    <div class="information-info-content">
                                        <div class="information-content-title">{t("information.status")}</div>
                                        {t(`anime_statuses.${tempData().anime.status}`)}
                                    </div>
                                </Show>

                                <Show when={tempData().anime.startDate &&
                                    tempData().anime.startDate?.year != undefined &&
                                    tempData().anime.startDate?.day != undefined &&
                                    tempData().anime.startDate?.month != undefined}>
                                    <div class="information-info-content">
                                        <div class="information-content-title">{t("information.startdate")}</div>
                                        {convertDateToFormattedString(tempData().anime.startDate?.year, tempData().anime.startDate?.month, tempData().anime.startDate?.day, undefined, undefined)}
                                    </div>
                                </Show>

                                <Show when={tempData().anime.endDate &&
                                    tempData().anime.endDate?.year != undefined &&
                                    tempData().anime.endDate?.day != undefined &&
                                    tempData().anime.endDate?.month != undefined}>
                                    <div class="information-info-content">
                                        <div class="information-content-title">{t("information.endate")}</div>
                                        {convertDateToFormattedString(tempData().anime.endDate?.year, tempData().anime.endDate?.month, tempData().anime.endDate?.day, undefined, undefined)}
                                    </div>
                                </Show>

                                <Show when={tempData().anime.season && tempData().anime.seasonYear}>
                                    <div class="information-info-content">
                                        <div class="information-content-title">{t("information.season")}</div>
                                        {t(`anime_seasons.${tempData().anime.season}`)} {tempData().anime.seasonYear}
                                    </div>
                                </Show>

                                <Show when={tempData().anime.source}>
                                    <div class="information-info-content">
                                        <div class="information-content-title">{t("information.source")}</div>
                                        {t(`anime_source.${tempData().anime.source}`)}
                                    </div>
                                </Show>

                            </div>

                            <Show when={tempData().anime.genres}>
                                <div class="information-genres-container">
                                    <span class='information-genre-title'>Genres</span>
                                    <div class="information-genres-container-container">
                                        <For each={tempData().anime.genres}>
                                            {(item) => (
                                                <span onclick={() => {
                                                    if (isCustomMenuActive()) hideCustomMenu()
                                                    if (showWrong()) setshowWrong(() => false)
                                                    if (showImages()) setShowImages(false)

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

                            <Show when={tempData().animulist}>
                                <div class='information-animulist-container'>
                                    <span class='information-animulist-data'>
                                        Status {t(`animulist.status.${tempData().animulist?.status}`)}
                                    </span>&#8226;
                                    <span class='information-animulist-data'>
                                        Added {unixToDateTime(tempData().animulist?.added).split(" ")[0]}
                                    </span>&#8226;
                                    <span class='information-animulist-data'>
                                        Started Watching {unixToDateTime(tempData().animulist?.startWatch).split(" ")[0]}
                                    </span>&#8226;
                                    <span class='information-animulist-data'>
                                        Ended Watch {unixToDateTime(tempData().animulist?.endWatch).split(" ")[0]}
                                    </span>&#8226;
                                    <span class='information-animulist-data'>
                                        Repeat Watch {tempData().animulist?.reapeat}
                                    </span>
                                </div>
                            </Show>

                            <div class="information-episodes">
                                <div class="information-episodes-top-content">
                                    <div class="information-eopsodes-top-left">
                                        <Show when={tempData().anime.type == "ANIME" && tempData().anime.status != "NOT_YET_RELEASED" && tempData().anime.format != "MUSIC"}>
                                            <Button ButtonClass="information-episodes-button" icon="search" onClick={() => setshowWrong(() => true)} />
                                        </Show>
                                        <ButtonGroup selectedValue={activePage()} listValues={buttonGroups()} />
                                    </div>
                                    <div class="information-episodes-space">
                                        <Show when={tempData().anime.type == "ANIME" && tempData().anime.status != "NOT_YET_RELEASED" && tempData().anime.format != "MUSIC"}>
                                            <Dropdown
                                                options={segregatePlugins(refreashInformation)}
                                                disableX
                                                buttonText={currentPlugin()}
                                            />
                                            <Button ButtonClass="information-episodes-button" icon="refresh" onClick={() => refreashInformation(getPlayerPLugin()?.metadata.name as string, true)} />
                                        </Show>
                                    </div>
                                </div>
                                <Show when={!showWrong()}>
                                    <Switch>
                                        <Match when={isContentLoading()}>
                                            <div class="information-loading-container"><span class="material-symbols-outlined information-loading">progress_activity</span></div>
                                        </Match>
                                        <Match when={isContentError()}>
                                            <div class="information-loading-container"><span class="information-error material-symbols-outlined">error</span>{t("information.errors")}</div>
                                        </Match>
                                        <Match when={isContentNoData()}>
                                            <div class="information-loading-container"><span class="information-error material-symbols-outlined">search_off</span>{t(isContentNoData()!)}</div>
                                        </Match>
                                        <Match when={activePage() == "Trailer" || activePage() == "Music"}>
                                            <Switch>
                                                <Match when={contentyt_dlp().length > 0}>
                                                    <MiniPlayer props={unwrap(contentyt_dlp()!)} />
                                                </Match>
                                                <Match when={contentyt_dlp()}>
                                                    <iframe
                                                        height="610px"
                                                        class='information-iframe'
                                                        src={`https://www.youtube.com/embed/${unwrap(tempData()).anime.trailer?.id}`}
                                                        frameborder="0"
                                                        referrerpolicy='strict-origin-when-cross-origin'
                                                        allowfullscreen
                                                    ></iframe>
                                                </Match>
                                            </Switch>
                                        </Match>
                                        <Match when={activePage() == "Opening/Ending"}>
                                            <Show when={currentMedia()}>
                                                <MiniPlayer props={unwrap(currentMedia()!)} />
                                            </Show>
                                        </Match>
                                        <Match when={episodeResponse.data() && activePage() == "Episodes"}>
                                            <For each={episodeResponse.data()?.episodesData} fallback={<div class="information-loading-container"><span class="information-error material-symbols-outlined">error</span>{t("information.errors")}</div>}>
                                                {(episode) => {
                                                    if (episode.episodes.length <= 0) return <></>
                                                    return <Drop
                                                        LeftHeader={<>
                                                            {episode.name ? t(episode.name) : t(`information.types.${episode.type}`)}
                                                            <Show when={episodeResponse.data()!["langugeAvaible"]}>
                                                                <span class='information-avaible-langs-container'>
                                                                    <For each={episodeResponse.data()!["langugeAvaible"]}>
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
                                </Show>
                            </div>

                            <Show when={tempData().anime.relations && tempData().anime.relations!.length > 0}>
                                <div class="information-relation-container">
                                    <For each={tempData().anime.relations}>
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
                            <Show when={tempData().anime.characters && tempData().anime.characters!.length > 0}>
                                <CharacterContainer title={t("information.characters")} cards={tempData().anime.characters!.map((char) => ({
                                    id: char.character.id,
                                    image: char.character.image,
                                    name: char.character.name,
                                    role: t(`information.role.${char.role}`),
                                    onClick: () => openUrlFolder(`https://anilist.co/character/${char.character.id}`)
                                }))} />
                            </Show>

                            <Show when={tempData().anime.characters && tempData().anime.characters!.map((tmp) => tmp.voiceActor).filter((item) => item != undefined).length > 0}>
                                <CharacterContainer title={t("information.actors")} cards={tempData().anime.characters!.map((char) => ({
                                    id: char.voiceActor?.id as string,
                                    image: char.voiceActor?.image as string,
                                    name: char.voiceActor?.name as string,
                                    role: char.character.name,
                                    onClick: () => openUrlFolder(`https://anilist.co/staff/${char.voiceActor ? char.voiceActor.id : ""}`)
                                }))} />
                            </Show>

                            <Switch>
                                <Match when={fetchingAnime()}>
                                    <div class="information-recomendation-loading">
                                        <span class='material-symbols-outlined loading-animation icon'>progress_activity</span>
                                    </div>
                                </Match>
                                <Match when={tempData().anime.recommendations && tempData().anime.recommendations!.length > 0 && !fetchingAnime() && tempData().anime.type == "ANIME"}>
                                    <Container title="information.recomendation" horizontal data={tempData().anime.recommendations!.map((item) => ({
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
            <Show when={showWrong()}>
                <ContainerWrong name={detectTitleConfig(tempData().anime.title)} refetchfunc={(id?: string) => {
                    setshowWrong(false);
                    setCurrentId(id);
                    episodeResponse.Refetch([tempData()["anime"]["title"]["romaji"], id, currentPlugin()])
                }}
                    exitfunc={() => setshowWrong(() => false)}
                />
            </Show>

            <Show when={showImages()}>
                <ImageViewer
                    files={[tempData().anime.coverImage as string, tempData().anime.bannerImage as string].filter((value) => value != null)}
                    disable={() => setShowImages(false)}
                />
            </Show>

            <Show when={currentAudio() && config.information.openingininformation}>
                <OpeningPlayer music={currentAudio()!} />
            </Show>
        </>
    )
}

export default information