import { containerData } from "@renderer/utils/GlobalInterface"
import "./css/container.css"
import Card from "./card"
import { useRef } from "react"
import Button from "@renderer/components/buttons"

const Container: React.FC<containerData> = ({ title, data, horizontal, onScrollDownFunction }) => {
  const container = useRef<HTMLDivElement>(null)
  // function handleScroll(event) {
  //   if (event.deltaY === 0) return;
  //   if (container.current) {
  //     container.current.scrollLeft += event.deltaY
  //     console.log(container.current.scrollLeft, event.deltaY)
  //   }
  // }

  function handleButtonScroll(num: number) {
    if (!container.current) return
    container.current.scrollLeft += num
  }

  onScrollDownFunction = () => {
    console.log('haiiii')
  }

  return (
    <div className="main-container" onScroll={onScrollDownFunction}>
        <div className="container-title">{title}</div>
        <div className="button-container">
          {horizontal ? <Button icon="chevron_left" ButtonClass="container-left-skip-button" onClick={() => handleButtonScroll(-120)}/> : ""}
          <div className={horizontal ? "container-data-horizontal" : "container-data"} ref={container}> {/* onWheel={handleScroll} */}
              {data.map((card) => <Card AnimeData={card.AnimeData} saveData={card.saveData} deletionCard={card.deletionCard} />)}
          </div>
          {horizontal ? <Button icon="chevron_right" ButtonClass="container-right-skip-button" onClick={() => handleButtonScroll(120)}/> : ""}
        </div>
    </div>
  )
}

export default Container
