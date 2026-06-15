import { useI18n } from "@renderer/utils/i18n"
import "./css/relationCard.css"
import { Show } from "solid-js"
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

    return (
        <main class="relation-card-container" onClick={props.onClick}>
            <sheep-img 
                class="relation-card-cover" 
                src={props.coverImage} 
                divClass="relation-card-image-placeholder"
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