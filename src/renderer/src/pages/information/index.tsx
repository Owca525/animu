import Button from '@renderer/components/buttons';
import CharacterCards from './components/characterCard';
import ContainerWrong from './components/containerWrong';
import Drop from './components/drop';
import Dropdown from '@renderer/components/dropDown';
import { AnimeData, episodeList, indentityPlayer, playerPluginFormat } from '@renderer/utils/types';
import {
    convertDateToFormattedString,
    convertSeconds,
    CreateContextMenuOptions,
    decodeHtmlEntities,
    getGradientColor,
    openUrlFolder,
    SaveToClipboard,
    segregatePlugins
    } from '@renderer/utils/functions';
import {
    createSignal,
    For,
    Match,
    onCleanup,
    onMount,
    Show,
    Switch
    } from 'solid-js';
import { createShortcut } from '@solid-primitives/keyboard';
import { getGlobalCache } from '@renderer/utils/stores/global';
import { getPlayerPLugin, pluginManager } from '@renderer/utils/stores/plugins';
import { OpenContextMenu } from '@renderer/utils/context/ContextMenu';
import { t } from 'i18next';
import { toast } from '@renderer/utils/context/ToastNotification';
import { unwrap } from 'solid-js/store';
import { useNavigate } from '@solidjs/router';
import './information.css';

