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
    const [isLoading, setLoading] = createSignal(true);
    const [isError, setIsError] = createSignal(false);

    function checkState() {
        if (isLoading()) return { display: "none" };
        if (isError()) return { display: "none" };
        return { animation: "fadeIn 0.3s forwards" };
    }

    return (
        <div class="information-characters-card" onClick={props.onClick} ref={props.ref}>
            <Switch>
                <Match when={isLoading()}>
                    <div class="information-character-image-placeholder">
                        <span class="material-symbols-outlined loading-animation icon">progress_activity</span>
                    </div>
                </Match>
                <Match when={isError()}>
                    <div class="information-character-image-placeholder">
                        <span class="material-symbols-outlined icon">error</span>
                    </div>
                </Match>
            </Switch>
            <img class="information-characters-card-cover" 
                src={props.image} 
                style={checkState()}
                onLoad={() => setLoading(false)}
                onError={() => setIsError(true)}
            />
            <div class="information-characters-card-description">
                <span class="information-character-name">{props.name}</span>
                <span class="information-character-role">{props.role}</span>
            </div>
        </div>
    );
}