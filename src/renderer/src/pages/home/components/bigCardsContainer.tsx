import { containerData } from '@renderer/utils/types';
import React, { useEffect, useRef, useState } from 'react';
import "./css/bigcardscontainer.css"
import BigCard from './bigCard';

type BigCardsContainerProps = { data: containerData }

const BigCardsContainer: React.FC<BigCardsContainerProps> = ({ data }) => {
    const divRef = useRef<HTMLDivElement | null>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [cardWidth, setCardWidth] = useState(0);

    useEffect(() => {
        handleUpdate()
        window.addEventListener("resize", handleUpdate)
        return () => {
            window.removeEventListener("resize", handleUpdate)
        }
    }, []);

    function handleUpdate() {
        if (cardRef.current) {
            const style = window.getComputedStyle(cardRef.current);
            const width = cardRef.current.offsetWidth;
            const gap = parseInt(style.marginRight || "0", 10);
            setCardWidth(width + gap);
        }
    }

    function handleStart(e: React.MouseEvent | React.TouchEvent) {
        setIsDragging(true);
        const pageX = "touches" in e ? e.touches[0].pageX : e.pageX;
        setStartX(pageX - (divRef.current?.offsetLeft || 0));
        setScrollLeft(divRef.current?.scrollLeft || 0);
        if (intervalRef.current) clearInterval(intervalRef.current);
    }

    function handleMove(e: React.MouseEvent | React.TouchEvent) {
        if (!isDragging || !divRef.current) return;
        e.preventDefault();
        const pageX = "touches" in e ? e.touches[0].pageX : e.pageX;
        const x = pageX - divRef.current.offsetLeft;
        const walk = (x - startX) * 1.2;
        divRef.current.scrollLeft = scrollLeft - walk;
    }

    function handleEnd() {
        setIsDragging(false);
        startAutoSlide();
    }

    function handleScroll() {
        if (!divRef.current || !cardWidth) return;
        const index = Math.round(divRef.current.scrollLeft / cardWidth);
        setCurrentIndex(index);
    }

    useEffect(() => {
        const slider = divRef.current;
        if (!slider) return;
        slider.addEventListener("scroll", handleScroll);
        return () => {
            slider.removeEventListener("scroll", handleScroll);
        };
    }, [cardWidth]);

    function handleDotClick(index: number) {
        if (divRef.current) {
            divRef.current.scrollTo({
                left: index * cardWidth,
                behavior: "smooth",
            });
            setCurrentIndex(index);
        }
        restartAutoSlide();
    }

    function startAutoSlide() {
        if (!divRef.current || !cardWidth) return;

        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            setCurrentIndex((prev) => {
                const next = (prev + 1) % data.data.length;
                divRef.current?.scrollTo({
                    left: next * cardWidth,
                    behavior: "smooth",
                });
                return next;
            });
        }, 5000);
    };

    function stopAutoSlide() {
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    function restartAutoSlide() {
        stopAutoSlide();
        startAutoSlide();
    };

    useEffect(() => {
        startAutoSlide();
        return () => stopAutoSlide();
    }, [cardWidth]);

    return (
        <div className="big-card-container">
            <div className="big-cards-container-content" ref={divRef}
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
            <div className="big-card-container-buttons">
                {data.data.map((_el, i) => <div key={i} className={`big-card-container-button ${currentIndex === i ? "active" : ""}`} onClick={() => handleDotClick(i)}></div>)}
            </div>
        </div>
    );
};

export default BigCardsContainer;