import { For } from "solid-js"
import "./css/nerdstats.css"

export default function NerdStats(props: { video: { [key: string]: any }, player: { [key: string]: any }, ui: { [key: string]: any } }) {
    function convertVariable(val: any) {
        if (typeof val == "number") return val.toFixed(2)
        if (Array.isArray(val)) return val.length
        if (typeof val == "object") return `true (object)`
        return `${val}`
    }

    return (
        <>
            <main class="nerdstats-container-multiply">
                <div class="nerdstats-container video">
                    <span class="nerdstats-title">Video Element</span>
                    <div class="nerdstats-elements">
                        <For each={Object.entries(props["video"])}>
                            {([name, val]) => (
                                <span class="nerdstats-text">
                                    <span class="nerdstats-name">{name}:</span>
                                    <span class="nerdstats-value">{convertVariable(val)}</span>
                                </span>
                            )}
                        </For>
                    </div>
                </div>
                <div class="nerdstats-container player">
                    <span class="nerdstats-title">Player</span>
                    <div class="nerdstats-elements">
                        <For each={Object.entries(props["player"])}>
                            {([name, val]) => (
                                <span class="nerdstats-text">
                                    <span class="nerdstats-name">{name}:</span>
                                    <span class="nerdstats-value">{convertVariable(val)}</span>
                                </span>
                            )}
                        </For>
                    </div>
                </div>
            </main>

            <div class="nerdstats-container ui">
                <span class="nerdstats-title">UI</span>
                <div class="nerdstats-elements">
                    <For each={Object.entries(props["ui"])}>
                        {([name, val]) => (
                            <span class="nerdstats-text">
                                <span class="nerdstats-name">{name}:</span>
                                <span class="nerdstats-value">{convertVariable(val)}</span>
                            </span>
                        )}
                    </For>
                </div>
            </div>
        </>
    )
}