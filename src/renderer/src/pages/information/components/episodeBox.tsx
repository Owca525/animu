import { Match, Show, Switch } from "solid-js";
import "./css/episodeBox.css";
import { episodeMetadata, indentityPlayer } from "@renderer/utils/types";

interface episodeBoxProps {
    variant: "v1" | "v2",
    saveData: indentityPlayer | undefined,
    episode: episodeMetadata,
    enterPlayer: () => void
}

export default function EpisodeBox(props: episodeBoxProps) {
    const saveData = props.saveData;
    const epNum = parseInt(props.episode.ep);
    const savedEp = parseInt(saveData?.episode ?? "0");
    const isWatched = saveData && epNum < savedEp;
    const isWatching = saveData && epNum === savedEp && (saveData.last_Time !== 0 || saveData.isStarted);
    const isWatchedEqual = saveData && epNum === savedEp && saveData.last_Time === 0 && !saveData.isStarted;

    return (
        <Switch>
            <Match when={props["variant"] == "v1"}>
                <div
                    class={`information-episode-button 
                        ${isWatched ? "watched" : ""} 
                        ${isWatching ? "watching" : ""} 
                        ${isWatchedEqual ? "watched" : ""}`
                    }
                    onClick={props.enterPlayer}>
                    {props.episode.ep}
                </div>
            </Match>
            <Match when={props["variant"] == "v2"}>
                <div class="information-episode-box">
                    <Show when={props["episode"]["img"]}>
                        <img src={props["episode"]["img"]} class="information-episode-box-image"/>
                    </Show>

                    <Show when={props["episode"]["title"]}>
                        <span class="information-episode-box-title">{props["episode"]["title"]}</span>
                    </Show>
                    <span class="information-episode-box-episode">Ep {props.episode.ep}</span>
                    <Show when={props["episode"]["durration"]}>
                        <span class="information-episode-box-durration">{props["episode"]["durration"]}</span>
                    </Show>
                    <Show when={props["episode"]["uploadedUnix"]}>
                        <span class="information-episode-box-upload">{props["episode"]["uploadedUnix"]}</span>
                    </Show>
                    <Show when={props.episode["blueRayVer"]}>
                        <span class="information-episode-box-blueRay">BD</span>
                    </Show>
                </div>
            </Match>
        </Switch>
    );
};
