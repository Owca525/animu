import { containerData } from '@renderer/utils/types';
import "./css/bigcardscontainer.css"
import BigCard from './bigCard';
import { Component, createSignal, For, onCleanup, onMount } from 'solid-js';

type BigCardsContainerProps = { data: containerData }

const BigCardsContainer: Component<BigCardsContainerProps> = ({ data }) => {
    let divRef: HTMLDivElement | undefined;
    let cardRef: HTMLDivElement | undefined;
    let intervalRef: NodeJS.Timeout | undefined;
    const [isDragging, setIsDragging] = createSignal(false);
    const [startX, setStartX] = createSignal(0);
    const [scrollLeft, setScrollLeft] = createSignal(0);
    const [currentIndex, setCurrentIndex] = createSignal(0);
    const [cardWidth, setCardWidth] = createSignal(0);

    onMount(() => {
        handleUpdate()
        window.addEventListener("resize", handleUpdate)
        startAutoSlide();
        if (!divRef) return;
        divRef.addEventListener("scroll", handleScroll);
    })

    onCleanup(() => {
        divRef?.removeEventListener("scroll", handleScroll);
        stopAutoSlide()
        window.removeEventListener("resize", handleUpdate)
    })

    function handleUpdate() {
        if (!cardRef) return
        const style = window.getComputedStyle(cardRef);
        const width = cardRef.offsetWidth;
        const gap = parseInt(style.marginRight || "0", 10);
        setCardWidth(width + gap);
    }

    function handleStart(e) {
        setIsDragging(true);
        const pageX = "touches" in e ? e.touches[0].pageX : e.pageX;
        setStartX(pageX - (divRef?.offsetLeft || 0));
        setScrollLeft(divRef?.scrollLeft || 0);
        if (intervalRef) clearInterval(intervalRef);
    }

    function handleMove(e) {
        if (!isDragging() || !divRef) return;
        e.preventDefault();
        const pageX = "touches" in e ? e.touches[0].pageX : e.pageX;
        const x = pageX - divRef.offsetLeft;
        const walk = (x - startX()) * 1.5;
        divRef.scrollLeft = scrollLeft() - walk;
    }

    function handleEnd() {
        setIsDragging(false);
        startAutoSlide();
    }

    function handleScroll() {
        if (!divRef || !cardWidth()) return;
        const index = Math.round(divRef.scrollLeft / cardWidth());
        setCurrentIndex(index);
    }

    function handleDotClick(index: number) {
        if (!divRef) return
        divRef.scrollTo({
            left: index * cardWidth(),
            behavior: "smooth",
        });
        setCurrentIndex(index);
        restartAutoSlide();
    }

    function startAutoSlide() {
        if (!divRef || !cardWidth()) return;
        if (intervalRef) clearInterval(intervalRef);
        intervalRef = setInterval(() => {
            setCurrentIndex((prev) => {
                if (!divRef) return prev
                const next = (prev + 1) % data.data.length;
                divRef.scrollLeft = next * cardWidth()
                return next;
            });
        }, 5000);
    };

    function stopAutoSlide() {
        if (intervalRef) clearInterval(intervalRef);
    };

    function restartAutoSlide() {
        stopAutoSlide();
        startAutoSlide();
    };

    return (
        <main class="big-card-container">
            <div class={`big-cards-container-content`} ref={el => divRef = el}
                onMouseDown={handleStart}
                onMouseMove={handleMove}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={handleStart}
                onTouchMove={handleMove}
                onTouchEnd={handleEnd}
            >
                <For each={data.data}>
                    {(element) => (
                        <BigCard data={element} ref={cardRef} />
                    )}
                </For>
            </div>
            <div class="big-card-container-buttons">
                <span class='material-symbols-outlined big-card-container-navigaton-button' onclick={() => {
                    if (!divRef) return
                    restartAutoSlide()
                    divRef.scrollLeft = (currentIndex() - 1) * cardWidth()
                }}>keyboard_arrow_left</span>
                <For each={data.data}>
                    {(_el, i) => (
                        <div class={`big-card-container-button ${currentIndex() === i() ? "active" : ""}`} onClick={() => handleDotClick(i())}></div>
                    )}
                </For>
                <span class='material-symbols-outlined big-card-container-navigaton-button' onclick={() => {
                    if (!divRef) return
                    restartAutoSlide()
                    divRef.scrollLeft = (currentIndex() + 1) * cardWidth()
                }}>keyboard_arrow_right</span>
            </div>
        </main>
    );
};

export default BigCardsContainer;