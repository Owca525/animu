import { containerData } from '@renderer/utils/types';
import "./css/bigcardscontainer.css"
import BigCard from './bigCard';
import { Component, createEffect, createSignal, onCleanup, onMount } from 'solid-js';

type BigCardsContainerProps = { data: containerData }

const BigCardsContainer: Component<BigCardsContainerProps> = ({ data }) => {
    let divRef: HTMLDivElement | undefined = undefined
    let cardRef: HTMLDivElement | undefined = undefined;
    let intervalRef: NodeJS.Timeout | undefined = undefined;
    const [isDragging, setIsDragging] = createSignal(false);
    const [screenX, setscreenX] = createSignal<number>(0);
    const [currentIndex, setCurrentIndex] = createSignal(0);
    const [cardWidth, setCardWidth] = createSignal(0);

    onMount(() => {
        // window.addEventListener("resize", handleUpdate)
    })
    onCleanup(() => {
        // window.removeEventListener("resize", handleUpdate)
    })

    createEffect(() => {
        console.log(isDragging())
    })

    function handleUpdate(event: MouseEvent & { currentTarget: HTMLDivElement; target: Element;}) {
        if (!isDragging()) return
        if (!divRef) return
        if (event.screenX <= screenX()) {
            divRef.scrollLeft = divRef.scrollLeft + 3
        } else if (event.screenX >= screenX()) {
            divRef.scrollLeft = divRef.scrollLeft - 3
        }

        setscreenX(event.screenX)
    }

    return (
        <div class="big-card-container">
            <div class={`big-cards-container-content ${!isDragging() ? "active" : ""}`} ref={el => divRef = el}
                // TODO: Fix snaping animation
                // onClick={(event) => console.log(event)}
                onMouseUp={() => setIsDragging(false)}
                onMouseDown={() => setIsDragging(true)}
                // onMouseDown={handleStart}
                onMouseMove={handleUpdate}
                // onMouseUp={handleEnd}
                onMouseLeave={() => setIsDragging(false)}
                // onTouchStart={handleStart}
                // onTouchMove={handleMove}
                // onTouchEnd={handleEnd}
            >
                {data.data.map((elemnt, i) => <BigCard data={elemnt} ref={i === 0 ? cardRef : null} />)}
            </div>
            <div class="big-card-container-buttons">
                {data.data.map((_el, i) => <div class={`big-card-container-button ${currentIndex() === i ? "active" : ""}`} onClick={() => (i)}></div>)}
            </div>
        </div>
    );
};

export default BigCardsContainer;