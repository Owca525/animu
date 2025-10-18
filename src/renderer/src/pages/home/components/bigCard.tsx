import { getEpisodeDay, getGradientColor } from '@renderer/utils/functions';
import { cardData } from '@renderer/utils/GlobalInterface';
import React from 'react';
import "./css/bigcard.css"
import { t } from 'i18next';
import Button from '@renderer/components/buttons';
import { useNavigate } from 'react-router-dom';

type bigCardProps = { data: cardData, ref?: any }

const BigCard: React.FC<bigCardProps> = ({ data, ref }) => {
    const navigate = useNavigate();

    function formatEpisode(): string {
        if (!data.AnimeData.nextAiringEpisode) return ""
        if (data.AnimeData.nextAiringEpisode.episode == 1) return "1"
        return (data.AnimeData.nextAiringEpisode.episode - 1).toString()
    }

    function openInformation() {
        navigate("/info", {
            state: { anime: data.AnimeData },
        });
    }

    return (
        <div className="big-card-content" ref={ref} style={{ backgroundImage: `url(${data.AnimeData.bannerImage ?? data.AnimeData.coverImage})` }}>
            <div className={`big-card-background ${!data.AnimeData.bannerImage ? "big-card-blur" : ""}`}>
                <div className="big-card-information">
                    <div className="big-card-information-image-container">
                        <img src={data.AnimeData.coverImage} className="card-image big-card-information-image" />
                        {data.AnimeData.averageScore &&
                            <div className="big-card-information-score" style={{ border: `3px solid ${getGradientColor(data.AnimeData.averageScore)}` }}>
                                {data.AnimeData.averageScore}%
                            </div>
                        }
                    </div>
                    <div className="big-card-information-content">
                        <div className="big-card-information-title">{data.AnimeData.title.romaji}</div>
                        <div className="big-card-information-genres-content">
                            {data.AnimeData.genres && data.AnimeData.genres.map((value) =>
                                <div className="big-card-information-genres">{value}</div>
                            )}
                        </div>
                        <div className="big-card-information-others">
                            {data.AnimeData.format &&
                                <div className="big-card-information-format">{t(`anime_formats.${data.AnimeData.format.toLowerCase()}`)}</div>
                            }
                            {data.AnimeData.status &&
                                <div className="big-card-information-status">{t(`anime_statuses.${data.AnimeData.status.toLowerCase()}`)}</div>
                            }
                            {data.AnimeData.episodes &&
                                <div className="big-card-information-episode">{formatEpisode() != "" ? `${formatEpisode()} /` : ""} {data.AnimeData.episodes} Episodes</div>
                            }
                        </div>
                        <div className="big-card-information-bottom">
                            <Button content='More Information' ButtonClass='big-card-button' onClick={openInformation} />
                            {data.AnimeData.nextAiringEpisode &&
                                <div className="big-card-information-date">{getEpisodeDay(data.AnimeData.nextAiringEpisode.airingAt, data.AnimeData.nextAiringEpisode.episode)}</div>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BigCard;