function information() {
    const navigate = useNavigate();
    let descriptionRef: HTMLDivElement | undefined

    const [tempData, setTmpData] = createSignal<{ anime: AnimeData, saveData?: indentityPlayer }>(JSON.parse(localStorage.getItem("informationCache") as string) as any)
    const [currentIDplayer, setCurrentId] = createSignal<string | undefined>(tempData().anime.player_ID)

    const [showWrong, setshowWrong] = createSignal<boolean>(false)
    const [isNeedMore, setNeedMore] = createSignal<boolean>(false)
    const [moreMiniTitle, setmoreMiniTitle] = createSignal<boolean>(false)
    const [currentPlugin, setCurrentPlugin] = createSignal<string | undefined>(tempData().saveData ? tempData().saveData?.pluginName : getPlayerPLugin()?.metadata.name)
    const [secondsLeft, setSecondsLeft] = createSignal<undefined | { left: number, converted: { days: number; hours: number; minutes: number; seconds: number; } | undefined }>(undefined);

    // Banner
    const [isBannerLoading, setBannerLoadingData] = createSignal<boolean>(true)
    const [isBannerError, setBannerIsError] = createSignal<boolean>(false)
    // Cover
    const [isCoverLoading, setCoverIsLoading] = createSignal<boolean>(true)
    const [isCoverError, setCoverIsError] = createSignal<boolean>(false)

    // Episodes
    const [episodeResponse, setEpisodeResponse] = createSignal<episodeList | undefined>(undefined)
    const [isLoadingEpisodes, setisLoadingEpisodes] = createSignal<boolean>(true)
    const [isErrorEpisodes, setisErrorEpisodes] = createSignal<boolean>(false)

    const intervalId = setInterval(() => {
        setSecondsLeft(prev => {
            if (!prev) return undefined
            if (prev.left <= 1) {
                clearInterval(intervalId);
                return { left: 0, converted: convertSeconds(0) };
            }
            return { left: prev.left - 1, converted: convertSeconds(prev.left - 1) };
        });
    }, 1000);

    onMount(() => {
        if (tempData().anime.nextAiringEpisode?.timeUntilAiring)
            setSecondsLeft({ left: tempData().anime.nextAiringEpisode?.timeUntilAiring as number, converted: convertSeconds(tempData().anime.nextAiringEpisode?.timeUntilAiring) })

        document.querySelectorAll('*').forEach((element: any) => {
            element.tabIndex = -1
        });

        if (descriptionRef && descriptionRef.scrollHeight > descriptionRef.clientHeight) {
            setNeedMore(true)
            // descriptionRef.classList.add("moretext")
        }

        if (tempData().anime.id == "") return
        let tempHistory = unwrap(getGlobalCache().history)

        let history = tempHistory.filter((anime) => anime.AnimeData.id == tempData().anime.id)
        if (history.length > 0) {
            setCurrentPlugin(history[0].saveData?.pluginName)
            setTmpData({ ...tempData(), saveData: history[0].saveData })
            localStorage.setItem("informationCache", JSON.stringify({ ...tempData(), saveData: history[0].saveData }))
        }
        fetchEpisodes()
    })

    onCleanup(() => {
        clearInterval(intervalId)
        setTmpData(undefined as any)
    })

    async function fetchEpisodes() {
        try {
            // if (animeData.anime.id == "" && !player_id) return setEpisodeResponse(await plugin.extractEpisodeList(animeData.anime, undefined)) deprecated
            setisLoadingEpisodes(true)
            setisErrorEpisodes(false)
            setEpisodeResponse(undefined)
            let animeData = unwrap(tempData())
            if (animeData.anime.status?.toUpperCase().replaceAll(" ", "_") == "NOT_YET_RELEASED") return { player_id: "", episodesData: [] }

            let player_id = currentIDplayer()
            let plugin: playerPluginFormat = pluginManager().changePlugin(currentPlugin() as string)
            if (!plugin) return
            let response = await plugin.extractEpisodeList(animeData.anime, player_id)
            setEpisodeResponse(response)
            if (!response) {
                setisLoadingEpisodes(false)
                setisErrorEpisodes(true)
            } else {
                setisLoadingEpisodes(false)
            }
            return 
        } catch (error) {
            toast('Error Fetching Episodes', { type: "error" })
            setisLoadingEpisodes(false)
            setisErrorEpisodes(true)
            return
        }
    }

    function enterPlayer(episodes: { ep: string, img?: string, title?: string }[], type: string, episode: string) {
        let tmp = unwrap(tempData())
        let lastTime = 0
        if (tmp.saveData && tmp.saveData.episode.toString() === episode) lastTime = tmp.saveData.last_Time
        localStorage.setItem("playerCache", JSON.stringify(unwrap({
            data: {
                ...tmp.anime,
                player_ID: currentIDplayer() ? currentIDplayer() : episodeResponse()?.player_id
            },
            save: {
                last_Time: lastTime,
                type: type,
                pluginName: getPlayerPLugin()?.metadata.name,
                episode: episode
            },
            episodelist: episodes,
        })))
        navigate("/player")
    }

    async function SaveCoverToClipboard(url: string | undefined) {
        if (!url) return
        if (await SaveToClipboard("image", url)) {
            toast(t("information.notification.coverdone"))
        } else {
            toast(t("information.notification.coverfailed"))
        }
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

    createShortcut(["tab"], () => {
        console.log(tempData())
        console.log(currentIDplayer())
    })

    createShortcut(["Escape"], () => {
        if (showWrong()) setshowWrong(() => false)
        else navigate("/")
    })

    async function refreashInformation(name: string) {
        setCurrentId(undefined)
        pluginManager().changePlugin(name)
        setCurrentPlugin(name)
        fetchEpisodes()
    }

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
        let text = titles.join(" \u25CF ")
        return text.replace(/(\u25CF\s)(?!.*\u25CF\s)/, "")
    }

    return (
        <>
            <main class="information" onContextMenu={(event) => OpenContextMenu(CreateContextMenuOptions(), event)}>
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
                            <img class="information-cover" onClick={() => tempData().anime.coverImage && SaveCoverToClipboard(tempData().anime.coverImage)} onError={() => setCoverIsError(() => true)} onLoad={() => setCoverIsLoading(() => false)} src={tempData().anime.coverImage ? tempData().anime.coverImage : ""} style={isCoverLoading() ? { display: "none" } : isCoverError() ? { display: "none" } : { animation: "fadeIn 0.3s forwards" }}></img>
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
                            <div class="information-title">{tempData().anime.title.romaji}</div>
                            <div class={`information-mini-title ${moreMiniTitle() == false ? "click" : ""}`} onclick={() => setmoreMiniTitle(true)}>{createMiniTitle()}</div>
                            <div class="information-description" ref={descriptionRef}>
                                {decodeHtmlEntities(tempData().anime.description ?? t("information.descriptionnotfound"))}
                            </div>
                            <span class={`information-description-toggle ${isNeedMore() ? "show" : ""}`}
                                onclick={() => descriptionRef?.classList.add("moretext")}
                            >
                                Show More
                            </span>
                        </div>
                        <div class="information-bar">
                            <Button titleButton={t("information.bar.anilist")} icon="open_in_new" ButtonClass="information-bar-icon" onClick={() => openUrlFolder(`https://anilist.co/anime/${tempData().anime.id}`)} />
                            <Show when={tempData().anime.trailer}>
                                <Button titleButton={t("information.bar.trailer")} icon="theaters" ButtonClass="information-bar-icon" onClick={() => openUrlFolder(`https://www.youtube.com/watch?v=${tempData().anime.trailer?.id}`)} />
                            </Show>
                        </div>
                    </div>

                    <div class="information-bottom">

                        <div class="information-info">
                            <Show when={tempData().anime.nextAiringEpisode && tempData().anime.player_ID === undefined}>
                                <div class="information-info-content">
                                    <div class="information-content-title">
                                        {t("information.airing")}: {tempData().anime.nextAiringEpisode?.episode}
                                    </div>
                                    {/* TODO: make better timer */}
                                    {`${secondsLeft()?.converted?.days}d ${secondsLeft()?.converted?.hours}h ${secondsLeft()?.converted?.minutes}m ${secondsLeft()?.converted?.seconds}s`}
                                </div>
                            </Show>

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

                            <div class="information-episodes">
                                <div class="information-episodes-top-content">
                                    <Button ButtonClass="information-episodes-button" icon="search" onClick={() => setshowWrong(() => true)} />
                                    <div class="information-episodes-space">
                                        <Dropdown options={segregatePlugins(refreashInformation)} disableX buttonText={currentPlugin()} />
                                        <Button ButtonClass="information-episodes-button" icon="refresh" onClick={() => refreashInformation(getPlayerPLugin()?.metadata.name as string)} />
                                    </div>
                                </div>
                                <Show when={showWrong() == false}>
                                    <Switch>
                                        <Match when={isLoadingEpisodes()}>
                                            <div class="information-loading-container"><span class="material-symbols-outlined information-loading">progress_activity</span></div>
                                        </Match>
                                        <Match when={isErrorEpisodes()}>
                                            <div class="information-loading-container"><span class="information-error material-symbols-outlined">error</span>{t("information.errors")}</div>
                                        </Match>
                                        <Match when={episodeResponse()}>
                                            <For each={episodeResponse()?.episodesData} fallback={<div class="information-loading-container"><span class="information-error material-symbols-outlined">error</span>{t("information.errors")}</div>}>
                                                {(episode) => {
                                                    if (episode.episodes.length <= 0) return <></>
                                                    return <Drop LeftHeader={episode.name ? episode.name : t(`information.types.${episode.type}`)} RightHeader={t("information.listEpisodes", { number: episode.episodes.length })} content={makeButtons(episode.episodes, episode.type)} />
                                                }}
                                            </For>
                                        </Match>
                                    </Switch>
                                </Show>
                            </div>

                            <Show when={tempData().anime.characters && tempData().anime.characters.length > 0}>
                                <div class="information-characters">
                                    <div class="information-characters-title">
                                        {t("information.characters")}
                                    </div>

                                    <div class="information-characters-container">
                                        <For each={tempData().anime.characters}>
                                            {(character) => (
                                                <CharacterCards
                                                    id={character.character.id}
                                                    image={character.character.image}
                                                    name={character.character.name}
                                                    role={t(`information.role.${character.role.toLowerCase()}`)}
                                                    onClick={() => openUrlFolder(`https://anilist.co/character/${character.character.id}`)}
                                                />
                                            )}
                                        </For>
                                    </div>
                                </div>
                            </Show>

                            <Show when={tempData().anime.characters && tempData().anime.characters.map((tmp) => tmp.voiceActor).filter((item) => item != undefined).length > 0}>
                                <div class="information-characters">
                                    <div class="information-characters-title">
                                        {t("information.characters")}
                                    </div>

                                    <div class="information-characters-container">
                                        <For each={tempData().anime.characters}>
                                            {(character) => (
                                                <CharacterCards
                                                    id={character.voiceActor?.id as string}
                                                    image={character.voiceActor?.image as string}
                                                    name={character.voiceActor?.name as string}
                                                    role={t("information.actor_as", { actor: character.character.name })}
                                                    onClick={() => openUrlFolder(`https://anilist.co/staff/${character.voiceActor ? character.voiceActor.id : ""}`)}
                                                />
                                            )}
                                        </For>
                                    </div>
                                </div>
                            </Show>
                        </div>
                    </div>
                </div>

                <Button icon="arrow_back" ButtonClass="information-exit-button" onClick={() => navigate("/")} />
            </main>
            <Show when={showWrong()}>
                <ContainerWrong name={tempData().anime.title.romaji} refetchfunc={(id?: string) => { setshowWrong(() => false); setCurrentId(id); fetchEpisodes() }} exitfunc={() => setshowWrong(() => false)} />
            </Show>
        </>
    )
}

export default information