import { cardData, ContextMenuProps, SettingsConfig } from "@renderer/utils/GlobalInterface";
import "./css/card.css";
import { useNavigate } from "react-router-dom";
import { JSX, useRef, useState } from "react";
import { t } from "i18next";
import { useSelector } from "react-redux";
import { OpenContextMenu } from "@renderer/utils/context/ContextMenu";
import {
  convertSeconds,
  CreateContextMenuOptions,
  getGradientColor,
} from "@renderer/utils/functions";
// import { extractInformation } from "@renderer/plugins/allmanga";
import { ChangePlugin } from "@renderer/utils/pluginApi";
import store from "@renderer/utils/store";

const Card: React.FC<{ card: cardData, disableinformation?: boolean }> = ({ card, disableinformation = false }) => {
  const navigate = useNavigate();
  const [isLoading, setLoading] = useState<boolean>(true);
  const [isError, setisError] = useState<boolean>(false);
  const [isOut, setisOut] = useState<boolean>(false);
  const config: SettingsConfig = useSelector((data: any) => data.config);
  const cardRef = useRef<HTMLDivElement | null>(null);

  async function sendToInformation() {
    if (card.onClick) {
      card.onClick(card.AnimeData);
      return;
    }

    if (card.saveData && card.saveData.last_Time != 0 && card.saveData.pluginName == config.plugins.player) {
      await ChangePlugin(card.saveData.pluginName)
    }

    if (
      card.saveData &&
      card.saveData.episode != "" &&
      card.saveData.last_Time != 0
    ) {
      if (config.plugins.player != card.saveData.pluginName) await ChangePlugin(card.saveData.pluginName)
      let episodeList = await store.getState().plugin.playerPlugin.player.episodeList(
        card.saveData.type,
        card.AnimeData.player_ID
      )
      navigate("/player", {
        state: {
          data: {
            AnimeData: card.AnimeData,
            saveData: {...card.saveData, pluginName: card.saveData.pluginName == "" ? "Allmanga" : ""},
          },
          episodelist: episodeList,
          continueWatch: true
        },
      });
      return;
    }

    if (card.AnimeData.id === "") {
      // navigate("/info", {
      //   state: await extractInformation(card.AnimeData.player_ID ? card.AnimeData.player_ID : ""),
      // });
      return;
    }

    navigate("/info", {
      state: { anime: card.AnimeData, saveData: card.saveData },
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
      onClick: () => window.api.saveToClipboard("text", card.AnimeData.title.romaji),
    },
    {
      option: t("contextMenu.copycover"),
      onClick: () =>
        card.AnimeData.coverImage
          ? window.api.saveToClipboard("image", card.AnimeData.coverImage)
          : "",
    },
  ];

  if (card.deletionCard) {
    CenterContextMenu.push({
      option: t("contextMenu.delete"),
      deletion: true,
      onClick: card.deletionCard,
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
    const time = convertSeconds(card.AnimeData.nextAiringEpisode?.timeUntilAiring);
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
    if (disableinformation) return
    if (!card.AnimeData.studios && !card.AnimeData.status && !card.AnimeData.genres && !card.AnimeData.description) return undefined
    let information: JSX.Element[] = []
    if (card.AnimeData.averageScore) {
      information = [...information, <div className="card-information-score" style={{ border: `3px solid ${getGradientColor(card.AnimeData.averageScore)}` }}>{card.AnimeData.averageScore}%</div>]
    }
    if (card.AnimeData.nextAiringEpisode && !card.saveData) {
      information = [...information, <div className="card-information-text card-information-top">{t("card_information.ep_airing", { ep: card.AnimeData.nextAiringEpisode.episode, text: ConvertTimeToText() })}</div>]
    }
    if ((!card.AnimeData.nextAiringEpisode || card.saveData) && (card.AnimeData.season && card.AnimeData.seasonYear)) {
      information = [...information, <div className="card-information-text card-information-top">{t(`anime_seasons.${card.AnimeData.season.toLowerCase()}`)} {card.AnimeData.seasonYear}</div>]
    } else if (!(card.AnimeData.season && card.AnimeData.seasonYear) && !card.AnimeData.nextAiringEpisode) {
      information = [...information, <div className="card-information-text card-information-top">TBA</div>]
    }
    if (card.AnimeData.studios.length > 0) {
      information = [...information, <div className="card-information-text">{card.AnimeData.studios[0]}</div>]
    }
    if (card.AnimeData.studios.length <= 0 && card.AnimeData.status) {
      information = [...information, <div className="card-information-text">{t(`anime_statuses.${card.AnimeData.status.toLowerCase()}`)}</div>]
    }
    let bottom: JSX.Element[] = []
    if (card.AnimeData.format) {
      bottom = [...bottom, <>{t(`anime_formats.${card.AnimeData.format.toLowerCase()}`)}</>]
    }
    if (!card.AnimeData.format && card.AnimeData.type) {
      bottom = [...bottom, <>{t(`anime_source.${card.AnimeData.type.toLowerCase().replaceAll("_", "")}`)}</>]
    }
    if (card.AnimeData.episodes && card.AnimeData.format?.toUpperCase() != "MOVIE") {
      bottom = [...bottom, <>{bottom.length !== 0 && <span className="card-dot">·</span>}{t("card_information.episodes", { ep: card.AnimeData.episodes })}</>]
    } else if (card.AnimeData.duration) {
      bottom = [...bottom, <>{bottom.length !== 0 && <span className="card-dot">·</span>}{t("card_information.minutes", { min: card.AnimeData.duration })}</>]
    }
    information = [...information, <div className="card-information-text">{bottom}</div>]
    return <>{information}</>
  }

  return (
    <div
      tabIndex={-1}
      ref={cardRef}
      className="card-container"
      onClick={sendToInformation}
      onMouseOver={checkOutOfBound}
      title={card.AnimeData.title.romaji}
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
      {card.AnimeData.coverImage && (
        <img
          src={card.AnimeData.coverImage}
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
      <div className="card-title">{card.AnimeData.title.romaji}</div>
      {card.saveData && card.saveData.episode && (
        <div className="card-continue-watch-text">
          {card.saveData.last_Time != 0 && card.saveData.type != ""
            ? t("history.continue", { ep: card.saveData.episode })
            : t("history.history", { ep: card.saveData.episode })}
        </div>
      )}
      {/* {deletionCard && <div className="card-delete-icon material-symbols-outlined" onClick={runDeletionFunction}>close</div>} */}
    </div>
  );
};

export default Card;
