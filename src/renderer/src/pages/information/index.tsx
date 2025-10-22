import { useLocation, useNavigate } from "react-router-dom"
import { AnimeData, cardData, indentityPlayer, notificationProps, playerPluginFormat } from "@renderer/utils/GlobalInterface";
import Button from "@renderer/components/buttons";
import "./information.css"
import { convertDateToFormattedString, convertSeconds, CreateContextMenuOptions, decodeHtmlEntities, getGradientColor, segregatePlugins } from "@renderer/utils/functions";
import { useEffect, useRef, useState } from "react";
import { t } from "i18next"
import Drop from "./components/drop";
import ContainerWrong from "./components/containerWrong";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "react-toastify";
import { OpenContextMenu } from "@renderer/utils/context/ContextMenu";
import store from "@renderer/utils/store";
import Dropdown from "@renderer/components/dropDown";
import { ChangePlugin } from "@renderer/utils/pluginApi";
import { useQuery } from "react-query";

function information() {
    const navigate = useNavigate()
    const tempData = useRef<{ anime: AnimeData, saveData?: indentityPlayer }>(useLocation().state)
    const currentIDplayer = useRef<string | undefined>(tempData.current.anime.player_ID)

    const [showWrong, setshowWrong] = useState<boolean>(false)
    const [secondsLeft, setSecondsLeft] = useState<undefined | number>(tempData.current.anime.nextAiringEpisode?.timeUntilAiring);

    const { data: episodeData, isError: isEpisodeError, isFetching: isEpisodeLoading, refetch } = useQuery({
        queryKey: [tempData.current.anime],
        queryFn: async ({ queryKey }) => {
            console.log(tempData.current)
            let plugin: playerPluginFormat = ChangePlugin(tempData.current.saveData ? tempData.current.saveData.pluginName :
                store.getState().plugin.playerPlugin.name
            )
            let [ playerID ] = queryKey
            console.log(playerID, tempData, plugin)
            if (!plugin || !plugin.player) return
            if (tempData.current.anime.id == "" && !currentIDplayer.current) {
                return plugin.player.extractEpisodeList(tempData.current.anime, undefined)
            }
            return plugin.player.extractEpisodeList(tempData.current.anime, currentIDplayer.current)
        },
        refetchOnWindowFocus: false,
        staleTime: 2 * 60 * 60 * 1000,
        cacheTime: 2 * 60 * 60 * 1000
    });

    // Banner
    const [isBannerLoading, setBannerLoadingData] = useState<boolean>(true)
    const [isBannerError, setBannerIsError] = useState<boolean>(false)
    // Cover
    const [isCoverLoading, setCoverIsLoading] = useState<boolean>(true)
    const [isCoverError, setCoverIsError] = useState<boolean>(false)

    useEffect(() => {
        if (secondsLeft && secondsLeft <= 0) return;
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
    }, [secondsLeft]);

    const time = convertSeconds(secondsLeft)

    useEffect(() => {
        document.querySelectorAll('*').forEach((element: any) => {
            element.tabIndex = -1
        });
        if (tempData.current.anime.id == "") return
        let tempHistory: { continue: cardData[]; history: cardData[]; } = store.getState().global.history

        let continueHistory = tempHistory.continue.filter((anime) => anime.AnimeData.id == tempData.current.anime.id)
        let history = tempHistory.history.filter((anime) => anime.AnimeData.id == tempData.current.anime.id)
        if (continueHistory.length > 0) {
            tempData.current = { ...tempData.current, saveData: continueHistory[0].saveData }
            return
        }
        if (history.length > 0) {
            tempData.current = { ...tempData.current, saveData: history[0].saveData }
        }
    }, [])

    function enterPlayer(episodes: { ep: string, img?: string, title?: string }[], type: string, episode: string) {
        navigate("/player", {
            state: {
                data: {
                    AnimeData: {
                        ...tempData.current.anime,
                        player_ID: episodeData?.player_id
                    },
                    saveData: {
                        last_Time: tempData.current.saveData && tempData.current.saveData.episode.toString() === episode ? tempData.current.saveData.last_Time : 0,
                        type: type,
                        player_ID: tempData.current.anime.player_ID,
                        episode: episode
                    }
                },
                episodelist: episodes,
                pluginName: store.getState().plugin.playerPlugin.name
            }
        })
    }

    async function SaveCoverToClipboard(url: string | null) {
        if (!url) return
        if (await window.api.saveToClipboard("image", url)) {
            toast.success(t("information.notification.coverdone"), notificationProps)
        } else {
            toast.error(t("information.notification.coverfailed"), notificationProps)
        }
    }

    function makeButtons(episode: { ep: string, img?: string, title?: string }[], type: string) {
        return (
            <div className='information-buttons-episode-container'>
                {episode.map((data) => (
                    <div className={`information-episode-button ${tempData.current.saveData && parseInt(data.ep) < parseInt(tempData.current.saveData.episode) ? "watched" : ""} ${tempData.current.saveData && parseInt(data.ep) == parseInt(tempData.current.saveData.episode) && tempData.current.saveData.last_Time != 0 ? "watching" : tempData.current.saveData && parseInt(data.ep) == parseInt(tempData.current.saveData.episode) ? "watched" : ""}`} onClick={() => enterPlayer(episode, type, data.ep)}>{data.ep}</div>
                ))}
            </div>
        )
    }

    useHotkeys("tab", () => {
        console.log(tempData.current)
        console.log(currentIDplayer.current)
        console.log(episodeData, isEpisodeError, isEpisodeLoading)
    })

    useHotkeys("esc", () => {
        if (showWrong) setshowWrong(() => false)
        else navigate("/")
    })

    async function refreashInformation(name: string) {
        ChangePlugin(name)
        refetch()
    }

    function checkEpisodes() {
        if (tempData.current.anime.status == "NOT_YET_RELEASED") return true
        if (isEpisodeLoading) return false
        if (!episodeData && !isEpisodeLoading && !isEpisodeError) return true
        if (episodeData && episodeData.episodesData && episodeData.episodesData.length <= 0) return true
        return false
    }

    return (
        <>
            <main className="information" onContextMenu={(event) => OpenContextMenu(CreateContextMenuOptions(), event)}>
                <div className="information-banner">
                    <img className={tempData.current.anime.bannerImage ? "information-banner-image" : "information-banner-image-blur"} onError={() => setBannerIsError(() => true)} onLoad={() => setBannerLoadingData(() => false)} src={tempData.current.anime.bannerImage ? tempData.current.anime.bannerImage : tempData.current.anime.coverImage ? tempData.current.anime.coverImage : ""} style={isBannerLoading ? { display: "none" } : isBannerError ? { display: "none" } : { animation: "fadeIn 0.3s forwards" }} />
                    {isBannerLoading && isBannerError == false && <div className="information-banner-image-placeholder"><span className="material-symbols-outlined home-loading-animation">progress_activity</span></div>}
                    {isBannerError && isBannerLoading == false && <div className="information-banner-image-placeholder"><span className="material-symbols-outlined">error</span></div>}
                    <div className="information-fade"></div>
                </div>


                <div className="information-container">

                    <div className="information-top">
                        <div className="information-image-container">
                            {tempData.current.anime.averageScore && <div className="information-score" style={{ border: `3px solid ${getGradientColor(tempData.current.anime.averageScore)}` }}>{tempData.current.anime.averageScore}%</div>}
                            <img className="information-cover" onClick={() => tempData.current.anime.coverImage && SaveCoverToClipboard(tempData.current.anime.coverImage)} onError={() => setCoverIsError(() => true)} onLoad={() => setCoverIsLoading(() => false)} src={tempData.current.anime.coverImage ? tempData.current.anime.coverImage : ""} style={isCoverLoading ? { display: "none" } : isCoverError ? { display: "none" } : { animation: "fadeIn 0.3s forwards" }}></img>
                            {isCoverLoading && isCoverError == false && <div className="information-cover-placeholder"><span className="material-symbols-outlined home-loading-animation">progress_activity</span></div>}
                            {isCoverError && isCoverLoading == false && <div className="information-cover-placeholder"><span className="material-symbols-outlined">error</span></div>}

                            <div className="information-title-small-container">
                                <div className="information-title-small">{tempData.current.anime.title.romaji}</div>
                                <div className="information-title-small2">{tempData.current.anime.title.english ? tempData.current.anime.title.english : tempData.current.anime.title.native}</div>
                            </div>
                        </div>
                        <div className="information-description">
                            <div className="information-title">{tempData.current.anime.title.romaji}</div>
                            <div className="information-title2">{tempData.current.anime.title.english ? tempData.current.anime.title.english : tempData.current.anime.title.native}</div>
                            {decodeHtmlEntities(tempData.current.anime.description ? tempData.current.anime.description : t("information.descriptionnotfound"))}
                        </div>
                        <div className="information-bar">
                            <Button titleButton={t("information.bar.anilist")} icon="open_in_new" ButtonClass="information-bar-icon" onClick={() => window.api.open(`https://anilist.co/anime/${tempData.current.anime.id}`)} />
                            {tempData.current.anime.trailer && tempData.current.anime.trailer.site == "youtube" && <Button titleButton={t("information.bar.trailer")} icon="theaters" ButtonClass="information-bar-icon" onClick={() => window.api.open(`https://www.youtube.com/watch?v=${tempData.current.anime.trailer?.id}`)} />}
                        </div>
                    </div>

                    <div className="information-bottom">

                        <div className="information-info">

                            {tempData.current.anime.nextAiringEpisode && tempData.current.anime.player_ID == undefined &&
                                <div className="information-info-content">
                                    <div className="information-content-title">{t("information.airing")}: {tempData.current.anime.nextAiringEpisode.episode}</div>
                                    {`${time?.days}d ${time?.hours}h ${time?.minutes}m ${time?.seconds}s`}
                                </div>
                            }

                            {tempData.current.anime.format &&
                                <div className="information-info-content">
                                    <div className="information-content-title">{t("information.format")}</div>
                                    {t(`anime_formats.${tempData.current.anime.format.toLowerCase()}`)}
                                </div>
                            }

                            {tempData.current.anime.episodes &&
                                <div className="information-info-content">
                                    <div className="information-content-title">{t("information.episodes")}</div>
                                    {tempData.current.anime.episodes}
                                </div>
                            }

                            {tempData.current.anime.duration &&
                                <div className="information-info-content">
                                    <div className="information-content-title">{t("information.duration")}</div>
                                    {tempData.current.anime.duration} {t("global.minutes")}
                                </div>
                            }

                            {tempData.current.anime.status &&
                                <div className="information-info-content">
                                    <div className="information-content-title">{t("information.status")}</div>
                                    {t(`anime_statuses.${tempData.current.anime.status.toLowerCase()}`)}
                                </div>
                            }

                            {tempData.current.anime.startDate && (tempData.current.anime.startDate.year != undefined && tempData.current.anime.startDate.day != undefined && tempData.current.anime.startDate.month != undefined) &&
                                <div className="information-info-content">
                                    <div className="information-content-title">{t("information.startdate")}</div>
                                    {convertDateToFormattedString(tempData.current.anime.startDate.year, tempData.current.anime.startDate.month, tempData.current.anime.startDate.day, undefined, undefined)}
                                </div>
                            }

                            {tempData.current.anime.endDate && (tempData.current.anime.endDate.year != undefined && tempData.current.anime.endDate.day != undefined && tempData.current.anime.endDate.month != undefined) &&
                                <div className="information-info-content">
                                    <div className="information-content-title">{t("information.endate")}</div>
                                    {convertDateToFormattedString(tempData.current.anime.endDate.year, tempData.current.anime.endDate.month, tempData.current.anime.endDate.day, undefined, undefined)}
                                </div>
                            }

                            {tempData.current.anime.season && tempData.current.anime.seasonYear &&
                                <div className="information-info-content">
                                    <div className="information-content-title">{t("information.season")}</div>
                                    {t(`anime_seasons.${tempData.current.anime.season.toLowerCase()}`)} {tempData.current.anime.seasonYear}
                                </div>
                            }

                            {tempData.current.anime.source &&
                                <div className="information-info-content">
                                    <div className="information-content-title">{t("information.source")}</div>
                                    {t(`anime_source.${tempData.current.anime.source.toLowerCase().replaceAll("_", "")}`)}
                                </div>
                            }

                        </div>


                        <div className="information-bottom-content">

                            <div className="information-episodes">
                                <div className="information-episodes-top-content">
                                    <Button ButtonClass="information-episodes-button" icon="search" onClick={() => setshowWrong(() => true)} />
                                    <div className="information-episodes-space">
                                        <Dropdown options={segregatePlugins(refreashInformation)} disableX buttonText={store.getState().plugin.playerPlugin.name} />
                                        <Button ButtonClass="information-episodes-button" icon="refresh" onClick={() => refreashInformation(store.getState().plugin.playerPlugin.name)} />
                                    </div>
                                </div>
                                {showWrong == false &&
                                    <>
                                        {isEpisodeLoading == false && isEpisodeError == false && episodeData && episodeData.episodesData && episodeData.episodesData.length > 0 && tempData.current.anime.status?.toUpperCase().replaceAll(" ", "_") != "NOT_YET_RELEASED" && (
                                            <>
                                                {episodeData.episodesData.map((episode) => episode.episodes.length > 0 ? (
                                                    <Drop LeftHeader={episode.name ? episode.name : t(`information.types.${episode.type}`)} RightHeader={t("information.listEpisodes", { number: episode.episodes.length })} content={makeButtons(episode.episodes, episode.type)} />
                                                ) : "")}
                                            </>
                                        )}
                                        {isEpisodeLoading && tempData.current.anime.status?.toUpperCase().replaceAll(" ", "_") != "NOT_YET_RELEASED" && <div className="information-loading-container"><span className="information-loading material-symbols-outlined">progress_activity</span></div>}
                                        {isEpisodeError && isEpisodeLoading == false && <div className="information-loading-container"><span className="information-error material-symbols-outlined">error</span>{t("information.errors")}</div>}
                                        {checkEpisodes() && <div className="information-loading-container"><span className="information-error material-symbols-outlined">error</span>{t("information.errors")}</div>}
                                    </>}
                            </div>


                            {tempData.current.anime.characters && tempData.current.anime.characters.length > 0 &&
                                <div className="information-characters">
                                    <div className="information-characters-title">
                                        {t("information.characters")}
                                    </div>

                                    <div className="information-characters-container">
                                        {tempData.current.anime.characters.map((character) =>
                                            <div className="information-characters-card" onClick={() => window.api.open(`https://anilist.co/character/${character.character.id}`)}>
                                                <img className="information-characters-card-cover" src={character.character.image}></img>
                                                <div className="information-characters-card-description">
                                                    <span className="information-character-name">{character.character.name}</span>
                                                    <span className="information-character-role">{t(`information.role.${character.role.toLowerCase()}`)}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            }

                            {tempData.current.anime.characters && tempData.current.anime.characters.map((tmp) => tmp.voiceActor).filter((item) => item != undefined).length > 0 &&
                                <div className="information-characters">
                                    <div className="information-characters-title">
                                        {t("information.actors")}
                                    </div>

                                    <div className="information-characters-container">
                                        {tempData.current.anime.characters.map((character) => (character.voiceActor != undefined &&
                                            <div className="information-characters-card" onClick={() => window.api.open(`https://anilist.co/staff/${character.voiceActor ? character.voiceActor.id : ""}`)}>
                                                <img className="information-characters-card-cover" src={character.voiceActor.image}></img>
                                                <div className="information-characters-card-description">
                                                    <span className="information-character-name">{character.voiceActor.name}</span>
                                                    <span className="information-character-role">{t("information.actor_as", { actor: character.character.name })}</span>
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
            {showWrong && <ContainerWrong name={tempData.current.anime.title.romaji} refetchfunc={(id?: string) => {setshowWrong(() => false);currentIDplayer.current = id; refetch()}} exitfunc={() => setshowWrong(() => false)} />}
        </>
    )
}

export default information