import { getGradientColor } from '@renderer/utils/functions';
import { cardData } from '@renderer/utils/GlobalInterface';
import React from 'react';
import "./css/bigcard.css"

type bigCardProps = { data: cardData }

const BigCard: React.FC<bigCardProps> = ({ data }) => {

    return (
        <div className="big-card-content" style={{ backgroundImage: `url(${data.AnimeData.bannerImage})` }} onClick={() => console.log("a;jksndlajsndv")}>
            <div className="big-card-background">
                <div className="big-card-information">
                    <div className="big-card-information-image-container">
                        <img src={data.AnimeData.coverImage} className="card-image big-card-information-image" />
                        <div className="big-card-information-score" style={{ border: `3px solid ${getGradientColor(data.AnimeData.averageScore)}` }}>{data.AnimeData.averageScore}%</div>
                    </div>
                    <div className="big-card-information-content">
                        <div className="big-card-information-title">{data.AnimeData.title.romaji}</div>
                        <div className="big-card-information-genres-content">
                            {data.AnimeData.genres && data.AnimeData.genres.map((value) =>
                                <div className="big-card-information-genres">{value}</div>
                            )}
                        </div>
                        <div className="big-card-information-others">
                            <div className="big-card-information-format">{data.AnimeData.format}</div>
                            <div className="big-card-information-status">{data.AnimeData.status}</div>
                            <div className="big-card-information-episode">11 / {data.AnimeData.episodes} Episodes</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BigCard;