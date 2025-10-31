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
    const [startX, setStartX] = createSignal(0);
    const [scrollLeft, setScrollLeft] = createSignal(0);
    const [currentIndex, setCurrentIndex] = createSignal(0);
    const [cardWidth, setCardWidth] = createSignal(0);

    onMount(() => {
        handleUpdate()
        window.addEventListener("resize", handleUpdate)
    })
    onCleanup(() => {
        window.removeEventListener("resize", handleUpdate)
        stopAutoSlide()
        if (divRef) divRef.removeEventListener("scroll", handleScroll);
    })

    function handleUpdate() {
        if (cardRef) {
            const style = window.getComputedStyle(cardRef);
            const width = cardRef.offsetWidth;
            const gap = parseInt(style.marginRight || "0", 10);
            setCardWidth(width + gap);
            restartAutoSlide()
        }
    }

    function handleStart(e) {
        setIsDragging(true);
        const pageX = "touches" in e ? e.touches[0].pageX : e.pageX;
        setStartX(pageX - (divRef?.offsetLeft || 0));
        setScrollLeft(divRef?.scrollLeft || 0);
        if (intervalRef) clearInterval(intervalRef);
    }

    function handleMove(e) {
        if (!isDragging || !divRef) return;
        e.preventDefault();
        const pageX = "touches" in e ? e.touches[0].pageX : e.pageX;
        const x = pageX - divRef.offsetLeft;
        const walk = (x - startX()) * 1.2;
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

    createEffect(() => {
        if (!divRef) return;
        divRef.addEventListener("scroll", handleScroll);
    })

    function handleDotClick(index: number) {
        if (divRef) {
            divRef.scrollTo({
                left: index * cardWidth(),
                behavior: "smooth",
            });
            setCurrentIndex(index);
        }
        restartAutoSlide();
    }

    function startAutoSlide() {
        if (!divRef || !cardWidth) return;

        if (intervalRef) clearInterval(intervalRef);
        intervalRef = setInterval(() => {
            setCurrentIndex((prev) => {
                const next = (prev + 1) % data.data.length;
                divRef?.scrollTo({
                    left: next * cardWidth(),
                    behavior: "smooth",
                });
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
        <div class="big-card-container">
            <div class="big-cards-container-content" ref={el => divRef = el}
                onMouseDown={handleStart}
                onMouseMove={handleMove}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={handleStart}
                onTouchMove={handleMove}
                onTouchEnd={handleEnd}
            >
                {data.data.map((elemnt, i) => <BigCard data={elemnt} ref={i === 0 ? cardRef : null} />)}
            </div>
            <div class="big-card-container-buttons">
                {data.data.map((_el, i) => <div class={`big-card-container-button ${currentIndex() === i ? "active" : ""}`} onClick={() => handleDotClick(i)}></div>)}
            </div>
        </div>
    );
};

export default BigCardsContainer;