import Button from "@renderer/components/buttons"
import "./information.css"
import { useNavigate } from "react-router-dom"

const data = {
    "id": 178680,
    "title": "WIND BREAKER Season 2",
    "coverImage": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx178680-nIAhCizY46ZU.jpg",
    "startDate": {
        "year": 2025,
        "month": 4,
        "day": 4
    },
    "endDate": {
        "year": 2025,
        "month": 6,
        "day": 20
    },
    "bannerImage": "https://s4.anilist.co/file/anilistcdn/media/anime/banner/178680-9HupCDo647QU.jpg",
    "season": "SPRING",
    "seasonYear": 2025,
    "description": "The second season of <i>WIND BREAKER</i>.<br><br>\n\nWelcome back to Furin High School, an institution infamous for its population of brawny brutes who solve every conflict with a show of strength. Some of the students even formed a group, Bofurin, which protects the town. Haruka Sakura, a first-year student who moved in from out of town, is only interested in one thing: fighting his way to the top! <br><br>\n\n(Source: Crunchyroll, edited)",
    "type": "ANIME",
    "format": "TV",
    "status": "RELEASING",
    "episodes": 12,
    "duration": 24,
    "genres": [
        "Action",
        "Comedy",
        "Drama"
    ],
    "isAdult": false,
    "averageScore": 78,
    "popularity": 49985,
    "nextAiringEpisode": {
        "airingAt": 1745508360,
        "timeUntilAiring": 369211,
        "episode": 4
    },
    "studios": {
        "edges": [
            {
                "isMain": true,
                "node": {
                    "id": 6222,
                    "name": "CloverWorks"
                }
            }
        ]
    }
}

function information() {
    const navigate = useNavigate()

    return (
        <main className="information">
            <div className="information-banner">
                <img src={data.bannerImage}></img>
            </div>
            
                <div className="information-fade"></div>
            
            <div className="information-container">

                <div className="information-top">
                
                    <img className="information-cover" src={data.coverImage}></img>
                
                    <div className="information-description">
                        <div className="information-title">{data.title}</div>
                        {data.description}
                    </div>
                
                </div>
                    
                <div className="information-bottom">
                
                    <div className="information-info">
                    
                        <div className="information-info-content">
                            <div className="information-content-title">Format</div>
                            {data.format}
                        </div>
                    
                        <div className="information-info-content">
                            <div className="information-content-title">Episodes</div>
                            {data.episodes}
                        </div>
                    
                        <div className="information-info-content">
                            <div className="information-content-title">Episode Duration</div>
                            {data.duration}
                        </div>
                    
                        <div className="information-info-content">
                            <div className="information-content-title">Status</div>
                            {data.status}
                        </div>
                    
                        <div className="information-info-content">
                            <div className="information-content-title">Start Date</div>
                             {data.startDate.month} {data.startDate.day} {data.startDate.year}
                        </div>
                    
                        <div className="information-info-content">
                            <div className="information-content-title">End Date</div>
                            {data.endDate.month} {data.endDate.day} {data.endDate.year}
                        </div>
                    
                        <div className="information-info-content">
                            <div className="information-content-title">Season</div>
                            {data.season} {data.seasonYear}
                        </div>

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