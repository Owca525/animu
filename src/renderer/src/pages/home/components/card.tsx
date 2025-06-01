import { cardData } from "@renderer/utils/GlobalInterface"
import "./css/card.css"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { t } from "i18next"

const Card: React.FC<cardData> = ({ AnimeData, saveData, deletionCard }) => {
  const navigate = useNavigate()
  const [isLoading, setLoading] = useState<boolean>(true)

  function sendToInformation() {
    if (saveData && saveData.episode != "" && saveData.last_Time != 0 && saveData.type != "") {
      let episodes = AnimeData.episodesList?.filter((data) => data.type === saveData.type)[0]
      console.log(AnimeData, saveData)
      navigate("/player", {
        state: {
          data: {
            AnimeData: AnimeData,
            saveData: saveData,
          },
          episodelist: episodes?.episodes
        }
      })
      return
    }

    navigate("/info", {
      state: AnimeData
    })
  }

  function runDeletionFunction(event) {
    console.log(deletionCard)
    event.preventDefault()
    event.stopPropagation()
    if (deletionCard) deletionCard()
  }

  return (
    <div className="card-container" onClick={sendToInformation}>
      {AnimeData.coverImage ? <img src={AnimeData.coverImage} className="card-image" onLoad={() => setLoading(() => false)} style={isLoading ? { display: "none" } : {}} /> : ""}
      {isLoading ? <div className="card-image-placeholder"><span className="material-symbols-outlined home-loading-animation">progress_activity</span></div> : ""}
      <div className="card-title">{AnimeData.title}</div>
      {saveData && saveData.episode && <div className="card-continue-watch-text">{saveData.last_Time != 0 && saveData.type != "" ? t("history.continue", { ep: saveData.episode }) : t("history.history", { ep: saveData.episode })}</div>}
      {deletionCard && <div className="card-delete-icon material-symbols-outlined" onClick={runDeletionFunction}>close</div>}
    </div>
  )
}

export default Card
