import { containerData } from "@renderer/utils/GlobalInterface"
import "./css/container.css"
import Card from "./card"
import { useRef } from "react"

const Container: React.FC<containerData> = ({ title, data, horizontal, onScrollDownFunction }) => {
  const container = useRef<HTMLDivElement>(null)
  function handleScroll(event) {
    if (event.deltaY === 0) return;
    if (container.current) {
      container.current.scrollLeft += event.deltaY
      console.log(container.current.scrollLeft, event.deltaY)
    }
  }
  return (
    <div className="main-container">
        <div className="container-title">{title}</div>
        <div className={horizontal ? "container-data-horizontal" : "container-data"} onWheel={handleScroll} ref={container}>
            {data.map((card) => <Card AnimeData={card.AnimeData} saveData={card.saveData} deletionCard={card.deletionCard} />)}
        </div>
    </div>
  )
}

export default Container
