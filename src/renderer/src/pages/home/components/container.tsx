import { containerData } from "@renderer/utils/GlobalInterface"
import "./css/container.css"
import Card from "./card"

const Container: React.FC<containerData> = ({ title, data, horizontal, onScrollDownFunction }) => {

  return (
    <div className="main-container">
        <div className="container-title">{title}</div>
        <div className="container-data">
            {data.map((card) => <Card AnimeData={card.AnimeData} saveData={card.saveData} deletionCard={card.deletionCard} CardOnClick={card.CardOnClick} />)}
        </div>
    </div>
  )
}

export default Container
