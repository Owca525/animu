import { cardData, ContextMenuProps } from "@renderer/utils/types";
import "./css/card.css";
import { useNavigate } from "@solidjs/router";
import { Component, JSX, Match, Show, Switch, createSignal } from "solid-js";
import { t } from "i18next";
import { OpenContextMenu } from "@renderer/utils/context/ContextMenu";
import {
  convertSeconds,
  CreateContextMenuOptions,
  getGradientColor,
} from "@renderer/utils/functions";
import { ChangePlugin } from "@renderer/utils/pluginApi";

interface CardProps {
  card: cardData;
  disableinformation?: boolean;
}

const Card: Component<CardProps> = ({ card, disableinformation }) => {
  const navigate = useNavigate();
  const [isLoading, setLoading] = createSignal(true);
  const [isError, setIsError] = createSignal(false);
  const [isOut, setIsOut] = createSignal(false);
  let cardRef: HTMLDivElement | undefined;

  async function sendToInformation() {
    if (card.onClick) {
      card.onClick(card.AnimeData);
      return;
    }

    if (card.saveData && card.saveData.episode != "" && card.saveData.last_Time != 0) {
      const currentPLugin = ChangePlugin(card.saveData.pluginName)
      const episodeList = currentPLugin.player.extractOnlyEpisodesList(card.saveData.type, card.AnimeData.player_ID as string);

      navigate("/player", {
        state: {
          data: JSON.parse(JSON.stringify(card.AnimeData)),
          save: JSON.parse(JSON.stringify(card.saveData)),
          episodelist: episodeList,
        },
      });
      return;
    }

    if (card.AnimeData.id === "") {
      // np. extractInformation(card.AnimeData.player_ID)
      return;
    }

    navigate("/info", {
      state: { anime: JSON.parse(JSON.stringify(card.AnimeData)) },
    });
  }

  function checkState() {
    if (isLoading()) return { display: "none" };
    if (isError()) return { display: "none" };
    return { animation: "fadeIn 0.3s forwards" };
  }

  const CenterContextMenu: ContextMenuProps = [
    {
      option: t("contextMenu.copytitle"),
      onClick: () =>
        window.api.saveToClipboard("text", card.AnimeData.title.romaji),
    },
    {
      option: t("contextMenu.copycover"),
      onClick: () =>
        card.AnimeData.coverImage
          ? window.api.saveToClipboard("image", card.AnimeData.coverImage)
          : "",
    },
  ];

  function checkOutOfBound() {
    if (!cardRef) return;
    const infoRect = cardRef.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    if (windowWidth - infoRect.left < 500) {
      setIsOut(true);
    } else {
      setIsOut(false);
    }
  }

  function ConvertTimeToText(): string {
    const time = convertSeconds(card.AnimeData.nextAiringEpisode?.timeUntilAiring);
    if (!time) return "";
    if (time.days != 0) return t("card_information.ep_airing_day", { day: time.days });
    if (time.hours != 0) return t("card_information.ep_airing_hours", { hours: time.hours });
    if (time.minutes != 0) return t("card_information.ep_airing_minutes", { min: time.minutes });
    return t("card_information.ep_airing_today");
  }

  function GenerateInformation() {
    const info: JSX.Element[] = [];

    if (card.AnimeData.averageScore) {
      info.push(
        <div
          class="card-information-score"
          style={{ border: `3px solid ${getGradientColor(card.AnimeData.averageScore)}` }}
        >
          {card.AnimeData.averageScore}%
        </div>
      );
    }

    if (card.AnimeData.nextAiringEpisode && !card.saveData) {
      info.push(
        <div class="card-information-text card-information-top">
          {t("card_information.ep_airing", {
            ep: card.AnimeData.nextAiringEpisode.episode,
            text: ConvertTimeToText(),
          })}
        </div>
      );
    }

    if ((!card.AnimeData.nextAiringEpisode || card.saveData) && card.AnimeData.season && card.AnimeData.seasonYear) {
      info.push(
        <div class="card-information-text card-information-top">
          {t(`anime_seasons.${card.AnimeData.season.toLowerCase()}`)} {card.AnimeData.seasonYear}
        </div>
      );
    } else if (!(card.AnimeData.season && card.AnimeData.seasonYear) && !card.AnimeData.nextAiringEpisode) {
      info.push(<div class="card-information-text card-information-top">TBA</div>);
    }

    if (card.AnimeData.studios.length > 0) {
      info.push(<div class="card-information-text">{card.AnimeData.studios[0]}</div>);
    } else if (card.AnimeData.status) {
      info.push(
        <div class="card-information-text">
          {t(`anime_statuses.${card.AnimeData.status.toLowerCase()}`)}
        </div>
      );
    }

    const bottom: JSX.Element[] = [];

    if (card.AnimeData.format) {
      bottom.push(<>{t(`anime_formats.${card.AnimeData.format.toLowerCase()}`)}</>);
    } else if (card.AnimeData.type) {
      bottom.push(<>{t(`anime_source.${card.AnimeData.type.toLowerCase().replaceAll("_", "")}`)}</>);
    }

    if (card.AnimeData.episodes && card.AnimeData.format?.toUpperCase() != "MOVIE") {
      bottom.push(
        <>
          {bottom.length !== 0 && <span class="card-dot">·</span>}
          {t("card_information.episodes", { ep: card.AnimeData.episodes })}
        </>
      );
    } else if (card.AnimeData.duration) {
      bottom.push(
        <>
          {bottom.length !== 0 && <span class="card-dot">·</span>}
          {t("card_information.minutes", { min: card.AnimeData.duration })}
        </>
      );
    }

    info.push(<div class="card-information-text">{bottom}</div>);
    return <>{info}</>;
  }

  return (
    <div
      tabIndex={-1}
      ref={cardRef}
      class="card-container"
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
      <Show when={!disableinformation && card.AnimeData.studios && card.AnimeData.status && card.AnimeData.genres && card.AnimeData.description}>
          <div class={`card-information ${isOut() ? "card-information-left" : "card-information-right"}`}>
            {GenerateInformation()}
          </div>
      </Show>
      <Switch>
        <Match when={card.AnimeData.coverImage}>
          <img
            src={card.AnimeData.coverImage}
            class="card-image"
            onLoad={() => setLoading(false)}
            onError={() => setIsError(true)}
            style={checkState()}
          />
        </Match>
        <Match when={isLoading()}>
          <div class="card-image-placeholder">
            <span class="material-symbols-outlined home-loading-animation">progress_activity</span>
          </div>
        </Match>
        <Match when={isError()}>
          <div class="card-image-placeholder">
            <span class="material-symbols-outlined">error</span>
          </div>
        </Match>
      </Switch>
      <div class="card-title">{card.AnimeData.title.romaji}</div>
      <Show when={card.saveData && card.saveData.episode}>
        <Show when={card.saveData?.last_Time != 0 && card.saveData?.type != ""} fallback={t("history.history", { ep: card.saveData?.episode })}>
          {t("history.continue", { ep: card.saveData?.episode })}
        </Show>
      </Show>
    </div>
  );
};

export default Card;
