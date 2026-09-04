import { cardData, ContextMenuProps } from "@renderer/utils/types";
import "./css/card.css";
import { useNavigate } from "@solidjs/router";
import { JSX, Show } from "solid-js";
import { OpenContextMenu } from "@renderer/utils/context/ContextMenu";
import {
  convertSeconds,
  detectTitleConfig,
  getGradientColor,
  SaveToClipboard,
} from "@renderer/utils/functions";
import { DeleteFromHistory, SaveHistory } from "@renderer/utils/FilesManager/history";
import { createStore } from "solid-js/store";
import { removeToast, toast, updateToast } from "@renderer/utils/context/ToastNotification";
import { useI18n } from "@renderer/utils/i18n";
import { showCustomMenu } from "@renderer/utils/context/menuContext";
import { animulistData, informationCache, PlayerCache } from "@renderer/utils/stores/global";
import { addToAnimuList, removeFromAnimulist } from "@renderer/utils/FilesManager/animulist";
import AnimulistMenu from "@renderer/components/animulistMenu";
import pluginManager from "@renderer/utils/pluginManager";


interface CardProps {
  card: cardData;
  disableinformation?: boolean;
  containerClick?: () => void;
  small?: boolean
}

function Card(props: CardProps) {
  const { t, pathExist } = useI18n()

  const title = detectTitleConfig(props.card.AnimeData.title)
  const animelist = animulistData().get(props.card.AnimeData.id)

  const navigate = useNavigate();
  const [cardVariables, setVariables] = createStore({
    animulist: props.card.animulist ? props.card.animulist : animelist ? animelist["animulist"] : undefined,
    isInformationBoxOut: false,
  })

  let cardRef: HTMLDivElement | undefined;
  let informationBox: JSX.Element[] = []

  async function sendToInformation() {
    if (props.containerClick) props.containerClick()

    if (props.card.onClick) {
      props.card.onClick(props.card.AnimeData);
      return;
    }

    if (props.card.saveData && props.card.saveData.episode != "" && (props.card.saveData.last_Time != 0 || props.card.saveData.isStarted)) {
      let idToast = toast(t("notification.episodesfetching"), { type: "loading", timer: true })
      const currentPLugin = await pluginManager.changePlayerPlugin(props.card.saveData.pluginName)
      const episodeList = await currentPLugin.extractOnlyEpisodesList(props.card.saveData.type, props.card.AnimeData.player_ID as string).catch((error) => {
        console.error("currentPLugin.extractOnlyEpisodesList", error)
        return []
      });

      if (episodeList.length <= 0) {
        updateToast(idToast, t("notification.episodesfailed"), { type: "error", timer: false })
        return
      }

      PlayerCache.update({
        anime: (props.card.AnimeData),
        saveData: (props.card.saveData),
        animulist: cardVariables.animulist,
        episodelist: episodeList,
        continewatch: true,
      })

      removeToast(idToast)
      navigate("/player");
      return;
    }

    if (props.card.AnimeData.id === "") {
      toast("This Anime Dosen't Have Anilist ID this may have make weird bugs", { type: "warning" })
    }

    informationCache.update({
      anime: props.card.AnimeData,
      saveData: props.card.saveData,
      animulist: cardVariables.animulist
    })
    
    navigate("/info");
  }

  async function deleteCard() {
    if (props.card.saveData && props.card.saveData.episode != "" && (props.card.saveData.last_Time != 0 || props.card.saveData.isStarted)) {
      if (await SaveHistory({
        ...props.card,
        saveData: {
          ...props.card.saveData,
          last_Time: 0,
          isStarted: false,
        }
      })) {
        toast(t("history.continuesaved"), { type: "success" })
      } else toast(t("history.continuefailed"), { type: "error" })
    } else {
      if (await DeleteFromHistory(props.card)) toast(t("history.historysaved"), { type: "success" })
      else toast(t("history.historyfailed"), { type: "error" })
    }
  }

  let CenterContextMenu: ContextMenuProps = [
    {
      option: t("contextMenu.copytitle"),
      onClick: () =>
        SaveToClipboard("text", title),
    }
  ];

  // if (props.card.AnimeData.coverImage) {
  //   CenterContextMenu.push({
  //     option: t("contextMenu.copycover"),
  //     onClick: () =>
  //       props.card.AnimeData.coverImage
  //         ? SaveToClipboard("image", props.card.AnimeData.coverImage)
  //         : "",
  //   })
  // }

  if (cardVariables.animulist && !props.disableinformation) {
    CenterContextMenu.push({
      option: "Remove From Anilist",
      onClick: () => removeFromAnimulist(props.card.AnimeData.id, true),
      deletion: true
    });
  } else if (!props.disableinformation) {
    CenterContextMenu.push({
      option: "Add To AnimuList",
      onClick: () =>
        showCustomMenu(AnimulistMenu({
          anime: props.card.AnimeData,
          save: (animulist, anime) => addToAnimuList(animulist, anime, true)
        })),
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

    setVariables({ isInformationBoxOut: windowWidth - infoRect.left < 500 })
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
          {t(`anime_seasons.${props.card.AnimeData.season}`)} {props.card.AnimeData.seasonYear}
        </div>
      );
    } else if (!(props.card.AnimeData.season && props.card.AnimeData.seasonYear) && !props.card.AnimeData.nextAiringEpisode) {
      info.push(<div class="card-information-text card-information-top">TBA</div>);
    }

    if (cardVariables.animulist) {
      info.push(<div class="card-information-animulist-status">Status: {t(`animulist.status.${cardVariables.animulist.status}`)}</div>)
    }

    if (props.card.AnimeData.studios && props.card.AnimeData.studios.length > 0) {
      info.push(<div class="card-information-text">{props.card.AnimeData.studios[0]}</div>);
    } else if (props.card.AnimeData.status) {
      info.push(
        <div class="card-information-text">
          {t(`anime_statuses.${props.card.AnimeData.status}`)}
        </div>
      );
    }

    const bottom: JSX.Element[] = [];

    if (props.card.AnimeData.format && pathExist(`anime_formats.${props.card.AnimeData.format}`)) {
      bottom.push(t(`anime_formats.${props.card.AnimeData.format}`));
    } else if (props.card.AnimeData.format && pathExist(`anime_genres.${props.card.AnimeData.format}`)) {
      bottom.push(t(`anime_genres.${props.card.AnimeData.format}`))
    } else if (props.card.AnimeData.type) {
      bottom.push(t(`anime_source.${props.card.AnimeData.type}`));
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

  if (!props.disableinformation && props.card.AnimeData.studios && props.card.AnimeData.status && props.card.AnimeData.genres && props.card.AnimeData.description) {
    informationBox = GenerateInformation()
  }

  return (
    <div
      tabIndex={-1}
      ref={(v) => {
        cardRef = v
      }}
      class={`card-container show ${props.small ? "small" : ""}`}
      onClick={sendToInformation}
      onMouseOver={checkOutOfBound}
      title={title}
      onContextMenu={(event) =>
        OpenContextMenu(event, { start: [{ option: t("dialog.open"), onClick: sendToInformation }], center: CenterContextMenu })
      }
    >
      <Show when={informationBox.length > 0}>
        <div class={`card-information ${cardVariables.isInformationBoxOut ? "card-information-left" : "card-information-right"}`}>
          {informationBox}
        </div>
      </Show>

      <Show when={props.card.saveData}>
        <span class="card-episode-mark">
          Ep {props.card.saveData!["episode"]}
        </span>
      </Show>

      <sheep-img
        src={props.card.AnimeData.coverImage}
        class="card-image"
        divClass="card-image-placeholder"
      />

      <Show when={props.card.saveData && props.card.saveData["last_Time"] > 0 && (props.card.saveData["duration"] || props.card.AnimeData.duration)}>
        <div class="card-episode-seekbar-container">
          <span style={{
            width: props.card.AnimeData.duration ? `${(props.card.saveData!["last_Time"] / (props.card.AnimeData.duration * 60)) * 100}%` :
              `${(props.card.saveData!["last_Time"] / props.card.saveData!["duration"]!) * 100}%`
          }} class="card-episode-progress"></span>
        </div>
      </Show>

      <div class="card-title">{title}</div>

      <Show when={props.card.saveData && props.card.saveData.episode}>
        <Show when={props.card.saveData?.last_Time != 0 && props.card.saveData?.type != ""} fallback={<div class="card-continue-watch-text">{t("history.history", { ep: props.card.saveData?.episode })}</div>}>
          <div class="card-continue-watch-text">{t("history.continue", { ep: props.card.saveData?.episode })}</div>
        </Show>
      </Show>
    </div>
  );
};

export default Card;
