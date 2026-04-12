import { useI18n } from "@renderer/utils/i18n"
import "./css/relationCard.css"
import { createSignal, Match, Show, Switch } from "solid-js"
import { detectTitleConfig } from "@renderer/utils/functions"

export type characterCardsProps = {
    id: number,
    title: { english?: string, native: string, romaji: string }
    coverImage: string
    relationType: string
    onClick?: () => void
    source?: string
    status?: string
}

// Inspiration Anilist relation cards
export default function RelationCard(props: characterCardsProps) {
    const { t, pathExist } = useI18n()
    const [isLoadingImage, setLoadingImage] = createSignal(true);
    const [isImageError, setImageError] = createSignal(false);

    function checkState() {
        if (isLoadingImage()) return { display: "none" };
        if (isImageError()) return { display: "none" };
        return { animation: "fadeIn 0.3s forwards" };
    }

    return (
        <main class="relation-card-container" onClick={props.onClick}>
            <Switch>
                <Match when={isLoadingImage()}>
                    <div class="relation-card-image-placeholder">
                        <span class="material-symbols-outlined loading-animation icon">progress_activity</span>
                    </div>
                </Match>
                <Match when={isImageError()}>
                    <div class="relation-card-image-placeholder">
                        <span class="material-symbols-outlined icon">error</span>
                    </div>
                </Match>
            </Switch>
            <img class="relation-card-cover" 
                src={props.coverImage} 
                style={checkState()}
                onLoad={() => setLoadingImage(false)}
                onError={() => setImageError(true)}
            />
            <div class="relation-card-content">
                <div class="relation-card-content-top">
                    <span class="relation-card-relation">{t(`anime_relationtype.${props.relationType}`)}</span>
                    <span class="relation-card-title">{detectTitleConfig(props.title)}</span>
                </div>
                <div class="relation-card-content-bottom">
                    <Show when={props.source}>
                        <span class="relation-card-source">{pathExist(`anime_source.${props.source}`) ? 
                            t(`anime_source.${props.source}`) :
                            t(`anime_formats.${props.source}`) }</span>
                    </Show>
                    <Show when={props.source && props.status}>-</Show>
                    <Show when={props.status}>
                        <span class="relation-card-status">{t(`anime_statuses.${props.status}`)}</span>
                    </Show>
                </div>
            </div>
        </main>
    );
}