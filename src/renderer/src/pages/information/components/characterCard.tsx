import { createSignal, Match, Switch } from "solid-js";
import "./css/characterCard.css"

export interface characterCardsProps {
    id: string,
    name: string,
    image: string,
    role: string,
    onClick?: () => void,
    ref?: HTMLDivElement
}

export default function CharacterCards(props: characterCardsProps) {
    const [isLoadingImage, setLoadingImage] = createSignal(true);
    const [isImageError, setImageError] = createSignal(false);

    function checkState() {
        if (isLoadingImage()) return { display: "none" };
        if (isImageError()) return { display: "none" };
        return { animation: "fadeIn 0.3s forwards" };
    }

    return (
        <div class="information-characters-card" onClick={props.onClick} ref={props.ref}>
            <Switch>
                <Match when={isLoadingImage()}>
                    <div class="information-character-image-placeholder">
                        <span class="material-symbols-outlined loading-animation icon">progress_activity</span>
                    </div>
                </Match>
                <Match when={isImageError()}>
                    <div class="information-character-image-placeholder">
                        <span class="material-symbols-outlined icon">error</span>
                    </div>
                </Match>
            </Switch>
            <img class="information-characters-card-cover" 
                src={props.image} 
                style={checkState()}
                onLoad={() => setLoadingImage(false)}
                onError={() => setImageError(true)}
            />
            <div class="information-characters-card-description">
                <span class="information-character-name">{props.name}</span>
                <span class="information-character-role">{props.role}</span>
            </div>
        </div>
    );
}