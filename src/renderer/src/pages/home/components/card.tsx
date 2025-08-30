import { cardData, ContextMenuProps } from "@renderer/utils/GlobalInterface";
import "./css/card.css";
import { useNavigate } from "react-router-dom";
import { JSX, useRef, useState } from "react";
import { t } from "i18next";
import { useSelector } from "react-redux";
import { OpenContextMenu } from "@renderer/utils/context/ContextMenu";
import {
  capitalizeFirstLetter,
  convertSeconds,
  CreateContextMenuOptions,
  getGradientColor,
} from "@renderer/utils/functions";
import { extractInformation } from "@renderer/plugins/allmanga";

const Card: React.FC<cardData> = ({
  AnimeData,
  saveData,
  deletionCard,
  onClick,
}) => {
  const navigate = useNavigate();
  const [isLoading, setLoading] = useState<boolean>(true);
  const [isError, setisError] = useState<boolean>(false);
  const pluginPlayer = useSelector((plugin: any) => plugin.plugin.playerPlugin);
  const [isOut, setisOut] = useState<boolean>(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  async function sendToInformation() {
    if (onClick) {
      onClick(AnimeData);
      return;
    }
    if (
      saveData &&
      saveData.episode != "" &&
      saveData.last_Time != 0 &&
      saveData.type != ""
    ) {
      navigate("/player", {
        state: {
          data: {
            AnimeData: AnimeData,
            saveData: saveData,
          },
          episodelist: await pluginPlayer.player.episodeList(
            saveData.type,
            AnimeData.player_ID
          ),
          continueWatch: true
        },
      });
      return;
    }

    if (AnimeData.id === "") {
      navigate("/info", {
        state: await extractInformation(AnimeData.player_ID ? AnimeData.player_ID : ""),
      });
      return;
    }

    navigate("/info", {
      state: AnimeData,
    });
  }

  // function runDeletionFunction(event) {
  //   event.preventDefault()
  //   event.stopPropagation()
  //   if (deletionCard) deletionCard()
  // }

  function checkState() {
    if (isLoading) return { display: "none" };
    if (isError) return { display: "none" };
    return { animation: "fadeIn 0.3s forwards" };
  }

  let CenterContextMenu: ContextMenuProps = [
    {
      option: t("contextMenu.copytitle"),
      onClick: () => window.api.saveToClipboard("text", AnimeData.title.romaji),
    },
    {
      option: t("contextMenu.copycover"),
      onClick: () =>
        AnimeData.coverImage
          ? window.api.saveToClipboard("image", AnimeData.coverImage)
          : "",
    },
  ];

  if (deletionCard) {
    CenterContextMenu.push({
      option: t("contextMenu.delete"),
      deletion: true,
      onClick: deletionCard,
    });
  }

  function checkOutOfBound() {
    if (!cardRef.current) return;
    const infoRect = cardRef.current.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const cardLeft = infoRect.left;
    if (windowWidth - cardLeft < 500) {
      setisOut(() => true);
    } else {
      setisOut(() => false);
    }
  }

  function ConvertTimeToText(): string {
    const time = convertSeconds(AnimeData.nextAiringEpisode?.timeUntilAiring);
    if (time?.days != 0) {
      return t("card_information.ep_airing_day", { day: time?.days })
    }
    if (time.hours != 0) {
      return t("card_information.ep_airing_hours", { hours: time?.hours })
    }
    if (time.minutes != 0) {
      return t("card_information.ep_airing_minutes", { min: time?.minutes })
    }
    return t("card_information.ep_airing_today")
  }


  function GenerateInformation() {
    if (!AnimeData.studios && !AnimeData.status && !AnimeData.genres && !AnimeData.description) return undefined
    let information: JSX.Element[] = []
    if (AnimeData.averageScore) {
      information = [ ...information, <div className="card-information-score" style={{border: `3px solid ${getGradientColor(AnimeData.averageScore)}`}}>{AnimeData.averageScore}%</div> ]
    }
    if (AnimeData.nextAiringEpisode && !saveData) {
      information = [ ...information, <div className="card-information-text card-information-top">{t("card_information.ep_airing", { ep: AnimeData.nextAiringEpisode.episode, text: ConvertTimeToText() })}</div> ]
    }
    if ((!AnimeData.nextAiringEpisode || saveData) && (AnimeData.season && AnimeData.seasonYear)) {
      information = [ ...information, <div className="card-information-text card-information-top">{t(`anime_seasons.${AnimeData.season.toLowerCase()}`)} {AnimeData.seasonYear}</div>]
    } else if (!(AnimeData.season && AnimeData.seasonYear) && !AnimeData.nextAiringEpisode) {
      information = [ ...information, <div className="card-information-text card-information-top">TBA</div>]
    }
    if (AnimeData.studios.length > 0) {
      information = [ ...information, <div className="card-information-text">{AnimeData.studios[0]}</div> ]
    }
    if (AnimeData.studios.length <= 0 && AnimeData.status) {
      information = [ ...information, <div className="card-information-text">{t(`anime_statuses.${AnimeData.status.toLowerCase()}`)}</div> ]
    }
    let bottom: JSX.Element[] = []
    if (AnimeData.format) {
      bottom = [ ...bottom, <>{capitalizeFirstLetter(AnimeData.format)}</> ]
    }
    if (!AnimeData.format && AnimeData.type) {
      bottom = [ ...bottom, <>{capitalizeFirstLetter(AnimeData.type)}</> ]
    }
    if (AnimeData.episodes && AnimeData.format?.toUpperCase() != "MOVIE") {
      bottom = [ ...bottom, <>{bottom.length !== 0 && <span className="card-dot">·</span>}{t("card_information.episodes", { ep: AnimeData.episodes })}</> ]
    } else if (AnimeData.duration) {
      bottom = [ ...bottom, <>{bottom.length !== 0 && <span className="card-dot">·</span>}{t("card_information.minutes", { min: AnimeData.duration })}</> ]
    }
    information = [ ...information, <div className="card-information-text">{bottom}</div> ]
    return <>{information}</>
  }

  return (
    <div
      ref={cardRef}
      className="card-container"
      onClick={sendToInformation}
      onMouseOver={checkOutOfBound}
      title={AnimeData.title.romaji}
      onContextMenu={(event) =>
        OpenContextMenu(
          CreateContextMenuOptions(
            [{ option: t("dialog.open"), onClick: sendToInformation }],
            CenterContextMenu
          ),
          event
        )
      }
    >
      {GenerateInformation() && <div
        className={`card-information ${isOut ? "card-information-left" : "card-information-right"}`}
      >
        {GenerateInformation()}
      </div>}
      {AnimeData.coverImage && (
        <img
          src={AnimeData.coverImage}
          className="card-image"
          onLoad={() => setLoading(() => false)}
          onError={() => setisError(() => true)}
          style={checkState()}
        />
      )}
      {isLoading && isError == false && (
        <div className="card-image-placeholder">
          <span className="material-symbols-outlined home-loading-animation">
            progress_activity
          </span>
        </div>
      )}
      {isError && (
        <div className="card-image-placeholder">
          <span className="material-symbols-outlined">error</span>
        </div>
      )}
      <div className="card-title">{AnimeData.title.romaji}</div>
      {saveData && saveData.episode && (
        <div className="card-continue-watch-text">
          {saveData.last_Time != 0 && saveData.type != ""
            ? t("history.continue", { ep: saveData.episode })
            : t("history.history", { ep: saveData.episode })}
        </div>
      )}
      {/* {deletionCard && <div className="card-delete-icon material-symbols-outlined" onClick={runDeletionFunction}>close</div>} */}
    </div>
  );
};

export default Card;
