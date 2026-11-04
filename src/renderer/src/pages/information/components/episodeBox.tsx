import { For, Match, Show, Switch } from "solid-js";
import "./css/episodeBox.css";
import { episodeMetadata, indentityPlayer, informationTmpProps } from "@renderer/utils/types";
import { formatDate, formatTime, unixToDateTime } from "@renderer/utils/functions";
import { getConfig } from "@renderer/utils/stores/config";
import { t } from "@renderer/utils/i18n";

interface episodeBoxProps {
    variant: "v1" | "v2",
    saveData: indentityPlayer | undefined,
    episode: episodeMetadata,
    enterPlayer: () => void
}

export default function EpisodeContainer(props: { episode: episodeMetadata[], type: string, cache: informationTmpProps, enterPlayer: (episodes: episodeMetadata[], type: string, episode: string) => void }) {
    const config = getConfig()
    const specials = props.episode.filter((v) => v["special"])

    return (
        <div class="information-buttons-episode-content">
            <div class="information-buttons-episode-container">
                <For each={props.episode.filter((v) => !v["special"])}>
                    {(data) => <EpisodeBox variant={config.information.episodeVariants}
                        enterPlayer={() => props.enterPlayer(props.episode, props.type, data.ep)}
                        saveData={props.cache.saveData} episode={data} />
                    }
                </For>
            </div>
            <Show when={specials.length > 0}>
                <span class="information-buttons-episode-specials">{t("information.specia_episodes")}</span>
                <div class="information-buttons-episode-container">
                    <For each={specials}>
                        {(data) => <EpisodeBox variant={config.information.episodeVariants}
                            enterPlayer={() => props.enterPlayer(props.episode, props.type, data.ep)}
                            saveData={props.cache.saveData} episode={data} />
                        }
                    </For>
                </div>
            </Show>
        </div>
    )
}

export function EpisodeBox(props: episodeBoxProps) {
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
                <div class={`information-episode-box 
                        ${isWatched ? "watched" : ""} 
                        ${isWatching ? "watching" : ""} 
                        ${isWatchedEqual ? "watched" : ""}
                    `}
                    onclick={props.enterPlayer}
                >
                    <sheep-img
                        src={props["episode"]["img"] ? props["episode"]["img"] : ""}
                        class={`information-episode-box-image show`}
                        divClass="information-episode-box-image-placeholder"
                    />

                    <Show when={props["episode"]["title"]}>
                        <span class="information-episode-box-title">{props["episode"]["title"]}</span>
                    </Show>
                    <span class="information-episode-box-episode">Ep {props.episode.ep}</span>
                    <Show when={props["episode"]["durration"] || (props["saveData"] && props["saveData"]["last_Time"] > 0)}>
                        <span class="information-episode-box-durration">
                            <Show when={(props["saveData"] && props["saveData"]["last_Time"] > 0) && isWatching}>
                                <Switch>
                                    <Match when={props["episode"]["durration"] == undefined}>
                                        Continue From {formatTime(props["saveData"]!["last_Time"])}
                                    </Match>
                                    <Match when={props["episode"]["durration"]}>
                                        {formatTime(props["saveData"]!["last_Time"])}
                                        &nbsp;
                                        /
                                        &nbsp;
                                    </Match>
                                </Switch>
                            </Show>
                            <Show when={props["episode"]["durration"]}>
                                {formatTime(props["episode"]["durration"])}
                            </Show>
                        </span>
                    </Show>
                    <Show when={props["episode"]["uploadedUnix"]}>
                        <span class="information-episode-box-upload">{formatDate(unixToDateTime(props["episode"]["uploadedUnix"]))}</span>
                    </Show>
                    <Show when={props.episode["blueRayVer"]}>
                        <span class="information-episode-box-blueRay">BD</span>
                    </Show>
                </div>
            </Match>
        </Switch>
    );
};
