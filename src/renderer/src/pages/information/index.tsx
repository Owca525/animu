import { AnimeData, cardData, indentityPlayer, playerPluginFormat } from "@renderer/utils/types";
import Button from "@renderer/components/buttons";
import "./information.css"
import { convertDateToFormattedString, convertSeconds, CreateContextMenuOptions, decodeHtmlEntities, getGradientColor, segregatePlugins } from "@renderer/utils/functions";
import { t } from "i18next"
import Drop from "./components/drop";
import ContainerWrong from "./components/containerWrong";
import { OpenContextMenu } from "@renderer/utils/context/ContextMenu";
import Dropdown from "@renderer/components/dropDown";
import { ChangePlugin } from "@renderer/utils/pluginApi";
import { useQuery, useQueryClient } from "@tanstack/solid-query";
import { useLocation, useNavigate } from "@solidjs/router";
import { createEffect, createSignal, For, onMount, Show } from "solid-js";
import { getGlobalCache } from "@renderer/utils/stores/global";
import { getPlayerPLugin } from "@renderer/utils/stores/plugins";
import toast from "solid-toast";

function information() {
    const navigate = useNavigate()
    const location = useLocation<{ anime: AnimeData; saveData?: indentityPlayer }>();
    const [tempData, setTmpData] = createSignal<{ anime: AnimeData, saveData?: indentityPlayer }>(location.state as any)
    const [currentIDplayer, setCurrentId] = createSignal<string | undefined>(tempData().anime.player_ID)

    const [showWrong, setshowWrong] = createSignal<boolean>(false)
    const [currentPlugin, setCurrentPlugin] = createSignal<string | undefined>(getPlayerPLugin()?.name)
    const [secondsLeft, setSecondsLeft] = createSignal<undefined | number>(tempData().anime.nextAiringEpisode?.timeUntilAiring);

    const queryClient = useQueryClient()
    const episodeResponse = useQuery(() => ({
        queryKey: [tempData().anime],
        queryFn: async ({ queryKey }) => {
            console.log(tempData())
            let tmp = currentPlugin()
            if (!tmp) return

            let plugin: playerPluginFormat = ChangePlugin(tmp)
            let [playerID] = queryKey
            console.log(playerID, tempData(), plugin)
            if (!plugin || !plugin.player) return
            if (!tempData().saveData?.pluginName && !currentIDplayer()) {
                return plugin.player.extractEpisodeList(tempData().anime, undefined)
            }
            if (tempData().anime.id == "" && !currentIDplayer()) {
                return plugin.player.extractEpisodeList(tempData().anime, undefined)
            }
            return plugin.player.extractEpisodeList(tempData().anime, currentIDplayer())
        },
        refetchOnWindowFocus: false,
        staleTime: 2 * 60 * 60 * 1000,
        cacheTime: 2 * 60 * 60 * 1000
    }))

    // Banner
    const [isBannerLoading, setBannerLoadingData] = createSignal<boolean>(true)
    const [isBannerError, setBannerIsError] = createSignal<boolean>(false)
    // Cover
    const [isCoverLoading, setCoverIsLoading] = createSignal<boolean>(true)
    const [isCoverError, setCoverIsError] = createSignal<boolean>(false)

    createEffect(() => {
        let seconds = secondsLeft()
        if (seconds && seconds <= 0) return;
        const intervalId = setInterval(() => {
            setSecondsLeft(prev => {
                if (!prev) return undefined
                if (prev <= 1) {
                    clearInterval(intervalId);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(intervalId);
    });

    const time = convertSeconds(secondsLeft())

    onMount(() => {
        document.querySelectorAll('*').forEach((element: any) => {
            element.tabIndex = -1
        });
        if (tempData().anime.id == "") return
        let tempHistory: { continue: cardData[]; history: cardData[]; } = getGlobalCache().history

        let continueHistory = tempHistory.continue.filter((anime) => anime.AnimeData.id == tempData().anime.id)
        let history = tempHistory.history.filter((anime) => anime.AnimeData.id == tempData().anime.id)
        if (continueHistory.length > 0) {
            setCurrentPlugin(continueHistory[0].saveData?.pluginName)
            setTmpData({ ...tempData(), saveData: continueHistory[0].saveData })
            return
        }
        if (history.length > 0) {
            setCurrentPlugin(history[0].saveData?.pluginName)
            setTmpData({ ...tempData(), saveData: history[0].saveData })
        }
    })

    function enterPlayer(episodes: { ep: string, img?: string, title?: string }[], type: string, episode: string) {
        let tmp = tempData()
        if (!tmp.saveData) return
        navigate("/player", {
            state: {
                data: {
                    ...tempData().anime,
                    player_ID: currentIDplayer()
                },
                save: {
                    last_Time: tmp.saveData.episode.toString() === episode ? tmp.saveData.last_Time : 0,
                    type: type,
                    pluginName: currentPlugin(),
                    episode: episode
                },
                episodelist: episodes,
            }
        })
    }

    async function SaveCoverToClipboard(url: string | undefined) {
        if (!url) return
        if (await window.api.saveToClipboard("image", url)) {
            toast.success(t("information.notification.coverdone"))
        } else {
            toast.error(t("information.notification.coverfailed"))
        }
    }

    function makeButtons(episode: { ep: string, img?: string, title?: string }[], type: string) {
        return (
            <div class="information-buttons-episode-container">
                <For each={episode}>
                    {(data) => {
                        const saveData = tempData()?.saveData;
                        const epNum = parseInt(data.ep);
                        const savedEp = parseInt(saveData?.episode ?? "0");
                        const isWatched = saveData && epNum < savedEp;
                        const isWatching = saveData && epNum === savedEp && saveData.last_Time !== 0;
                        const isWatchedEqual = saveData && epNum === savedEp && saveData.last_Time === 0;

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

    // useHotkeys("tab", () => {
    //     console.log(tempData())
    //     console.log(currentIDplayer.current)
    //     console.log(episodeData, isEpisodeError, episodeData.isLoading)
    // })

    // useHotkeys("esc", () => {
    //     if (showWrong) setshowWrong(() => false)
    //     else navigate("/")
    // })

    async function refreashInformation(name: string) {
        queryClient.cancelQueries()
        ChangePlugin(name)
        setCurrentPlugin(name)
        episodeResponse.refetch()
    }

    function checkEpisodes() {
        if (tempData().anime.status == "NOT_YET_RELEASED") return true
        if (episodeResponse.isLoading) return false
        if (!episodeResponse.data && !episodeResponse.isLoading && !episodeResponse.isError) return true
        if (episodeResponse.data && episodeResponse.data.episodesData.length <= 0) return true
        return false
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
                        <div class="information-banner-image-placeholder"><span class="material-symbols-outlined home-loading-animation">progress_activity</span></div>
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
                                <div class="information-cover-placeholder"><span class="material-symbols-outlined home-loading-animation">progress_activity</span></div>
                            </Show>
                            <Show when={isCoverError() && isCoverLoading() == false}>
                                <div class="information-cover-placeholder"><span class="material-symbols-outlined">error</span></div>
                            </Show>

                            <div class="information-title-small-container">
                                <div class="information-title-small">{tempData().anime.title.romaji}</div>
                                <div class="information-title-small2">{tempData().anime.title.english ? tempData().anime.title.english : tempData().anime.title.native}</div>
                            </div>
                        </div>
                        <div class="information-description">
                            <div class="information-title">{tempData().anime.title.romaji}</div>
                            <div class="information-title2">{tempData().anime.title.english ? tempData().anime.title.english : tempData().anime.title.native}</div>
                            {decodeHtmlEntities(tempData().anime.description ?? t("information.descriptionnotfound"))}
                        </div>
                        <div class="information-bar">
                            <Button titleButton={t("information.bar.anilist")} icon="open_in_new" ButtonClass="information-bar-icon" onClick={() => window.api.open(`https://anilist.co/anime/${tempData().anime.id}`)} />
                            <Show when={tempData().anime.trailer}>
                                <Button titleButton={t("information.bar.trailer")} icon="theaters" ButtonClass="information-bar-icon" onClick={() => window.api.open(`https://www.youtube.com/watch?v=${tempData().anime.trailer?.id}`)} />
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
                                    {`${time?.days}d ${time?.hours}h ${time?.minutes}m ${time?.seconds}s`}
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
                                        <Dropdown options={segregatePlugins(refreashInformation)} disableX buttonText={getPlayerPLugin()?.name} />
                                        <Button ButtonClass="information-episodes-button" icon="refresh" onClick={() => refreashInformation(currentPlugin()!)} />
                                    </div>
                                </div>
                                <Show when={showWrong() == false}>
                                    <Show when={episodeResponse.isLoading == false && episodeResponse.isError == false && episodeResponse.data && episodeResponse.data.episodesData && episodeResponse.data.episodesData.length > 0 && tempData().anime.status?.toUpperCase().replaceAll(" ", "_") != "NOT_YET_RELEASED"}>
                                        <For each={episodeResponse.data?.episodesData}>
                                            {(episode) => (
                                                <Drop LeftHeader={episode.name ? episode.name : t(`information.types.${episode.type}`)} RightHeader={t("information.listEpisodes", { number: episode.episodes.length })} content={makeButtons(episode.episodes, episode.type)} />
                                            )}
                                        </For>
                                    </Show>

                                    <Show when={episodeResponse.isLoading && tempData().anime.status?.toUpperCase().replaceAll(" ", "_") != "NOT_YET_RELEASED"}>
                                        <div class="information-loading-container"><span class="information-loading material-symbols-outlined">progress_activity</span></div>
                                    </Show>
                                    <Show when={episodeResponse.isError && episodeResponse.isLoading == false}>
                                        <div class="information-loading-container"><span class="information-error material-symbols-outlined">error</span>{t("information.errors")}</div>
                                    </Show>
                                    <Show when={checkEpisodes()}>
                                        <div class="information-loading-container"><span class="information-error material-symbols-outlined">error</span>{t("information.errors")}</div>
                                    </Show>
                                </Show>
                            </div>


                            {tempData().anime.characters && tempData().anime.characters.length > 0 &&
                                <div class="information-characters">
                                    <div class="information-characters-title">
                                        {t("information.characters")}
                                    </div>

                                    <div class="information-characters-container">
                                        {tempData().anime.characters.map((character) =>
                                            <div class="information-characters-card" onClick={() => window.api.open(`https://anilist.co/character/${character.character.id}`)}>
                                                <img class="information-characters-card-cover" src={character.character.image}></img>
                                                <div class="information-characters-card-description">
                                                    <span class="information-character-name">{character.character.name}</span>
                                                    <span class="information-character-role">{t(`information.role.${character.role.toLowerCase()}`)}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            }

                            {tempData().anime.characters && tempData().anime.characters.map((tmp) => tmp.voiceActor).filter((item) => item != undefined).length > 0 &&
                                <div class="information-characters">
                                    <div class="information-characters-title">
                                        {t("information.actors")}
                                    </div>

                                    <div class="information-characters-container">
                                        {tempData().anime.characters.map((character) => (character.voiceActor != undefined &&
                                            <div class="information-characters-card" onClick={() => window.api.open(`https://anilist.co/staff/${character.voiceActor ? character.voiceActor.id : ""}`)}>
                                                <img class="information-characters-card-cover" src={character.voiceActor.image}></img>
                                                <div class="information-characters-card-description">
                                                    <span class="information-character-name">{character.voiceActor.name}</span>
                                                    <span class="information-character-role">{t("information.actor_as", { actor: character.character.name })}</span>
                                                </div>
                                            </div>
                                        )
                                        )}
                                    </div>
                                </div>
                            }
                        </div>
                    </div>
                </div>

                <Button icon="arrow_back" ButtonClass="information-exit-button" onClick={() => navigate("/")} />
            </main>
            {showWrong() && <ContainerWrong name={tempData().anime.title.romaji} refetchfunc={(id?: string) => { setshowWrong(() => false); setCurrentId(id); episodeResponse.refetch() }} exitfunc={() => setshowWrong(() => false)} />}
        </>
    )
}

export default information