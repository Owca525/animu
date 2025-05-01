import { cardData } from "@renderer/utils/GlobalInterface"
import "./css/card.css"

const Card: React.FC<cardData> = ({ AnimeData, deletionCard, CardOnClick }) => {

  return (
    <div className="card-container" onClick={CardOnClick}>
        {AnimeData.coverImage ? <img src={AnimeData.coverImage} className="card-image"/> : <div className="card-image-placeholder"></div>}
        <div className="card-title">{AnimeData.title}</div>
    </div>
  )
}

export default Card
