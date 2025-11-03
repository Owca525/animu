import { Component, Match, Switch } from "solid-js";

interface PlayerSettingsButtonProps {
    onClick?: () => void
    icon?: string
    leftText?: string
    rightText: string
    isGray?: boolean
    type?: "main" | "text"
}

const PlayerSettingsButton: Component<PlayerSettingsButtonProps> = ({ isGray, onClick, icon, leftText, rightText, type = "main" }) => {
    return (
        <Switch>
            <Match when={type == "main"}>
                <div tabIndex={-1} class="player-settings-button" onClick={onClick}>
                    <div tabIndex={-1} class="player-settings-button-icon-container">
                        <span class="material-symbols-outlined">{icon}</span>
                        <span class='player-settings-button-text'>{leftText}</span>
                    </div>
                    <span class={`player-settings-button-text ${isGray && "player-settings-button-text-gray"}`}>
                        {rightText}
                    </span>
                </div>
            </Match>
            <Match when={type == "text"}>
                <div tabIndex={-1} class="player-settings-button" onClick={onClick}>
                    <span tabIndex={-1} class="player-settings-button-text">{rightText}</span>
                </div>
            </Match>
        </Switch>
    );
}

export default PlayerSettingsButton