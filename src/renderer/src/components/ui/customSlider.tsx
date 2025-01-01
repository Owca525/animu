import React, { useState, useRef } from "react";
import "../../css/ui/customSlider.css"

interface CustomSliderProps {
    min: number;
    max: number;
    current: number;
    step: number;
    size?: number;
    onValueChange?: (value: number) => void;
    ValueChange?: () => number
}

const CustomSlider: React.FC<CustomSliderProps> = ({ min, max, current = 0, step, size = 100, onValueChange }) => {
    const [currentValue, setCurrentValue] = useState(current);
    const sliderRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (sliderRef.current) {
            const sliderBounds = sliderRef.current.getBoundingClientRect();
            const offsetX = Math.min(
                Math.max(0, e.clientX - sliderBounds.left),
                sliderBounds.width
            );
            const percentage = offsetX / sliderBounds.width;
            const value = Math.round((percentage * (max - min)) / step) * step + min;
            setCurrentValue(value);
            if (onValueChange) {
                onValueChange(value);
            }
        }
    };


    const handleClick = (e: React.MouseEvent) => {
        handleMouseMove(e);
    };

    return (
        <div className="slider-container" style={{ width: `${size}px` }} onMouseMove={(e) => e.buttons === 1 && handleClick(e)}>
            <div className="slider-text">{currentValue}</div>
            <div
                ref={sliderRef}
                onClick={handleClick}
                className="slider-background">
                <div
                    className="slider-progress"
                    style={{
                        width: `${((currentValue - min) / (max - min)) * 100}%`,
                    }}
                />
                <div
                    className="slider-thumb"
                    style={{
                        left: `${((currentValue - min) / (max - min)) * 100}%`,
                    }}
                />
            </div>
        </div>
    );
};

export default CustomSlider;