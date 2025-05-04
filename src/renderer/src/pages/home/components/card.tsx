import { cardData } from "@renderer/utils/GlobalInterface"
import "./css/card.css"
import { useNavigate } from "react-router-dom"
import { useState } from "react"

const Card: React.FC<cardData> = ({ AnimeData, deletionCard }) => {
  const navigate = useNavigate()
  const [isLoading, setLoading] = useState<boolean>(true)

  function sendToInformation() {
    navigate("/info", {
      state: AnimeData
    })
  }

  return (
    <div className="card-container" onClick={sendToInformation}>
        {AnimeData.coverImage ? <img src={AnimeData.coverImage} className="card-image" onLoad={() => setLoading(() => false)} style={isLoading ? {display: "none"} : {}} /> : ""}
        {isLoading ? <div className="card-image-placeholder"><span className="material-symbols-outlined home-loading-animation">progress_activity</span></div> : ""}
        <div className="card-title">{AnimeData.title}</div>
    </div>
  )
}

export default Card
