import Button from "@renderer/components/buttons"
import "./css/playerbutton.css"
import { Show } from "solid-js";

interface PlayerButtonProps {
    icon: string;
    title: string | undefined;
    onClick?: () => void;
    ButtonClass?: string;
}

export default function PlayerButton(props: PlayerButtonProps) {
    let containerRef: HTMLDivElement | undefined

    function positionTooltip() {
        if (!containerRef) return
        const rect = containerRef.getBoundingClientRect();
        const overflowRight = rect.right > window.innerWidth;
        const overflowLeft = rect.left < 0;

        if (overflowRight) {
            const shiftLeft = rect.right - window.innerWidth + 10;
            containerRef.style.transform = `translateX(calc(-10% - ${shiftLeft}px))`;
        }

        if (overflowLeft) {
            const shiftRight = 0 - rect.left + 10;
            containerRef.style.transform = `translateX(calc(5% + ${shiftRight}px))`;
        }
    }


    return (
        <div class="player-button-up-text-container" onMouseOver={positionTooltip}>
            <Show when={props.title}>
                <div class="player-button-up-text" ref={containerRef}>{props.title}</div>
            </Show>
            <Button icon={props.icon} iconClassName="player-button-icons" ButtonClass={props.ButtonClass} onClick={props.onClick} />
        </div>
    )
}
