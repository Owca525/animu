import { useLocation, useNavigate } from "react-router-dom"
import { AnimeData, notificationProps, pluginFormat } from "@renderer/utils/GlobalInterface";
import Button from "@renderer/components/buttons";
import "./information.css"
import { capitalizeFirstLetter, convertDateToFormattedString, convertSeconds, CreateContextMenuOptions, decodeHtmlEntities, getGradientColor, segregatePlugins } from "@renderer/utils/functions";
import { useEffect, useState } from "react";
import { t } from "i18next"
import Drop from "./components/drop";
import ContainerWrong from "./components/containerWrong";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "react-toastify";
import { OpenContextMenu } from "@renderer/utils/context/ContextMenu";
import { ReadHistory } from "@renderer/utils/history/history";
import { ReadContinue } from "@renderer/utils/history/continueWatch";
import store from "@renderer/utils/store";
import Dropdown from "@renderer/components/dropDown";
import { ChangePlugin } from "@renderer/utils/pluginApi";
import { useQuery } from "react-query";

function information() {
    const navigate = useNavigate()
    const anime_data: AnimeData = useLocation().state;

    const [showWrong, setshowWrong] = useState<boolean>(false)
    const [secondsLeft, setSecondsLeft] = useState<undefined | number>(anime_data.nextAiringEpisode?.timeUntilAiring);
    const [savedata, setsavedata] = useState<{ last_episode: number, last_time: number } | undefined>(undefined)
    const [currentIDplayer, setCurrentIDplayer] = useState<string | undefined>(anime_data.player_ID)

    const { data: episodeData, isError: isEpisodeError, isLoading: isEpisodeLoading, refetch } = useQuery({
        queryKey: [{ data: anime_data, player_id: currentIDplayer }],
        queryFn: async ({ queryKey }) => {
            const [data] = queryKey;
            console.log(data)
            if (data.data.id == "") {
                ChangePlugin("Allmanga")
                return store.getState().plugin.playerPlugin.player.animeDataList(data.data, "")
            }
            if (store.getState().plugin.playerPlugin) return store.getState().plugin.playerPlugin.player.animeDataList(data.player_id ? undefined : data.data, data.player_id)
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

    async function initialInformation() {
        let currentPlayerPlugin: pluginFormat = store.getState().plugin.playerPlugin
        if (!currentPlayerPlugin.player) return

        let cardAnime = (await ReadHistory()).filter((element) => element.AnimeData.id == anime_data.id)
        let cardAnimeContinueWatch = (await ReadContinue()).filter((element) => element.AnimeData.id == anime_data.id)

        if (cardAnimeContinueWatch.length > 0) {
            let animeContinue = cardAnimeContinueWatch[0].saveData
            if (animeContinue) setsavedata(() => { return { last_episode: parseInt(animeContinue.episode), last_time: animeContinue.last_Time } })
        }
        if (cardAnime.length > 0 && cardAnimeContinueWatch.length <= 0) {
            let animeHistory = cardAnime[0].saveData
            if (animeHistory) setsavedata(() => { return { last_episode: parseInt(animeHistory.episode), last_time: animeHistory.last_Time } })
        }
    }

    useEffect(() => {
        initialInformation()
        document.querySelectorAll('*').forEach((element: any) => {
            element.tabIndex = -1
        });
    }, [])

    function enterPlayer(episodes: { ep: string, img?: string, title?: string }[], type: string, episode: string) {
        navigate("/player", {
            state: {
                data: {
                    AnimeData: {
                        ...anime_data,
                        player_ID: episodeData?.player_id
                    },
                    saveData: {
                        last_Time: savedata && savedata.last_episode.toString() === episode ? savedata.last_time : 0,
                        type: type,
                        player_ID: anime_data.player_ID,
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
                    <div className={`information-episode-button ${savedata && parseInt(data.ep) < savedata.last_episode ? "watched" : ""} ${savedata && parseInt(data.ep) == savedata.last_episode && savedata.last_time != 0 ? "watching" : savedata && parseInt(data.ep) == savedata.last_episode ? "watched" : ""}`} onClick={() => enterPlayer(episode, type, data.ep)}>{data.ep}</div>
                ))}
            </div>
        )
    }

    useHotkeys("tab", () => {
        console.log(anime_data, savedata)
    })

    useHotkeys("esc", () => {
        if (showWrong) setshowWrong(() => false)
        else navigate("/")
    })

    async function refreashInformation(name: string) {
        ChangePlugin(name)
        refetch()
    }

    return (
        <>
            <main className="information" onContextMenu={(event) => OpenContextMenu(CreateContextMenuOptions(), event)}>
                <div className="information-banner">
                    <img className={anime_data.bannerImage ? "information-banner-image" : "information-banner-image-blur"} onError={() => setBannerIsError(() => true)} onLoad={() => setBannerLoadingData(() => false)} src={anime_data.bannerImage ? anime_data.bannerImage : anime_data.coverImage ? anime_data.coverImage : ""} style={isBannerLoading ? { display: "none" } : isBannerError ? { display: "none" } : { animation: "fadeIn 0.3s forwards" }} />
                    {isBannerLoading && isBannerError == false && <div className="information-banner-image-placeholder"><span className="material-symbols-outlined home-loading-animation">progress_activity</span></div>}
                    {isBannerError && isBannerLoading == false && <div className="information-banner-image-placeholder"><span className="material-symbols-outlined">error</span></div>}
                    <div className="information-fade"></div>
                </div>


                <div className="information-container">

                    <div className="information-top">
                        <div className="information-image-container">
                            {anime_data.averageScore && <div title="Anime Score" className="information-score" style={{ border: `3px solid ${getGradientColor(anime_data.averageScore)}` }}>{anime_data.averageScore}%</div>}
                            <img className="information-cover" onClick={() => anime_data.coverImage && SaveCoverToClipboard(anime_data.coverImage)} onError={() => setCoverIsError(() => true)} onLoad={() => setCoverIsLoading(() => false)} src={anime_data.coverImage ? anime_data.coverImage : ""} style={isCoverLoading ? { display: "none" } : isCoverError ? { display: "none" } : { animation: "fadeIn 0.3s forwards" }}></img>
                            {isCoverLoading && isCoverError == false && <div className="information-cover-placeholder"><span className="material-symbols-outlined home-loading-animation">progress_activity</span></div>}
                            {isCoverError && isCoverLoading == false && <div className="information-cover-placeholder"><span className="material-symbols-outlined">error</span></div>}

                            <div className="information-title-mobile-container">
                                <div className="information-title-mobile">{anime_data.title.romaji}</div>
                                <div className="information-title-mobile2">{anime_data.title.english ? anime_data.title.english : anime_data.title.native}</div>
                            </div>
                        </div>
                        <div className="information-description">
                            <div className="information-title">{anime_data.title.romaji}</div>
                            <div className="information-title2">{anime_data.title.english ? anime_data.title.english : anime_data.title.native}</div>
                            {decodeHtmlEntities(anime_data.description ? anime_data.description : t("information.descriptionnotfound"))}
                        </div>
                        <div className="information-bar">
                            <Button titleButton={t("information.bar.anilist")} icon="open_in_new" ButtonClass="information-bar-icon" onClick={() => window.api.open(`https://anilist.co/anime/${anime_data.id}`)} />
                            {anime_data.trailer && anime_data.trailer.site == "youtube" && <Button titleButton={t("information.bar.trailer")} icon="theaters" ButtonClass="information-bar-icon" onClick={() => window.api.open(`https://www.youtube.com/watch?v=${anime_data.trailer?.id}`)} />}
                        </div>
                    </div>

                    <div className="information-bottom">

                        <div className="information-info">

                            {anime_data.nextAiringEpisode && anime_data.player_ID == undefined &&
                                <div className="information-info-content">
                                    <div className="information-content-title">{t("information.airing")}: {anime_data.nextAiringEpisode.episode}</div>
                                    {`${time?.days}d ${time?.hours}h ${time?.minutes}m ${time?.seconds}s`}
                                </div>
                            }

                            {anime_data.format &&
                                <div className="information-info-content">
                                    <div className="information-content-title">{t("information.format")}</div>
                                    {capitalizeFirstLetter(anime_data.format)}
                                </div>
                            }

                            {anime_data.episodes &&
                                <div className="information-info-content">
                                    <div className="information-content-title">{t("information.episodes")}</div>
                                    {anime_data.episodes}
                                </div>
                            }

                            {anime_data.duration &&
                                <div className="information-info-content">
                                    <div className="information-content-title">{t("information.duration")}</div>
                                    {anime_data.duration} {t("global.minutes")}
                                </div>
                            }

                            {anime_data.status &&
                                <div className="information-info-content">
                                    <div className="information-content-title">{t("information.status")}</div>
                                    {t(`anime_statuses.${anime_data.status.toLowerCase()}`)}
                                </div>
                            }

                            {anime_data.startDate && (anime_data.startDate.year != undefined && anime_data.startDate.day != undefined && anime_data.startDate.month != undefined) &&
                                <div className="information-info-content">
                                    <div className="information-content-title">{t("information.startdate")}</div>
                                    {convertDateToFormattedString(anime_data.startDate.year, anime_data.startDate.month, anime_data.startDate.day, undefined, undefined)}
                                </div>
                            }

                            {anime_data.endDate && (anime_data.endDate.year != undefined && anime_data.endDate.day != undefined && anime_data.endDate.month != undefined) &&
                                <div className="information-info-content">
                                    <div className="information-content-title">{t("information.endate")}</div>
                                    {convertDateToFormattedString(anime_data.endDate.year, anime_data.endDate.month, anime_data.endDate.day, undefined, undefined)}
                                </div>
                            }

                            {anime_data.season && anime_data.seasonYear &&
                                <div className="information-info-content">
                                    <div className="information-content-title">{t("information.season")}</div>
                                    {t(`anime_seasons.${anime_data.season.toLowerCase()}`)} {anime_data.seasonYear}
                                </div>
                            }

                            {anime_data.source &&
                                <div className="information-info-content">
                                    <div className="information-content-title">{t("information.source")}</div>
                                    {capitalizeFirstLetter(anime_data.source)}
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
                                {/* <div className="information-select-episode" onClick={() => setshowWrong(() => true)}><span className="material-symbols-outlined">search</span>Is this the wrong Anime?</div> */}
                                {showWrong == false &&
                                    <>
                                        {isEpisodeLoading == false && isEpisodeError == false && episodeData && episodeData.episodesData && episodeData.episodesData.length > 0 && anime_data.status?.toUpperCase().replaceAll(" ", "_") != "NOT_YET_RELEASED" && (
                                            <>
                                                {episodeData.episodesData.map((episode) => episode.episodes.length > 0 ? (
                                                    <Drop LeftHeader={episode.name ? episode.name : episode.type} RightHeader={`${episode.episodes.length} episodes`} content={makeButtons(episode.episodes, episode.type)} />
                                                ) : "")}
                                            </>
                                        )}
                                        {isEpisodeLoading && anime_data.status?.toUpperCase().replaceAll(" ", "_") != "NOT_YET_RELEASED" && <div className="information-loading-container"><span className="information-loading material-symbols-outlined">progress_activity</span></div>}
                                        {isEpisodeError && isEpisodeLoading == false && <div className="information-loading-container"><span className="information-error material-symbols-outlined">error</span>{t("information.errors")}</div>}
                                        {episodeData && (episodeData.episodesData && episodeData.episodesData.length <= 0 || anime_data.status == "NOT_YET_RELEASED") && <div className="information-loading-container"><span className="information-error material-symbols-outlined">error</span>{t("information.errors")}</div>}
                                    </>}
                            </div>


                            {anime_data.characters && anime_data.characters.length > 0 &&
                                <div className="information-characters">
                                    <div className="information-characters-title">
                                        {t("information.characters")}
                                    </div>

                                    <div className="information-characters-container">
                                        {anime_data.characters.map((character) =>
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

                            {anime_data.characters && anime_data.characters.map((tmp) => tmp.voiceActor).filter((item) => item != undefined).length > 0 &&
                                <div className="information-characters">
                                    <div className="information-characters-title">
                                        {t("information.actors")}
                                    </div>

                                    <div className="information-characters-container">
                                        {anime_data.characters.map((character) => (character.voiceActor != undefined &&
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
            {showWrong && <ContainerWrong name={anime_data.title.romaji} refetchfunc={(id?: string) => {setshowWrong(() => false);setCurrentIDplayer(() => id); refetch()}} exitfunc={() => setshowWrong(() => false)} />}
        </>
    )
}

export default information