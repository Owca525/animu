import { useLocation, useNavigate } from "react-router-dom"
import { AnimeData } from "@renderer/utils/GlobalInterface";
import Button from "@renderer/components/buttons";
import "./information.css"
import { capitalizeFirstLetter, convertDateToFormattedString, convertSeconds, decodeHtmlEntities } from "@renderer/utils/functions";
import { useEffect, useState } from "react";
import { t } from "i18next"
import useHotkeys from "@reecelucas/react-use-hotkeys";
import { useQuery } from "react-query";
import { useSelector } from "react-redux";
import Drop from "./components/drop";

function information() {
    const navigate = useNavigate()
    const location = useLocation();
    const anime_data: AnimeData = location.state;
    const pluginPlayer = useSelector((plugin: any) => plugin.plugin.playerPlugin);
    const func = async () => await pluginPlayer.player.animeDataList(anime_data.title)
    const { data, isError, isLoading } = useQuery(
        [func.toString()],
        func,
        {
            refetchOnWindowFocus: false,
            cacheTime: 0,
        }
    );

    console.log(data)

    const [secondsLeft, setSecondsLeft] = useState<undefined | number>(anime_data.nextAiringEpisode?.timeUntilAiring);

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

    useHotkeys("Tab", () => {
        console.log(anime_data)
    })

    function enterPlayer(episodes: string[], type: string, episode: string) {
        navigate("/player", {
            state: {
                data: {
                    AnimeData: {
                        ...anime_data,
                        player_ID: data?.player_id
                    },
                    saveData: {
                        last_Time: 0,
                        type: type,
                        player_ID: anime_data.player_ID,
                        episode: episode
                    }
                },
                episodelist: episodes
            }
        })
    }

    function makeButtons(episode: string[], type: string) {
        return (
            <div className='information-buttons-episode-container'>
                {episode.map((num) => (
                    <div className='information-episode-button' onClick={() => enterPlayer(episode, type, num)}>{num}</div>
                ))}
            </div>
        )
    }

    useHotkeys("tab", () => {
        console.log(anime_data)
    })

    return (
        <main className="information">
            <div className="information-banner">
                <img className={anime_data.bannerImage ? "information-banner-image" : "information-banner-image-blur"} src={anime_data.bannerImage ? anime_data.bannerImage : anime_data.coverImage ? anime_data.coverImage : ""} />
            </div>

            <div className="information-fade"></div>

            <div className="information-container">

                <div className="information-top">

                    <img className="information-cover" src={anime_data.coverImage ? anime_data.coverImage : ""}></img>

                    <div className="information-description">
                        <div className="information-title">{anime_data.title}</div>
                        {decodeHtmlEntities(anime_data.description ? anime_data.description : "Description Dosen't exist")}
                    </div>

                </div>

                <div className="information-bottom">

                    <div className="information-info">

                        {anime_data.nextAiringEpisode &&
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
                                {capitalizeFirstLetter(anime_data.status)}
                            </div>
                        }

                        {anime_data.startDate &&
                            <div className="information-info-content">
                                <div className="information-content-title">{t("information.startdate")}</div>
                                {convertDateToFormattedString(anime_data.startDate.year, anime_data.startDate.month, anime_data.startDate.day, 0, 0)}
                            </div>
                        }

                        {anime_data.endDate &&
                            <div className="information-info-content">
                                <div className="information-content-title">{t("information.endate")}</div>
                                {convertDateToFormattedString(anime_data.endDate.year, anime_data.endDate.month, anime_data.endDate.day, 0, 0)}
                            </div>
                        }

                        {anime_data.season && anime_data.seasonYear &&
                            <div className="information-info-content">
                                <div className="information-content-title">{t("information.season")}</div>
                                {capitalizeFirstLetter(anime_data.season)} {anime_data.seasonYear}
                            </div>
                        }

                    </div>


                    <div className="information-episodes">
                        {isLoading == false && data && data.episodesData.length > 0 && anime_data.status != "NOT_YET_RELEASED" && (
                            <>
                                {data.episodesData.map((episode: { episodes: string[], type: string, name?: string }) => episode.episodes.length > 0 ? (
                                    <Drop LeftHeader={episode.name ? episode.name : episode.type} RightHeader={`${episode.episodes.length} episodes`} content={makeButtons(episode.episodes, episode.type)}/>
                                ) : "")}
                            </>
                        )}
                        {isLoading && <div className="information-loading-container"><span className="information-loading material-symbols-outlined">progress_activity</span></div>}
                        {isError && <div className="information-loading-container"><span className="information-error material-symbols-outlined">error</span>Zero Episode was finded</div>}
                    </div>

                </div>
            </div>

            <Button icon="arrow_back" ButtonClass="information-exit-button" onClick={() => navigate("/")} />

        </main>
    )
}

export default information