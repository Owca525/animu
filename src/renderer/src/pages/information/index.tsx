import Button from "@renderer/components/buttons"
import "./information.css"
import { useLocation, useNavigate } from "react-router-dom"
import { AnimeData } from "@renderer/utils/GlobalInterface";

function information() {
    const navigate = useNavigate()
    const location = useLocation();
    const data: AnimeData = location.state;
    console.log(data)

    return (
        <main className="information">
            <div className="information-banner">
                <img className="information-banner-image" src={data.bannerImage}></img>
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