import { cardData, ContextMenuProps } from "@renderer/utils/GlobalInterface"
import "./css/card.css"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { t } from "i18next"
import { useSelector } from "react-redux"
import { OpenContextMenu } from "@renderer/utils/context/ContextMenu"
import { CreateContextMenuOptions } from "@renderer/utils/functions"

const Card: React.FC<cardData> = ({ AnimeData, saveData, deletionCard, onClick }) => {
  const navigate = useNavigate()
  const [isLoading, setLoading] = useState<boolean>(true)
  const [isError, setisError] = useState<boolean>(false)
  const pluginPlayer = useSelector((plugin: any) => plugin.plugin.playerPlugin);

  async function sendToInformation() {
    if (onClick) {
      onClick(AnimeData)
      return
    }
    if (saveData && saveData.episode != "" && saveData.last_Time != 0 && saveData.type != "") {
      console.log(AnimeData, saveData)
      navigate("/player", {
        state: {
          data: {
            AnimeData: AnimeData,
            saveData: saveData,
          },
          episodelist: await pluginPlayer.player.episodeList(saveData.type, AnimeData.player_ID)
        }
      })
      return
    }

    if (AnimeData.id === "") {
      navigate("/info", {
        state: await pluginPlayer.player.getInformation(AnimeData.player_ID)
      })
      return
    }

    navigate("/info", {
      state: AnimeData
    })
  }

  // function runDeletionFunction(event) {
  //   event.preventDefault()
  //   event.stopPropagation()
  //   if (deletionCard) deletionCard()
  // }

  function checkState() {
    if (isLoading) return { display: "none" }
    if (isError) return { display: "none" }
    return {animation: "fadeIn 0.3s forwards"}
  }

  let CenterContextMenu: ContextMenuProps = [
    { option: t("contextMenu.copytitle"), onClick: () => window.api.saveToClipboard("text", AnimeData.title) },
    { option: t("contextMenu.copycover"), onClick: () => AnimeData.coverImage ? window.api.saveToClipboard("image", AnimeData.coverImage) : "" },
  ]

  if (deletionCard) {
    CenterContextMenu.push({option: t("contextMenu.delete"), deletion: true, onClick: deletionCard})
  }

  return (
    <div className="card-container" onClick={sendToInformation} title={AnimeData.title} onContextMenu={(event) => OpenContextMenu(CreateContextMenuOptions([{option:t("dialog.open"), onClick: sendToInformation}], CenterContextMenu), event)}>
      {AnimeData.coverImage && <img src={AnimeData.coverImage} className="card-image" onLoad={() => setLoading(() => false)} onError={() => setisError(() => true)} style={checkState()} />}
      {isLoading && isError == false && <div className="card-image-placeholder"><span className="material-symbols-outlined home-loading-animation">progress_activity</span></div>}
      {isError && <div className="card-image-placeholder"><span className="material-symbols-outlined">error</span></div>}
      <div className="card-title">{AnimeData.title}</div>
      {saveData && saveData.episode && <div className="card-continue-watch-text">{saveData.last_Time != 0 && saveData.type != "" ? t("history.continue", { ep: saveData.episode }) : t("history.history", { ep: saveData.episode })}</div>}
      {/* {deletionCard && <div className="card-delete-icon material-symbols-outlined" onClick={runDeletionFunction}>close</div>} */}
    </div>
  )
}

export default Card
