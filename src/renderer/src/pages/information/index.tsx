import Button from '@renderer/components/buttons';
import ContainerWrong from './components/containerWrong';
import Drop from './components/drop';
import Dropdown from '@renderer/components/dropDown';
import { AnimeData, animeOpeningsFormat, animulistProps, cardData, ContextMenuProps, indentityPlayer, playerPluginFormat } from '@renderer/utils/types';
import {
    calculateDays,
    changeTitleAnimu,
    convertDateToFormattedString,
    convertSeconds,
    CreateContextMenuOptions,
    dateToUnix,
    decodeHtmlEntities,
    detectTitleConfig,
    getGradientColor,
    openUrlFolder,
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
import { showCustomMenu } from '@renderer/utils/context/menuContext';
import RelationCard from './components/relationCard';
import ButtonGroup from '../settings/components/buttonGroup';
import MiniPlayer from '@renderer/components/miniPlayer';
import { requestAnimeMedia } from '@renderer/utils/animeThemes';
import { updateHistoryData } from '@renderer/utils/FilesManager/history';
import { addToAnimuList, removeFromAnimulist, updateDataInAnimulist } from '@renderer/utils/FilesManager/animulist';

function information() {
    const { t } = useI18n()
    const navigate = useNavigate();
    let descriptionRef: HTMLDivElement | undefined

    const [tempData, setTmpData] = createSignal<{ anime: AnimeData, saveData?: indentityPlayer, animulist?: animulistProps }>(JSON.parse(localStorage.getItem("informationCache") as string) as any)
    const [currentIDplayer, setCurrentId] = createSignal<string | undefined>(tempData().anime.player_ID)

    const [showWrong, setshowWrong] = createSignal<boolean>(false)
    const [isNeedMore, setNeedMore] = createSignal<boolean>(false)
    const [showImages, setShowImages] = createSignal<boolean>(false)
    const [fetchingAnime, setFetchingAnime] = createSignal<boolean>(false)
    const [moreMiniTitle, setmoreMiniTitle] = createSignal<boolean>(false)
    const [currentPlugin, setCurrentPlugin] = createSignal<string | undefined>(undefined)
    const [secondsLeft, setSecondsLeft] = createSignal<undefined | { left: number, converted: { days: number; hours: number; minutes: number; seconds: number; } | undefined }>(undefined);
    const [contextMenu, setcontextMenu] = createSignal<ContextMenuProps>([])

    // Openings / Endings
    const [animeMedia, setAnimeMedia] = createSignal<animeOpeningsFormat[]>([])
    const [currentMedia, setCurrentAnimeMedia] = createSignal<animeOpeningsFormat | undefined>(undefined)

    // Banner
    const [isBannerLoading, setBannerLoadingData] = createSignal<boolean>(true)
    const [isBannerError, setBannerIsError] = createSignal<boolean>(false)
    // Cover
    const [isCoverLoading, setCoverIsLoading] = createSignal<boolean>(true)
    const [isCoverError, setCoverIsError] = createSignal<boolean>(false)

    const [activePage, SetactivePage] = createSignal<string>("Episodes")
    const [showLoadingInEpisodes, SetShowLoadingInEpisodes] = createSignal<boolean>(false)

    const episodeResponse = useResponse({
        queryKey: [tempData(), currentIDplayer(), currentPlugin()],
        queryFn: async (queryKey) => {
            const [animeData, player_id, pluginName] = queryKey;
            if (typeof animeData != "object") return
            if (animeData.anime.format == "MANGA" || animeData.anime.format == "NOVEL" || animeData.anime.format == "ONE_SHOT") return
            if (animeData.anime.status?.toUpperCase().replaceAll(" ", "_") == "NOT_YET_RELEASED" || animeData.anime.type != "ANIME") return
            // if (animeData.anime.id == "" && !player_id) return setEpisodeResponse(await plugin.extractEpisodeList(animeData.anime, undefined)) deprecated

            let plugin: playerPluginFormat = pluginManager().changePlugin(pluginName as string)
            if (!plugin) return
            let response = await plugin.extractEpisodeList(animeData.anime, player_id as string)
            return response
        },
        cacheTime: 7200000,
        disable: true,
    })

    const intervalId = setInterval(() => {
        setSecondsLeft(prev => {
            if (!prev) return undefined
            if (prev.left <= 1) {
                clearInterval(intervalId);
                if (tempData().anime.status == "RELEASING") FetchAnimeForinformation()
                return { left: 0, converted: convertSeconds(0) };
            }
            return { left: prev.left - 1, converted: convertSeconds(prev.left - 1) };
        });
    }, 1000);

    function generateAnimeForContextMenu() {
        const config = unwrap(getConfig())

        setcontextMenu([
            {
                option: t("information.copylink"),
                onClick: async () => await SaveToClipboard("text", `${config.deepLinkURL}/?anime=${btoa(`${tempData().anime.id}`)}`)
            }
        ])
    }

    function checkAnimeFetching() {
        const stopRequestEveryTime = false // TODO: ADD NEW SETTINGS
        if (!tempData().saveData) return
        const tmpsave = unwrap(tempData().saveData)
        if (tempData().anime.status == "RELEASING") {
            setTmpData({
                ...unwrap(tempData()),
                saveData: {
                    ...tmpsave,
                    lastAnimeDataUpdate: dateToUnix(new Date().toString())
                }
            } as any)
            return FetchAnimeForinformation()
        }
        if (stopRequestEveryTime) return

        const lastTime = tempData().saveData?.lastAnimeDataUpdate
        setTmpData({
            ...unwrap(tempData()),
            saveData: {
                ...tmpsave,
                lastAnimeDataUpdate: dateToUnix(new Date().toString())
            }
        } as any)
        if (stopRequestEveryTime && !lastTime || calculateDays(lastTime as number, dateToUnix(new Date().toString())) >= 1) {
            return FetchAnimeForinformation()
        }
        return FetchAnimeForinformation()
    }

    function initialInformation() {
        changeTitleAnimu(`Animu - ${detectTitleConfig(tempData().anime.title)}`)
        generateAnimeForContextMenu()

        checkAnimeFetching()

        if (tempData().saveData && tempData().anime.status == "RELEASING") FetchAnimeForinformation()

        let plugin = pluginManager().currentPlugin
        if (plugin) setCurrentPlugin(plugin.metadata.name)

        if (tempData().anime.nextAiringEpisode?.timeUntilAiring) setSecondsLeft({
            left: tempData().anime.nextAiringEpisode!.timeUntilAiring,
            converted: convertSeconds(tempData().anime.nextAiringEpisode!.timeUntilAiring)
        })

        document.querySelectorAll('*').forEach((element: any) => {
            element.tabIndex = -1
        });

        if (descriptionRef && descriptionRef.scrollHeight > descriptionRef.clientHeight) setNeedMore(true)

        if (tempData().anime.id == "") return
        let tempHistory = unwrap(getGlobalCache().history)

        let history = tempHistory.filter((anime) => anime.AnimeData.id == tempData().anime.id)
        if (history.length > 0) {
            let plugin: playerPluginFormat = pluginManager().changePlugin(history[0].saveData?.pluginName as string)
            if (plugin && plugin.metadata.name != history[0].saveData?.pluginName) setCurrentId(undefined)
            setCurrentPlugin(plugin.metadata.name)

            setTmpData({ ...tempData(), saveData: { ...history[0].saveData, pluginName: unwrap(currentPlugin()) as string } as indentityPlayer })
            localStorage.setItem("informationCache", JSON.stringify({ ...tempData(), saveData: { ...history[0].saveData, pluginName: unwrap(currentPlugin()) as string } as indentityPlayer }))
        }
        episodeResponse.Refetch([tempData(), currentIDplayer(), currentPlugin()])
    }

    onMount(() => { initialInformation() })

    onCleanup(() => {
        clearInterval(intervalId)
        setTmpData(undefined as any)
    })

    function enterPlayer(episodes: { ep: string, img?: string, title?: string }[], type: string, episode: string) {
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
        if (tempData().anime.nextAiringEpisode?.timeUntilAiring) setSecondsLeft({
            left: tempData().anime.nextAiringEpisode!.timeUntilAiring,
            converted: convertSeconds(tempData().anime.nextAiringEpisode!.timeUntilAiring)
        })
    }

    async function ChangeAnimeInInformation(data: AnimeData): Promise<any> {
        const idToast = toast(t("notification.fetchinganime"), { removeTimer: true, type: "loading" })
        const animulist = unwrap(animulistData())
        let tmpAnimulist
        let resp
        if (!data.type && data.format == "MANGA" || data.format == "NOVEL" || data.format == "ONE_SHOT") {
            resp = await getInformationPlugin().getManga(data.id)
        } else if (data.type == "MANGA") {
            resp = await getInformationPlugin().getManga(data.id)
        } else {
            resp = await getInformationPlugin().anime(data.id)
            tmpAnimulist = animulist.find((v) => v.AnimeData.id == tempData().anime.id)?.animulist
        }

        if (!resp) return updateToast(idToast, t("notification.failedanime"), { type: "error", removeTimer: false })
        updateToast(idToast, t("notification.successanime"), { type: "success", removeTimer: false })

        // Reseting Recomendation
        setTmpData((prev) => ({ ...prev, anime: { ...prev.anime, recommendations: undefined } }))

        document.querySelectorAll("*").forEach((ele) => {
            ele.scrollTop = 0
        })

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

    async function searchAnimeOpenings() {
        if (animeMedia().length > 0) return
        SetShowLoadingInEpisodes(true)
        setAnimeMedia(await requestAnimeMedia(parseInt(tempData().anime.id)))
        setCurrentAnimeMedia(animeMedia()[0])
        console.log(animeMedia())
        SetShowLoadingInEpisodes(false)
    }

    function makeButtons(episode: { ep: string, img?: string, title?: string }[], type: string) {
        let tmpSaveData = tempData()
        return (
            <div class="information-buttons-episode-container">
                <For each={episode}>
                    {(data) => {
                        const saveData = tmpSaveData.saveData;
                        const epNum = parseInt(data.ep);
                        const savedEp = parseInt(saveData?.episode ?? "0");
                        const isWatched = saveData && epNum < savedEp;
                        const isWatching = saveData && epNum === savedEp && (saveData.last_Time !== 0 || saveData.isStarted);
                        const isWatchedEqual = saveData && epNum === savedEp && saveData.last_Time === 0 && !saveData.isStarted;

                        return (
                            <div
                                class={`information-episode-button 
                                    ${isWatched ? "watched" : ""} 
                                    ${isWatching ? "watching" : ""} 
                                    ${isWatchedEqual ? "watched" : ""}`
                                }
                                onClick={() => enterPlayer(episode, type, data.ep)}>
                                {data.ep}
                            </div>
                        );
                    }}
                </For>
            </div>
        )
    }

    createShortcut(["Escape"], () => {
        if (showWrong()) setshowWrong(() => false)
        else if (showImages()) setShowImages(false)
        else navigate("/")
    })

    async function refreashInformation(name: string, force: boolean = false) {
        setCurrentId(undefined)
        pluginManager().changePlugin(name)
        setCurrentPlugin(name)
        episodeResponse.Refetch([tempData(), currentIDplayer(), currentPlugin()], force)
    }

    createEffect(() => console.log(currentMedia()))

    // function checkEpisodes() {
    //     if (tempData().anime.status == "NOT_YET_RELEASED") return true
    //     if (episodeResponse.isLoading) return false
    //     if (!episodeResponse.data && !episodeResponse.isLoading && !episodeResponse.isError) return true
    //     if (episodeResponse.data && episodeResponse.data.episodesData.length <= 0) return true
    //     return false
    // }

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
                            <Show when={tempData().anime.trailer}>
                                <Button titleButton={t("information.bar.trailer")} icon="theaters" ButtonClass="information-bar-icon" onClick={() => openUrlFolder(`https://www.youtube.com/watch?v=${tempData().anime.trailer?.id}`)} />
                            </Show>
                            <Show when={tempData().anime.type == "ANIME"}>
                                <Switch>
                                    <Match when={tempData().animulist == undefined}>
                                        <Button titleButton={"Add To Animulist"} icon="add" ButtonClass="information-bar-icon" onClick={() => showCustomMenu({
                                            title: `Add ${detectTitleConfig(tempData().anime.title)}`, animuList: {
                                                anime: unwrap(tempData().anime),
                                                save: (animulist, anime) => { addToAnimuList(animulist, anime, true); setTmpData((p) => ({ ...p, animulist: animulist })) }
                                            }
                                        })} />
                                    </Match>
                                    <Match when={tempData().animulist}>
                                        <Button titleButton={"Edit Anime"} icon="edit" ButtonClass="information-bar-icon" onClick={() => showCustomMenu({
                                            title: `Edit ${detectTitleConfig(tempData().anime.title)}`, animuList: {
                                                anime: unwrap(tempData().anime),
                                                animulist: tempData().animulist,
                                                save: (animulist, anime) => { updateDataInAnimulist(anime.id, { AnimeData: anime, animulist }, true); setTmpData((p) => ({ ...p, animulist: animulist })) }
                                            }
                                        })} />
                                        <Button titleButton={"Remove From Animulist"} icon="delete" ButtonClass="information-bar-icon" onClick={() => {
                                            removeFromAnimulist(tempData().anime.id, true);
                                            setTmpData((p) => ({ ...p, animulist: undefined }))
                                        }} />
                                    </Match>
                                </Switch>
                            </Show>
                        </div>
                    </div>

                    <div class="information-bottom">

                        <div class="information-info">
                            <Switch>
                                <Match when={fetchingAnime() && tempData().anime.status == "RELEASING"}>
                                    <div class="information-info-content loading">
                                        <span class='material-symbols-outlined loading-animation icon'>progress_activity</span>
                                    </div>
                                </Match>
                                <Match when={tempData().anime.nextAiringEpisode && tempData().anime.player_ID === undefined && secondsLeft() != undefined && secondsLeft()!.left > 0 && !fetchingAnime()}>
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
                                    {t(`anime_formats.${tempData().anime.format?.toLowerCase()}`)}
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
                                    {t(`anime_statuses.${tempData().anime.status?.toLowerCase()}`)}
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
                                    {t(`anime_seasons.${tempData().anime.season?.toLowerCase()}`)} {tempData().anime.seasonYear}
                                </div>
                            </Show>

                            <Show when={tempData().anime.source}>
                                <div class="information-info-content">
                                    <div class="information-content-title">{t("information.source")}</div>
                                    {t(`anime_source.${tempData().anime.source?.toLowerCase().replaceAll("_", "")}`)}
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

                            {/* TODO: FIX SCALING AND THEME */}
                            {/* <MiniPlayer player_data={{
                                title: "Frerien Opening",
                                resolutions: [{
                                    res: '1080',
                                    url: ''
                                }]
                            }}/> */}

                            <Show when={tempData().anime.type == "ANIME"}>
                                <div class="information-episodes">
                                    <div class="information-episodes-top-content">
                                        <div class="information-eopsodes-top-left">
                                            <Button ButtonClass="information-episodes-button" icon="search" onClick={() => setshowWrong(() => true)} />
                                            <ButtonGroup selectedValue={activePage()} listValues={[{
                                                value: 'Episodes',
                                                onClick: () => SetactivePage("Episodes")
                                            }, {
                                                value: 'Opening/Ending',
                                                onClick: () => { SetactivePage("Opening/Ending"); searchAnimeOpenings() }
                                            }]} />
                                            {/* {
                                            value: 'Anime Trailer',
                                            onClick: () => SetactivePage("Trailer")
                                        } */}
                                        </div>
                                        <div class="information-episodes-space">
                                            <Dropdown options={segregatePlugins(refreashInformation)} disableX buttonText={currentPlugin()} />
                                            <Button ButtonClass="information-episodes-button" icon="refresh" onClick={() => refreashInformation(getPlayerPLugin()?.metadata.name as string, true)} />
                                        </div>
                                    </div>
                                    <Switch>
                                        <Match when={showLoadingInEpisodes()}>
                                            <div class="information-loading-container"><span class="material-symbols-outlined information-loading">progress_activity</span></div>
                                        </Match>
                                        <Match when={activePage() == "Opening/Ending"}>
                                            <For each={animeMedia()}>
                                                {(item) => <Button content={item.title} onClick={() => { setCurrentAnimeMedia(undefined); setCurrentAnimeMedia(item) }} />}
                                            </For>
                                            <Show when={currentMedia()}>
                                                <MiniPlayer player_data={{
                                                    title: currentMedia()?.title!,
                                                    resolutions: [{
                                                        res: currentMedia()?.resolution!.toString()!,
                                                        url: currentMedia()?.url!
                                                    }]
                                                }} />
                                            </Show>
                                        </Match>
                                        <Match when={showWrong() == false && activePage() == "Episodes"}>
                                            <Switch>
                                                <Match when={episodeResponse.loading()}>
                                                    <div class="information-loading-container"><span class="material-symbols-outlined information-loading">progress_activity</span></div>
                                                </Match>
                                                <Match when={episodeResponse.error()}>
                                                    <div class="information-loading-container"><span class="information-error material-symbols-outlined">error</span>{t("information.errors")}</div>
                                                </Match>
                                                <Match when={episodeResponse.data() == undefined}>
                                                    <div class="information-loading-container"><span class="information-error material-symbols-outlined">search_off</span>{t("global.notFound")}</div>
                                                </Match>
                                                <Match when={episodeResponse.data()}>
                                                    <For each={episodeResponse.data()?.episodesData} fallback={<div class="information-loading-container"><span class="information-error material-symbols-outlined">error</span>{t("information.errors")}</div>}>
                                                        {(episode) => {
                                                            if (episode.episodes.length <= 0) return <></>
                                                            return <Drop LeftHeader={episode.name ? episode.name : t(`information.types.${episode.type}`)} RightHeader={t("information.listEpisodes", { number: episode.episodes.length })} content={makeButtons(episode.episodes, episode.type)} />
                                                        }}
                                                    </For>
                                                </Match>
                                            </Switch>
                                        </Match>
                                    </Switch>
                                </div>
                            </Show>

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
                                    role: t(`information.role.${char.role.toLowerCase()}`),
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
                                <Match when={tempData().anime.recommendations && tempData().anime.recommendations!.length > 0 && !fetchingAnime()}>
                                    <Container title="information.recomendation" horizontal data={tempData().anime.recommendations!.map((item) => ({
                                        AnimeData: {
                                            title: item.title,
                                            bannerImage: item.bannerImage,
                                            coverImage: item.coverImage,
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
                        episodeResponse.Refetch([tempData(), id, currentPlugin()]) 
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
        </>
    )
}

export default information