import Button from "@renderer/components/buttons"
import "./css/playerbutton.css"
import { useRef } from "react";

interface PlayerButtonProps {
    icon: string;
    title: string | undefined;
    onClick?: () => void;
    ButtonClass?: string;
}

const PlayerButton: React.FC<PlayerButtonProps> = ({ icon, title, onClick, ButtonClass }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);

    function positionTooltip() {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect();
        const overflowRight = rect.right > window.innerWidth;
        const overflowLeft = rect.left < 0;

        if (overflowRight) {
            const shiftLeft = rect.right - window.innerWidth + 10;
            containerRef.current.style.transform = `translateX(calc(-10% - ${shiftLeft}px))`;
        }

        if (overflowLeft) {
            const shiftRight = 0 - rect.left + 10;
            containerRef.current.style.transform = `translateX(calc(5% + ${shiftRight}px))`;
        }
    }


    return (
        <div className="player-button-up-text-container" onMouseOver={positionTooltip}>
            {title && <div className="player-button-up-text" ref={containerRef}>{title}</div>}
            <Button icon={icon} ButtonClass={ButtonClass} onClick={onClick} />
        </div>
    )
}

export default PlayerButton
