import { cardData, ContextMenuProps } from "@renderer/utils/types";
import "./css/card.css";
import { useNavigate } from "@solidjs/router";
import { Component, JSX, Match, Show, Switch, createSignal, onMount, onCleanup } from "solid-js";
import { t } from "i18next";
import { OpenContextMenu } from "@renderer/utils/context/ContextMenu";
import {
  convertSeconds,
  CreateContextMenuOptions,
  getGradientColor,
  SaveToClipboard,
} from "@renderer/utils/functions";
import { DeleteFromHistory, SaveHistory } from "@renderer/utils/FilesManager/history";
import { unwrap } from "solid-js/store";
import { removeToast, toast } from "@renderer/utils/context/ToastNotification";
import { pluginManager } from "@renderer/utils/stores/plugins";

interface CardProps {
  card: cardData;
  disableinformation?: boolean;
}

const Card: Component<CardProps> = ({ card, disableinformation }) => {
  const navigate = useNavigate();
  const [isLoading, setLoading] = createSignal(true);
  const [isError, setIsError] = createSignal(false);
  const [isOut, setIsOut] = createSignal(false);
  const [isCardVisible, setCardVisible] = createSignal(false);
  let cardRef: HTMLDivElement | undefined;

  onMount(() => {
    if (!cardRef) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("show", entry.isIntersecting)
          setCardVisible(entry.isIntersecting)
          if (entry.isIntersecting) observer.unobserve(entry.target)
        });
      },
      {
        rootMargin: "200px",
        threshold: 0,
      }
    );

    observer.observe(cardRef);

    onCleanup(() => observer.disconnect());
  })

  async function sendToInformation() {
    if (card.onClick) {
      card.onClick(card.AnimeData);
      return;
    }

    if (card.saveData && card.saveData.episode != "" && (card.saveData.last_Time != 0 || card.saveData.isStarted)) {
      let idToast = toast("Fetching Episode List", { type: "loading", removeTimer: true })
      const currentPLugin = pluginManager().changePlugin(card.saveData.pluginName)
      const episodeList = await currentPLugin.extractOnlyEpisodesList(card.saveData.type, card.AnimeData.player_ID as string);

      localStorage.setItem("playerCache", JSON.stringify({
        data: (card.AnimeData),
        save: (card.saveData),
        episodelist: episodeList,
      }))
      
      removeToast(idToast)
      navigate("/player");
      return;
    }

    if (card.AnimeData.id === "") {
      // np. extractInformation(card.AnimeData.player_ID)
      return;
    }

    localStorage.setItem("informationCache", JSON.stringify({ anime: card.AnimeData, saveData: card.saveData }))
    navigate("/info");
  }

  function deleteCard() {
    if (card.saveData && card.saveData.episode != "" && (card.saveData.last_Time != 0 || card.saveData.isStarted)) {
      SaveHistory(unwrap({
        ...card,
        saveData: {
          ...card.saveData,
          last_Time: 0,
          isStarted: false,
        }
      }))
    } else {
      DeleteFromHistory(card)
    }
  }

  function checkState() {
    if (isLoading()) return { display: "none" };
    if (isError()) return { display: "none" };
    return { animation: "fadeIn 0.3s forwards" };
  }

  let CenterContextMenu: ContextMenuProps = [
    {
      option: t("contextMenu.copytitle"),
      onClick: () =>
        SaveToClipboard("text", card.AnimeData.title.romaji),
    }
  ];

  if (card.AnimeData.coverImage) {
    CenterContextMenu.push({
      option: t("contextMenu.copycover"),
      onClick: () =>
        card.AnimeData.coverImage
          ? SaveToClipboard("image", card.AnimeData.coverImage)
          : "",
    })
  }

  CenterContextMenu.push({
    option: t("contextMenu.delete"),
    deletion: true,
    onClick: deleteCard,
  });

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
      <Show when={card.AnimeData.coverImage && isCardVisible()}>
        <img
          src={card.AnimeData.coverImage}
          class="card-image"
          onLoad={() => setLoading(false)}
          onError={() => setIsError(true)}
          style={checkState()}
        />
      </Show>
      <Switch>
        <Match when={isLoading()}>
          <div class="card-image-placeholder">
            <span class="material-symbols-outlined loading-animation icon">progress_activity</span>
          </div>
        </Match>
        <Match when={isError()}>
          <div class="card-image-placeholder">
            <span class="material-symbols-outlined icon">error</span>
          </div>
        </Match>
      </Switch>
      <div class="card-title">{card.AnimeData.title.romaji}</div>
      <Show when={card.saveData && card.saveData.episode}>
        <Show when={card.saveData?.last_Time != 0 && card.saveData?.type != ""} fallback={<div class="card-continue-watch-text">{t("history.history", { ep: card.saveData?.episode })}</div>}>
          <div class="card-continue-watch-text">{t("history.continue", { ep: card.saveData?.episode })}</div>
        </Show>
      </Show>
    </div>
  );
};

export default Card;
