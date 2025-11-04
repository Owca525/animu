import "./css/playersettings.css"
import { isNumberString } from "@renderer/utils/functions"
import { t } from "i18next"
import { createSignal, For, Show } from "solid-js"
import PlayerSettingsButton from "./playerSettingsButton"

interface playerSettingsProps {
    sources: { name: string, change: () => void }[]
    resolution: { res: string, change: () => void }[]
    speed: { speed: number, change: () => void }[]
    subtitles: { sub: string, change: () => void }[]
    audioTrack: { track: string, change: () => void }[]
    disableSettings: () => void
    current: {
        currentHost: string,
        currentResolution: string,
        currentSpeed: number,
        currentSub: string,
        currentTrack: string
    }
    state: boolean
}

export default function PlayerSettings(props: playerSettingsProps) {
    const [currentSettings, setcurrentSettings] = createSignal<string>("settings")

    function reset(func: () => void) {
        func()
        props.disableSettings()
        setcurrentSettings("settings")
    }

    // const settingsContainerVariants = {
    //     initial: { opacity: 0, x: 100, display: "none", position: "absolute" },
    //     visible: { opacity: 1, x: 0, display: "", position: "" },
    // };

    return (
        <Show when={props.state}>
            <div class="player-settings-container">
                <Show when={currentSettings() === "settings"}>
                    <div class="player-settings-content">
                        <PlayerSettingsButton onClick={() => props.sources.length > 1 ? setcurrentSettings("source") : ""}
                            icon="web"
                            leftText={t("player.settings.source")}
                            rightText={props.current.currentHost}
                            isGray={props.sources.length <= 1}
                        />
                        <PlayerSettingsButton onClick={() => props.resolution.length > 1 ? setcurrentSettings("res") : ""}
                            icon="instant_mix"
                            leftText={t("player.settings.resolution")}
                            rightText={isNumberString(props.current.currentResolution) ? props.current.currentResolution + "p" : props.current.currentResolution}
                            isGray={props.resolution.length <= 1}
                        />
                        <PlayerSettingsButton onClick={() => props.audioTrack.length > 1 ? setcurrentSettings("track") : ""}
                            icon="music_note"
                            leftText={t("player.settings.audio")}
                            rightText={props.current.currentTrack}
                            isGray={props.audioTrack.length <= 1}
                        />
                        <PlayerSettingsButton onClick={() => props.subtitles.length >= 1 ? setcurrentSettings("sub") : ""}
                            icon="subtitles"
                            leftText={t("player.settings.subtitles")}
                            rightText={props.current.currentSub}
                            isGray={props.subtitles.length <= 0}
                        />
                        <PlayerSettingsButton onClick={() => setcurrentSettings("speed")}
                            icon="speed"
                            leftText={t("player.settings.speed")}
                            rightText={props.current.currentSpeed + "x"}
                        />
                    </div>
                </Show>
                <Show when={currentSettings() === "source"}>
                    <div tabIndex={-1} class="player-settings-button-back" onClick={() => setcurrentSettings("settings")}>
                        <span tabIndex={-1} class="material-symbols-outlined">arrow_back</span><span>{t("player.settings.source")}</span>
                    </div>
                    <For each={props.sources}>
                        {(data) => (
                            <PlayerSettingsButton onClick={() => reset(data.change)}
                                rightText={data.name}
                                type="text"
                            />
                        )}
                    </For>
                </Show>
                <Show when={currentSettings() === "res"}>
                    <div tabIndex={-1} class="player-settings-button-back" onClick={() => setcurrentSettings("settings")}>
                        <span tabIndex={-1} class="material-symbols-outlined">arrow_back</span><span>{t("player.settings.resolution")}</span>
                    </div>
                    <For each={props.resolution}>
                        {(data) => (
                            <PlayerSettingsButton onClick={() => reset(data.change)}
                                rightText={isNumberString(data.res) ? data.res + "p" : data.res}
                                type="text"
                            />
                        )}
                    </For>
                </Show>
                <Show when={currentSettings() === "res"}>
                    <div tabIndex={-1} class="player-settings-button-back" onClick={() => setcurrentSettings("settings")}>
                        <span tabIndex={-1} class="material-symbols-outlined">arrow_back</span><span>{t("player.settings.subtitles")}</span>
                    </div>
                    <For each={props.subtitles}>
                        {(data) => (
                            <PlayerSettingsButton onClick={() => reset(data.change)}
                                rightText={data.sub}
                                type="text"
                            />
                        )}
                    </For>
                </Show>
                <Show when={currentSettings() === "track"}>
                    <div tabIndex={-1} class="player-settings-button-back" onClick={() => setcurrentSettings("settings")}>
                        <span tabIndex={-1} class="material-symbols-outlined">arrow_back</span><span>{t("player.settings.audio")}</span>
                    </div>
                    <For each={props.audioTrack}>
                        {(data) => (
                            <PlayerSettingsButton onClick={() => reset(data.change)}
                                rightText={data.track}
                                type="text"
                            />
                        )}
                    </For>
                </Show>
                <Show when={currentSettings() === "speed"}>
                    <div tabIndex={-1} class="player-settings-button-back" onClick={() => setcurrentSettings("settings")}>
                        <span tabIndex={-1} class="material-symbols-outlined">arrow_back</span><span>{t("player.settings.speed")}</span>
                    </div>
                    <For each={props.speed}>
                        {(data) => (
                            <PlayerSettingsButton onClick={() => { data.change(); setcurrentSettings("settings") }}
                                rightText={data.speed.toString() + "x"}
                                type="text"
                            />
                        )}
                    </For>
                </Show>
            </div>
        </Show>
        // initial={{ opacity: 0, display: "none" }} animate={state ? { opacity: 1, display: "" } : { opacity: 0, display: "none" }} transition={{ duration: 0.2 }}
    )
}
