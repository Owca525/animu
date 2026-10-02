import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import Button from "@renderer/components/buttons";
import RelationCard from "./relationCard";
import { AnimeData } from "@renderer/utils/types";

// BADPRACTICE Line 7
export default function RelationCardContainer(props: { content: AnimeData["relations"], onClick: (v: any) => void }) {
    let container: HTMLDivElement | undefined;
    let relationCard: HTMLElement | undefined;

    const [disable, setDisable] = createSignal<boolean>(false)

    function handleButtonScroll(num: number) {
        if (!container) return
        if (!relationCard) return
        if ((container.clientWidth + container.scrollLeft) >= container.scrollWidth) {
            container.scrollLeft = 0
            return
        }
        const style = window.getComputedStyle(relationCard);
        const width = relationCard.offsetWidth;
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

        <div class="relation-card-barier">
            <div class="information-relation-container" ref={container}>
                <For each={props.content}>
                    {(rel) => <RelationCard
                        id={rel.id}
                        relationType={rel.relationType}
                        title={rel.title}
                        coverImage={rel.coverImage}
                        onClick={() => props.onClick({
                            title: rel.title,
                            id: rel.id.toString(),
                            format: rel.format,
                            type: rel.type
                        })}
                        status={rel.status}
                        source={rel.format}
                        ref={relationCard}
                    />}
                </For>
            </div>
            <Show when={!disable()}>
                <Button icon="chevron_left" ButtonClass="relation-card-button left" onClick={() => handleButtonScroll(-1)} />
                <Button icon="chevron_right" ButtonClass="relation-card-button right" onClick={() => handleButtonScroll(1)} />
            </Show>
        </div>


    );
}