import { containerData } from '@renderer/utils/GlobalInterface';
import React, { useRef, useState } from 'react';
import "./css/bigcardscontainer.css"
import BigCard from './bigCard';

type BigCardsContainerProps = { data: containerData }

const BigCardsContainer: React.FC<BigCardsContainerProps> = ({ data }) => {
    const divRef = useRef<HTMLDivElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true);
        const pageX = "touches" in e ? e.touches[0].pageX : e.pageX;
        setStartX(pageX - (divRef.current?.offsetLeft || 0));
        setScrollLeft(divRef.current?.scrollLeft || 0);
    };

    const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging || !divRef.current) return;
        e.preventDefault();
        const pageX = "touches" in e ? e.touches[0].pageX : e.pageX;
        const x = pageX - divRef.current.offsetLeft;
        const walk = (x - startX) * 1.2;
        divRef.current.scrollLeft = scrollLeft - walk;
    };

    const handleEnd = () => {
        setIsDragging(false);
    };

    return (
        <div className="big-cards-container" ref={divRef}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
        >
            {data.data.map((elemnt) => <BigCard data={elemnt} />)}
        </div>
    );
};

export default BigCardsContainer;