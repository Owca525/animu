import { cardData } from "@renderer/utils/GlobalInterface"
import "./css/card.css"
import { useNavigate } from "react-router-dom"

const Card: React.FC<cardData> = ({ AnimeData, deletionCard }) => {
  const navigate = useNavigate()

  function sendToInformation() {
    navigate("/info", {
      state: AnimeData
    })
  }

  return (
    <div className="card-container" onClick={sendToInformation}>
        {AnimeData.coverImage ? <img src={AnimeData.coverImage} className="card-image"/> : <div className="card-image-placeholder"></div>}
        <div className="card-title">{AnimeData.title}</div>
    </div>
  )
}

export default Card
