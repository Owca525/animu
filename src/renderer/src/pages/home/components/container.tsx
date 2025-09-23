import { containerData } from "@renderer/utils/GlobalInterface"
import "./css/container.css"
import Card from "./card"
import { useRef } from "react"
import Button from "@renderer/components/buttons"
import { t } from "i18next"

const Container: React.FC<containerData> = ({ title, data, horizontal = false, onTitleClick, tags }) => {
  const container = useRef<HTMLDivElement>(null)

  function handleButtonScroll(num: number) {
    if (!container.current) return
    let maxScrolLeft = (container.current.scrollWidth - container.current.clientWidth) + 120
    let currentValue = container.current.scrollLeft + num
    container.current.scrollLeft += num
    if (currentValue <= 0) container.current.scrollLeft = maxScrolLeft
    if (currentValue >= maxScrolLeft) container.current.scrollLeft = 0
  }

  return (
    <div tabIndex={-1} className="main-container">
        <div tabIndex={-1} className="container-title-container">
          {title && <div className={onTitleClick ? "container-title-click" : "container-title"} onClick={onTitleClick}>{title}</div>}
          {tags && tags.map((element) => <div onClick={element.remover} className="container-tag">{element.name} <span className="container-tag-icon material-symbols-outlined">close</span></div>)}
        </div>
        <div tabIndex={-1} className={`container-button-container ${data.length <= 0 && " container-error"}`}>
          {horizontal && data.length > 0 ? <Button icon="chevron_left" ButtonClass="container-left-skip-button" onClick={() => handleButtonScroll(-120)}/> : ""}
          {data.length > 0 && 
            <div tabIndex={-1} className={horizontal ? "container-data-horizontal" : "container-data"} ref={container}>
                {data.length > 0 && data.map((card) => <Card card={card} />)}
            </div>
          }
          {data.length <= 0 && <div className="home-empty-container container-error-text"><span className="material-symbols-outlined home-empty-icon">search_off</span>{t("home.nothingfound")}</div>}
          {horizontal && data.length > 0 ? <Button icon="chevron_right" ButtonClass="container-right-skip-button" onClick={() => handleButtonScroll(120)}/> : ""}
        </div>
    </div>
  )
}

export default Container
