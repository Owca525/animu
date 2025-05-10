import { useLocation, useNavigate } from "react-router-dom"
import { AnimeData } from "@renderer/utils/GlobalInterface";
import Button from "@renderer/components/buttons";
import "./information.css"
import { capitalizeFirstLetter, convertDateToFormattedString, convertSeconds, decodeHtmlEntities } from "@renderer/utils/functions";
import { useEffect, useState } from "react";
import { t } from "i18next"

function information() {
    const navigate = useNavigate()
    const location = useLocation();
    const data: AnimeData = location.state;

    console.log(data)

    const [secondsLeft, setSecondsLeft] = useState<undefined | number>(data.nextAiringEpisode?.timeUntilAiring);

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

    return (
        <main className="information">
            <div className="information-banner">
                <img className={data.bannerImage ? "information-banner-image" : "information-banner-image-blur"} src={data.bannerImage ? data.bannerImage : data.coverImage ? data.coverImage : ""} />
            </div>

            <div className="information-fade"></div>

            <div className="information-container">

                <div className="information-top">

                    <img className="information-cover" src={data.coverImage ? data.coverImage : ""}></img>

                    <div className="information-description">
                        <div className="information-title">{data.title}</div>
                        {decodeHtmlEntities(data.description ? data.description : "Description Dosen't exist")}
                    </div>

                </div>

                <div className="information-bottom">

                    <div className="information-info">

                        {data.nextAiringEpisode &&
                            <div className="information-info-content">
                                <div className="information-content-title">{t("information.airing")}: {data.nextAiringEpisode.episode}</div>
                                {`${time?.days}d ${time?.hours}h ${time?.minutes}m ${time?.seconds}s`}
                            </div>
                        }

                        {data.format &&
                            <div className="information-info-content">
                                <div className="information-content-title">{t("information.format")}</div>
                                {data.format}
                            </div>
                        }

                        {data.episodes &&
                            <div className="information-info-content">
                                <div className="information-content-title">{t("information.episodes")}</div>
                                {data.episodes}
                            </div>
                        }

                        {data.duration &&
                            <div className="information-info-content">
                                <div className="information-content-title">{t("information.duration")}</div>
                                {data.duration}
                            </div>
                        }

                        {data.status &&
                            <div className="information-info-content">
                                <div className="information-content-title">{t("information.status")}</div>
                                {capitalizeFirstLetter(data.status)}
                            </div>
                        }

                        {data.startDate && data.startDate.day && data.startDate.month && data.startDate.year &&
                            <div className="information-info-content">
                                <div className="information-content-title">{t("information.startdate")}</div>
                                {convertDateToFormattedString(data.startDate.year, data.startDate.month, data.startDate.day, 0, 0)}
                            </div>
                        }

                        {data.endDate && data.endDate.day && data.endDate.month && data.endDate.year &&
                            <div className="information-info-content">
                                <div className="information-content-title">{t("information.endate")}</div>
                                {convertDateToFormattedString(data.endDate.year, data.endDate.month, data.endDate.day, 0, 0)}
                            </div>
                        }

                        {data.season && data.seasonYear &&
                            <div className="information-info-content">
                                <div className="information-content-title">{t("information.season")}</div>
                                {capitalizeFirstLetter(data.season)} {data.seasonYear}
                            </div>
                        }

                    </div>

                    <div className="information-episodes">

                    </div>

                </div>
            </div>

            <Button icon="arrow_back" ButtonClass="information-exit-button" onClick={() => navigate("/")} />

        </main>
    )
}

export default information