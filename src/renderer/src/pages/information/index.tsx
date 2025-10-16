import { useLocation, useNavigate } from "react-router-dom"
import { AnimeData, indentityPlayer, notificationProps, playerPluginFormat } from "@renderer/utils/GlobalInterface";
import Button from "@renderer/components/buttons";
import "./information.css"
import { convertDateToFormattedString, convertSeconds, CreateContextMenuOptions, decodeHtmlEntities, getGradientColor, segregatePlugins } from "@renderer/utils/functions";
import { useEffect, useState } from "react";
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
    const tempData: { anime: AnimeData, saveData?: indentityPlayer } = useLocation().state;

    const [showWrong, setshowWrong] = useState<boolean>(false)
    const [secondsLeft, setSecondsLeft] = useState<undefined | number>(tempData.anime.nextAiringEpisode?.timeUntilAiring);
    const [currentIDplayer, setCurrentIDplayer] = useState<string | undefined>(tempData.anime.player_ID)

    const { data: episodeData, isError: isEpisodeError, isFetching: isEpisodeLoading, refetch } = useQuery({
        queryKey: [tempData.anime],
        queryFn: async ({ queryKey }) => {
            let plugin: playerPluginFormat = store.getState().plugin.playerPlugin
            let [ playerID ] = queryKey
            if (!plugin || !plugin.player) return
            if (tempData.anime.id == "" && !currentIDplayer) {
                return plugin.player.extractEpisodeList(tempData.anime, undefined)
            }
            if (tempData.saveData && tempData.saveData.pluginName == plugin.name && !currentIDplayer) {
                return plugin.player.extractEpisodeList(playerID.player_ID ? undefined : tempData.anime, playerID.player_ID)
            }
            ChangePlugin(plugin.name)
            return plugin.player.extractEpisodeList(tempData.anime, currentIDplayer)
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
    }, [])

    function enterPlayer(episodes: { ep: string, img?: string, title?: string }[], type: string, episode: string) {
        navigate("/player", {
            state: {
                data: {
                    AnimeData: {
                        ...tempData.anime,
                        player_ID: episodeData?.player_id
                    },
                    saveData: {
                        last_Time: tempData.saveData && tempData.saveData.episode.toString() === episode ? tempData.saveData.last_Time : 0,
                        type: type,
                        player_ID: tempData.anime.player_ID,
                        episode: episode
                    }
                },
                episodelist: episodes
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
                    <div className={`information-episode-button ${tempData.saveData && parseInt(data.ep) < parseInt(tempData.saveData.episode) ? "watched" : ""} ${tempData.saveData && parseInt(data.ep) == parseInt(tempData.saveData.episode) && tempData.saveData.last_Time != 0 ? "watching" : tempData.saveData && parseInt(data.ep) == parseInt(tempData.saveData.episode) ? "watched" : ""}`} onClick={() => enterPlayer(episode, type, data.ep)}>{data.ep}</div>
                ))}
            </div>
        )
    }

    useHotkeys("tab", () => {
        console.log(tempData)
        console.log(currentIDplayer)
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
        if (tempData.anime.status == "NOT_YET_RELEASED") return true
        if (!episodeData && !isEpisodeLoading && !isEpisodeError) return true
        if (episodeData && episodeData.episodesData && episodeData.episodesData.length <= 0) return true
        return false
    }

    return (
        <>
            <main className="information" onContextMenu={(event) => OpenContextMenu(CreateContextMenuOptions(), event)}>
                <div className="information-banner">
                    <img className={tempData.anime.bannerImage ? "information-banner-image" : "information-banner-image-blur"} onError={() => setBannerIsError(() => true)} onLoad={() => setBannerLoadingData(() => false)} src={tempData.anime.bannerImage ? tempData.anime.bannerImage : tempData.anime.coverImage ? tempData.anime.coverImage : ""} style={isBannerLoading ? { display: "none" } : isBannerError ? { display: "none" } : { animation: "fadeIn 0.3s forwards" }} />
                    {isBannerLoading && isBannerError == false && <div className="information-banner-image-placeholder"><span className="material-symbols-outlined home-loading-animation">progress_activity</span></div>}
                    {isBannerError && isBannerLoading == false && <div className="information-banner-image-placeholder"><span className="material-symbols-outlined">error</span></div>}
                    <div className="information-fade"></div>
                </div>


                <div className="information-container">

                    <div className="information-top">
                        <div className="information-image-container">
                            {tempData.anime.averageScore && <div className="information-score" style={{ border: `3px solid ${getGradientColor(tempData.anime.averageScore)}` }}>{tempData.anime.averageScore}%</div>}
                            <img className="information-cover" onClick={() => tempData.anime.coverImage && SaveCoverToClipboard(tempData.anime.coverImage)} onError={() => setCoverIsError(() => true)} onLoad={() => setCoverIsLoading(() => false)} src={tempData.anime.coverImage ? tempData.anime.coverImage : ""} style={isCoverLoading ? { display: "none" } : isCoverError ? { display: "none" } : { animation: "fadeIn 0.3s forwards" }}></img>
                            {isCoverLoading && isCoverError == false && <div className="information-cover-placeholder"><span className="material-symbols-outlined home-loading-animation">progress_activity</span></div>}
                            {isCoverError && isCoverLoading == false && <div className="information-cover-placeholder"><span className="material-symbols-outlined">error</span></div>}

                            <div className="information-title-small-container">
                                <div className="information-title-small">{tempData.anime.title.romaji}</div>
                                <div className="information-title-small2">{tempData.anime.title.english ? tempData.anime.title.english : tempData.anime.title.native}</div>
                            </div>
                        </div>
                        <div className="information-description">
                            <div className="information-title">{tempData.anime.title.romaji}</div>
                            <div className="information-title2">{tempData.anime.title.english ? tempData.anime.title.english : tempData.anime.title.native}</div>
                            {decodeHtmlEntities(tempData.anime.description ? tempData.anime.description : t("information.descriptionnotfound"))}
                        </div>
                        <div className="information-bar">
                            <Button titleButton={t("information.bar.anilist")} icon="open_in_new" ButtonClass="information-bar-icon" onClick={() => window.api.open(`https://anilist.co/anime/${tempData.anime.id}`)} />
                            {tempData.anime.trailer && tempData.anime.trailer.site == "youtube" && <Button titleButton={t("information.bar.trailer")} icon="theaters" ButtonClass="information-bar-icon" onClick={() => window.api.open(`https://www.youtube.com/watch?v=${tempData.anime.trailer?.id}`)} />}
                        </div>
                    </div>

                    <div className="information-bottom">

                        <div className="information-info">

                            {tempData.anime.nextAiringEpisode && tempData.anime.player_ID == undefined &&
                                <div className="information-info-content">
                                    <div className="information-content-title">{t("information.airing")}: {tempData.anime.nextAiringEpisode.episode}</div>
                                    {`${time?.days}d ${time?.hours}h ${time?.minutes}m ${time?.seconds}s`}
                                </div>
                            }

                            {tempData.anime.format &&
                                <div className="information-info-content">
                                    <div className="information-content-title">{t("information.format")}</div>
                                    {t(`anime_formats.${tempData.anime.format.toLowerCase()}`)}
                                </div>
                            }

                            {tempData.anime.episodes &&
                                <div className="information-info-content">
                                    <div className="information-content-title">{t("information.episodes")}</div>
                                    {tempData.anime.episodes}
                                </div>
                            }

                            {tempData.anime.duration &&
                                <div className="information-info-content">
                                    <div className="information-content-title">{t("information.duration")}</div>
                                    {tempData.anime.duration} {t("global.minutes")}
                                </div>
                            }

                            {tempData.anime.status &&
                                <div className="information-info-content">
                                    <div className="information-content-title">{t("information.status")}</div>
                                    {t(`anime_statuses.${tempData.anime.status.toLowerCase()}`)}
                                </div>
                            }

                            {tempData.anime.startDate && (tempData.anime.startDate.year != undefined && tempData.anime.startDate.day != undefined && tempData.anime.startDate.month != undefined) &&
                                <div className="information-info-content">
                                    <div className="information-content-title">{t("information.startdate")}</div>
                                    {convertDateToFormattedString(tempData.anime.startDate.year, tempData.anime.startDate.month, tempData.anime.startDate.day, undefined, undefined)}
                                </div>
                            }

                            {tempData.anime.endDate && (tempData.anime.endDate.year != undefined && tempData.anime.endDate.day != undefined && tempData.anime.endDate.month != undefined) &&
                                <div className="information-info-content">
                                    <div className="information-content-title">{t("information.endate")}</div>
                                    {convertDateToFormattedString(tempData.anime.endDate.year, tempData.anime.endDate.month, tempData.anime.endDate.day, undefined, undefined)}
                                </div>
                            }

                            {tempData.anime.season && tempData.anime.seasonYear &&
                                <div className="information-info-content">
                                    <div className="information-content-title">{t("information.season")}</div>
                                    {t(`anime_seasons.${tempData.anime.season.toLowerCase()}`)} {tempData.anime.seasonYear}
                                </div>
                            }

                            {tempData.anime.source &&
                                <div className="information-info-content">
                                    <div className="information-content-title">{t("information.source")}</div>
                                    {t(`anime_source.${tempData.anime.source.toLowerCase().replaceAll("_", "")}`)}
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
                                        {isEpisodeLoading == false && isEpisodeError == false && episodeData && episodeData.episodesData && episodeData.episodesData.length > 0 && tempData.anime.status?.toUpperCase().replaceAll(" ", "_") != "NOT_YET_RELEASED" && (
                                            <>
                                                {episodeData.episodesData.map((episode) => episode.episodes.length > 0 ? (
                                                    <Drop LeftHeader={t(`information.types.${episode.type}`)} RightHeader={t("information.listEpisodes", { number: episode.episodes.length })} content={makeButtons(episode.episodes, episode.type)} />
                                                ) : "")}
                                            </>
                                        )}
                                        {isEpisodeLoading && tempData.anime.status?.toUpperCase().replaceAll(" ", "_") != "NOT_YET_RELEASED" && <div className="information-loading-container"><span className="information-loading material-symbols-outlined">progress_activity</span></div>}
                                        {isEpisodeError && isEpisodeLoading == false && <div className="information-loading-container"><span className="information-error material-symbols-outlined">error</span>{t("information.errors")}</div>}
                                        {checkEpisodes() && <div className="information-loading-container"><span className="information-error material-symbols-outlined">error</span>{t("information.errors")}</div>}
                                    </>}
                            </div>


                            {tempData.anime.characters && tempData.anime.characters.length > 0 &&
                                <div className="information-characters">
                                    <div className="information-characters-title">
                                        {t("information.characters")}
                                    </div>

                                    <div className="information-characters-container">
                                        {tempData.anime.characters.map((character) =>
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

                            {tempData.anime.characters && tempData.anime.characters.map((tmp) => tmp.voiceActor).filter((item) => item != undefined).length > 0 &&
                                <div className="information-characters">
                                    <div className="information-characters-title">
                                        {t("information.actors")}
                                    </div>

                                    <div className="information-characters-container">
                                        {tempData.anime.characters.map((character) => (character.voiceActor != undefined &&
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
            {showWrong && <ContainerWrong name={tempData.anime.title.romaji} refetchfunc={(id?: string) => {setshowWrong(() => false);setCurrentIDplayer(() => id); refetch()}} exitfunc={() => setshowWrong(() => false)} />}
        </>
    )
}

export default information