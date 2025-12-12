import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import CharacterCards, { characterCardsProps } from "./characterCard";
import "./css/characterContainer.css"
import Button from "@renderer/components/buttons";

interface CharacterContainerProps {
    title: string,
    cards: characterCardsProps[]
}

export default function CharacterContainer(props: CharacterContainerProps) {
    let container: HTMLDivElement | undefined;
    let charCard: HTMLDivElement | undefined;

    const [disable, setDisable] = createSignal<boolean>(false)

    function handleButtonScroll(num: number) {
        if (!container) return
        if (!charCard) return
        if ((container.clientWidth + container.scrollLeft) >= container.scrollWidth) {
            container.scrollLeft = 0
            return
        }
        const style = window.getComputedStyle(charCard);
        const width = charCard.offsetWidth;
        const gap = parseInt(style.marginRight || "0", 10);
        if (num * (width + gap) <= 0 && container.scrollLeft <= 0) {
            container.scrollLeft = container.scrollWidth
            return
        }

        container.scrollLeft = container.scrollLeft + (num * (width + gap))
    }

    function handleUpdate() {
        if (!container) return
        if (container.clientWidth >= container.scrollWidth) setDisable(true)
        else setDisable(false)
    }

    onMount(() => {
        handleUpdate()
        window.addEventListener("resize", handleUpdate)
    })

    onCleanup(() => {
        window.removeEventListener("resize", handleUpdate)
    })

    return (
        <div class="information-characters">
            <div class="information-characters-title">{props.title}</div>

            <div class="information-characters-container" ref={container}>
                <For each={props.cards}>
                    {(character) => (
                        <CharacterCards
                            id={character.id}
                            image={character.image}
                            name={character.name}
                            role={character.role}
                            onClick={character.onClick}
                            ref={charCard}
                        />
                    )}
                </For>
            </div>
            <Show when={!disable()}>
                <Button icon="chevron_left" ButtonClass="information-character-button-left" onClick={() => handleButtonScroll(-1)} />
                <Button icon="chevron_right" ButtonClass="information-character-button-right" onClick={() => handleButtonScroll(1)} />
            </Show>
        </div>
    );
}