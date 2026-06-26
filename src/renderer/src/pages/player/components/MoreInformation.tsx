import { convertSecondsToHoursFormat, decodeHtmlEntities, detectTitleConfig } from "@renderer/utils/functions";
import { t } from "@renderer/utils/i18n";
import { AnimeData } from "@renderer/utils/types";
import { For, Show } from "solid-js";

export default function MoreInformation(props: { isActive: boolean, anime: AnimeData, durration: number, episode: string, episodesLen: number }) {
    const title = detectTitleConfig(props.anime.title)

    if (!props.anime.coverImage && !props.anime.format && !props.anime.genres && !props.anime.description && !props.anime.averageScore) return

    return (
        <div class={`player-more-information-background ${props.isActive ? "show" : "hidden"}`}>
            <div class="player-more-information-container">
                <span class="player-more-information-top-text">{t("Current Watching")}</span>
                <sheep-img src={props.anime.coverImage} class="player-more-information-image" />
                <span class="player-more-information-title">{title}</span>
                <div class="player-more-information-format-container">
                    <Show when={props.anime.season || props.anime.seasonYear}>
                        <span class="player-more-information-season">
                            <Show when={props.anime.season}>
                                {t(`anime_seasons.${props.anime.season}`)}
                                &nbsp;
                            </Show>
                            <Show when={props.anime.seasonYear}>
                                {props.anime.seasonYear}
                            </Show>
                        </span>
                        &#8226;
                    </Show>
                    <Show when={props.anime.format}>
                        <span class="player-more-information-format">{t(`anime_formats.${props.anime.format}`)}</span>
                        &#8226;
                    </Show>
                    <span class="player-more-information-episode">Episode {props.episode} / {props.episodesLen}</span>
                </div>
                <span class="player-more-information-description">{decodeHtmlEntities(props.anime.description)}</span>
                <div class="player-more-information-genres-container">
                    <For each={props.anime.genres}>
                        {(item) => (
                            <div class="player-more-information-genres">{item}</div>
                        )}
                    </For>
                </div>
                <span class="player-more-information-durration">
                    <Show when={props.anime.averageScore}>
                        {props.anime.averageScore}%
                        &#8226;
                        &nbsp;
                    </Show>
                    {convertSecondsToHoursFormat(props.durration)}
                </span>
            </div>
        </div>
    )
}