import { cardData, ContextMenuProps } from "@renderer/utils/types";
import "./css/card.css";
import { useNavigate } from "@solidjs/router";
import { JSX, Match, Show, Switch, createSignal, onMount, onCleanup } from "solid-js";
import { OpenContextMenu } from "@renderer/utils/context/ContextMenu";
import {
  addToAnimuList,
  convertSeconds,
  CreateContextMenuOptions,
  getGradientColor,
  removeFromAnimulist,
  SaveToClipboard,
} from "@renderer/utils/functions";
import { DeleteFromHistory, SaveHistory } from "@renderer/utils/FilesManager/history";
import { unwrap } from "solid-js/store";
import { removeToast, toast, updateToast } from "@renderer/utils/context/ToastNotification";
import { pluginManager } from "@renderer/utils/stores/plugins";
import { useI18n } from "@renderer/utils/i18n";
import { showCustomMenu } from "@renderer/utils/context/menuContext";
import { animulistData } from "@renderer/utils/stores/global";

interface CardProps {
  card: cardData;
  disableinformation?: boolean;
}

function Card(props: CardProps) {
  const { t, pathExist } = useI18n()

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
    if (props.card.onClick) {
      props.card.onClick(props.card.AnimeData);
      return;
    }

    if (props.card.saveData && props.card.saveData.episode != "" && (props.card.saveData.last_Time != 0 || props.card.saveData.isStarted)) {
      let idToast = toast(t("notification.episodesfetching"), { type: "loading", removeTimer: true })
      const currentPLugin = pluginManager().changePlugin(props.card.saveData.pluginName)
      const episodeList = await currentPLugin.extractOnlyEpisodesList(props.card.saveData.type, props.card.AnimeData.player_ID as string);

      if (episodeList.length <= 0) {
        updateToast(idToast, t("notification.episodesfailed"), { type: "error", removeTimer: false })
        return
      }

      localStorage.setItem("playerCache", JSON.stringify({
        data: (props.card.AnimeData),
        save: (props.card.saveData),
        episodelist: episodeList,
        continewatch: true,
      }))

      removeToast(idToast)
      navigate("/player");
      return;
    }

    if (props.card.AnimeData.id === "") {
      // np. extractInformation(props.card.AnimeData.player_ID)
      return;
    }

    localStorage.setItem("informationCache", JSON.stringify({ anime: props.card.AnimeData, saveData: props.card.saveData }))
    navigate("/info");
  }

  async function deleteCard() {
    if (props.card.saveData && props.card.saveData.episode != "" && (props.card.saveData.last_Time != 0 || props.card.saveData.isStarted)) {
      if (await SaveHistory(unwrap({
        ...props.card,
        saveData: {
          ...props.card.saveData,
          last_Time: 0,
          isStarted: false,
        }
      }))) {
        toast(t("history.continuesaved"), { type: "success" })
      } else toast(t("history.continuefailed"), { type: "error" })
    } else {
      if (await DeleteFromHistory(props.card)) toast(t("history.historysaved"), { type: "success" })
      else toast(t("history.historyfailed"), { type: "error" })
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
        SaveToClipboard("text", props.card.AnimeData.title.romaji),
    }
  ];

  if (props.card.AnimeData.coverImage) {
    CenterContextMenu.push({
      option: t("contextMenu.copycover"),
      onClick: () =>
        props.card.AnimeData.coverImage
          ? SaveToClipboard("image", props.card.AnimeData.coverImage)
          : "",
    })
  }

  if (animulistData().find((v) => v.AnimeData.id == props.card.AnimeData.id) && !props.disableinformation) {
    CenterContextMenu.push({
      option: "Remove From Anilist",
      onClick: () => removeFromAnimulist(props.card.AnimeData.id, true),
      deletion: true
    });
  } else if (!props.disableinformation) {
    CenterContextMenu.push({
      option: "Add To AnimuList",
      onClick: () =>
        showCustomMenu({
          title: `Add ${props.card.AnimeData.title.romaji}`, animuList: {
            anime: unwrap(props.card.AnimeData),
            save: (animulist, anime) => addToAnimuList(animulist, anime, true)
          }
        }),
    });
  }

  if (props.card.saveData) {
    CenterContextMenu.push({
      option: t("contextMenu.delete"),
      deletion: true,
      onClick: deleteCard,
    });
  }

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
    const time = convertSeconds(props.card.AnimeData.nextAiringEpisode?.timeUntilAiring);
    if (!time) return "";
    if (time.days != 0) return t("card_information.ep_airing_day", { day: time.days });
    if (time.hours != 0) return t("card_information.ep_airing_hours", { hours: time.hours });
    if (time.minutes != 0) return t("card_information.ep_airing_minutes", { min: time.minutes });
    return t("card_information.ep_airing_today");
  }

  function GenerateInformation() {
    const info: JSX.Element[] = [];

    if (props.card.AnimeData.averageScore) {
      info.push(
        <div
          class="card-information-score"
          style={{ border: `3px solid ${getGradientColor(props.card.AnimeData.averageScore)}` }}
        >
          {props.card.AnimeData.averageScore}%
        </div>
      );
    }

    if (props.card.AnimeData.nextAiringEpisode && !props.card.saveData) {
      info.push(
        <div class="card-information-text card-information-top">
          {t("card_information.ep_airing", {
            ep: props.card.AnimeData.nextAiringEpisode.episode,
            text: ConvertTimeToText(),
          })}
        </div>
      );
    }

    if ((!props.card.AnimeData.nextAiringEpisode || props.card.saveData) && props.card.AnimeData.season && props.card.AnimeData.seasonYear) {
      info.push(
        <div class="card-information-text card-information-top">
          {t(`anime_seasons.${props.card.AnimeData.season.toLowerCase()}`)} {props.card.AnimeData.seasonYear}
        </div>
      );
    } else if (!(props.card.AnimeData.season && props.card.AnimeData.seasonYear) && !props.card.AnimeData.nextAiringEpisode) {
      info.push(<div class="card-information-text card-information-top">TBA</div>);
    }

    if (props.card.animulist) {
      info.push(<div class="card-information-animulist-status">Status: {t(`animulist.status.${props.card.animulist.status}`)}</div>)
    }

    if (props.card.AnimeData.studios && props.card.AnimeData.studios.length > 0) {
      info.push(<div class="card-information-text">{props.card.AnimeData.studios[0]}</div>);
    } else if (props.card.AnimeData.status) {
      info.push(
        <div class="card-information-text">
          {t(`anime_statuses.${props.card.AnimeData.status.toLowerCase()}`)}
        </div>
      );
    }

    const bottom: JSX.Element[] = [];

    if (props.card.AnimeData.format && pathExist(`anime_formats.${props.card.AnimeData.format.toLowerCase()}`)) {
      bottom.push(t(`anime_formats.${props.card.AnimeData.format.toLowerCase()}`));
    } else if (props.card.AnimeData.format && pathExist(`anime_genres.${props.card.AnimeData.format.toLowerCase()}`)) {
      bottom.push(t(`anime_genres.${props.card.AnimeData.format.toLowerCase()}`))
    } else if (props.card.AnimeData.type) {
      bottom.push(t(`anime_source.${props.card.AnimeData.type.toLowerCase().replaceAll("_", "")}`));
    }

    if (props.card.AnimeData.episodes && props.card.AnimeData.format?.toUpperCase() != "MOVIE") {
      bottom.push(
        <>
          {bottom.length !== 0 && <span class="card-dot">·</span>}
          {t("card_information.episodes", { ep: props.card.AnimeData.episodes })}
        </>
      );
    } else if (props.card.AnimeData.duration) {
      bottom.push(
        <>
          {bottom.length !== 0 && <span class="card-dot">·</span>}
          {t("card_information.minutes", { min: props.card.AnimeData.duration })}
        </>
      );
    }

    info.push(<div class="card-information-text">{bottom}</div>);
    return info;
  }

  return (
    <div
      tabIndex={-1}
      ref={cardRef}
      class="card-container"
      onClick={sendToInformation}
      onMouseOver={checkOutOfBound}
      title={props.card.AnimeData.title.romaji}
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
      <Show when={!props.disableinformation && props.card.AnimeData.studios && props.card.AnimeData.status && props.card.AnimeData.genres && props.card.AnimeData.description}>
        <div class={`card-information ${isOut() ? "card-information-left" : "card-information-right"}`}>
          {GenerateInformation()}
        </div>
      </Show>
      <Show when={props.card.AnimeData.coverImage && isCardVisible()}>
        <img
          src={props.card.AnimeData.coverImage}
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
      <div class="card-title">{props.card.AnimeData.title.romaji}</div>
      <Show when={props.card.saveData && props.card.saveData.episode}>
        <Show when={props.card.saveData?.last_Time != 0 && props.card.saveData?.type != ""} fallback={<div class="card-continue-watch-text">{t("history.history", { ep: props.card.saveData?.episode })}</div>}>
          <div class="card-continue-watch-text">{t("history.continue", { ep: props.card.saveData?.episode })}</div>
        </Show>
      </Show>
    </div>
  );
};

export default Card;
