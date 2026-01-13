import { t } from "@renderer/utils/i18n"
import "./css/relationCard.css"

export type characterCardsProps = {
    id: number,
    title: { english?: string, native: string, romaji: string }
    bannerImage?: string
    coverImage: string
    relationType: string
    onClick?: () => void,
}

export default function RelationCard(props: characterCardsProps) {
    return (
        <div class="relation-card-background" style={{ "background-image": `url(${props.bannerImage ?? props.coverImage})` }}>
            <div class="relation-card-container" onClick={props.onClick} >
                <span class="relation-card-title">{props.title.romaji}</span>
                <span class="relation-card-type">{t(`anime_relationtype.${props.relationType.toLowerCase().replaceAll("_", "")}`)}</span>
            </div>
        </div>
    );
}