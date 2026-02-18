import CheckBox from "@renderer/components/checkBox";
import { Match, Switch } from "solid-js";

interface PlayerSettingsButtonProps {
    onClick?: () => void
    icon?: string
    leftText?: string
    rightText: string
    isGray?: boolean
    type?: "main" | "text" | "switch",
    turnDubbing?: (value: boolean) => void
    isDubbingOn?: boolean
}

export default function PlayerSettingsButton(props: PlayerSettingsButtonProps) {
    
    return (
        <Switch>
            <Match when={props.type == "switch"}>
                <div tabIndex={-1} class="player-settings-button" onClick={() => props.turnDubbing ? props.turnDubbing(!props.isDubbingOn as boolean) : ""}>
                    <div tabIndex={-1} class="player-settings-button-icon-container">
                        <span class="material-symbols-outlined">{props.icon}</span>
                        <span class='player-settings-button-text'>{props.leftText}</span>
                    </div>
                    <CheckBox onChecked={props.turnDubbing} checked={props.isDubbingOn} />
                </div>
            </Match>
            <Match when={props.type != "text"}>
                <div tabIndex={-1} class="player-settings-button" onClick={props.onClick}>
                    <div tabIndex={-1} class="player-settings-button-icon-container">
                        <span class="material-symbols-outlined">{props.icon}</span>
                        <span class='player-settings-button-text'>{props.leftText}</span>
                    </div>
                    <span class={`player-settings-button-text ${props.isGray && "player-settings-button-text-gray"}`}>
                        {props.rightText}
                    </span>
                </div>
            </Match>
            <Match when={props.type == "text"}>
                <div tabIndex={-1} class="player-settings-button" onClick={props.onClick}>
                    <span tabIndex={-1} class="player-settings-button-text">{props.rightText}</span>
                </div>
            </Match>
        </Switch>
    );
}