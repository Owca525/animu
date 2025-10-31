import { getEpisodeDay, getGradientColor } from '@renderer/utils/functions';
import { cardData } from '@renderer/utils/types';
import "./css/bigcard.css"
import { t } from 'i18next';
import Button from '@renderer/components/buttons';
import { useNavigate } from '@solidjs/router';
import { Component, For, Show } from 'solid-js';

type bigCardProps = { data: cardData, ref?: any }

const BigCard: Component<bigCardProps> = ({ data, ref }) => {
    const navigate = useNavigate();

    function formatEpisode(): string {
        if (!data.AnimeData.nextAiringEpisode) return ""
        if (data.AnimeData.nextAiringEpisode.episode == 1) return "1"
        return (data.AnimeData.nextAiringEpisode.episode - 1).toString()
    }

    function openInformation() {
        navigate("/info", {
            state: { anime: data.AnimeData },
        });
    }

    return (
        <div class="big-card-content" ref={ref} style={{ "background-image": `url(${data.AnimeData.bannerImage ?? data.AnimeData.coverImage})` }}>
            <div class={`big-card-background ${!data.AnimeData.bannerImage ? "big-card-blur" : ""}`}>
                <div class="big-card-information">
                    <div class="big-card-information-image-container">
                        <img src={data.AnimeData.coverImage} class="card-image big-card-information-image" />
                        {data.AnimeData.averageScore &&
                            <div class="big-card-information-score" style={{ border: `3px solid ${getGradientColor(data.AnimeData.averageScore)}` }}>
                                {data.AnimeData.averageScore}%
                            </div>
                        }
                    </div>
                    <div class="big-card-information-content">
                        <div class="big-card-information-title">{data.AnimeData.title.romaji}</div>
                        <div class="big-card-information-genres-content">
                            <Show when={data.AnimeData.genres}>
                                <For each={data.AnimeData.genres}>
                                    {(value) => (<div class="big-card-information-genres">{value as string}</div>)}
                                </For>
                            </Show>
                        </div>
                        <div class="big-card-information-others">
                            <Show when={data.AnimeData.format}>
                                <div class="big-card-information-format">{t(`anime_formats.${data.AnimeData.format?.toLowerCase()}`)}</div>
                            </Show>
                            <Show when={data.AnimeData.status}>
                                <div class="big-card-information-status">{t(`anime_statuses.${data.AnimeData.status?.toLowerCase()}`)}</div>
                            </Show>
                            <Show when={data.AnimeData.episodes}>
                                <div class="big-card-information-episode">{formatEpisode() != "" ? `${formatEpisode()} /` : ""} {data.AnimeData.episodes} Episodes</div>
                            </Show>
                        </div>
                        <div class="big-card-information-bottom">
                            <Button content='More Information' ButtonClass='big-card-button' onClick={openInformation} />
                            <Show when={data.AnimeData.nextAiringEpisode}>
                                <div class="big-card-information-date">{getEpisodeDay(data.AnimeData.nextAiringEpisode?.airingAt!, data.AnimeData.nextAiringEpisode?.episode!)}</div>
                            </Show>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BigCard;