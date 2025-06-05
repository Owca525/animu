import { containerData } from "@renderer/utils/GlobalInterface"
import "./css/container.css"
import Card from "./card"
import { useRef } from "react"
import Button from "@renderer/components/buttons"
import store from "@renderer/utils/store"
import { t } from "i18next"

const Container: React.FC<containerData> = ({ title, data, horizontal = false, onTitleClick }) => {
  const container = useRef<HTMLDivElement>(null)

  function handleButtonScroll(num: number) {
    if (!container.current) return
    container.current.scrollLeft += num
  }

  return (
    <div className="main-container">
        <div className={onTitleClick ? "container-title-click" : "container-title"} onClick={onTitleClick}>{title}</div>
        <div className={"container-button-container" + (data.length <= 0 ? " container-error" : "")}>
          {horizontal && data.length > 0 ? <Button icon="chevron_left" ButtonClass="container-left-skip-button" onClick={() => handleButtonScroll(-120)}/> : ""}
          <div className={horizontal ? "container-data-horizontal" : "container-data"} ref={container}> {/* onWheel={handleScroll} */}
              {data.length > 0 && data.map((card) => <Card AnimeData={card.AnimeData} saveData={card.saveData} deletionCard={card.deletionCard} />)}
              {data.length <= 0 && <div className="container-error-text">{t("home.nothingfound")}</div>}
          </div>
          {horizontal && data.length > 0 ? <Button icon="chevron_right" ButtonClass="container-right-skip-button" onClick={() => handleButtonScroll(120)}/> : ""}
        </div>
        {store.getState().home.containerLoading ? <div className="container-loading-container"><span className="container-loading material-symbols-outlined">progress_activity</span></div> : ""}
    </div>
  )
}

export default Container
