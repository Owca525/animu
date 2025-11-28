
// import { useQuery } from "react-query";
import { closeDialog, showDialog } from "@renderer/utils/context/DialogContext";
import { AnimeData, indentityPlayer, playerData, SettingsConfig } from "@renderer/utils/types";
import { t } from "i18next";

import "./player.css"
import { detectTitle, refetchHistory } from "@renderer/utils/functions";
import Button from "@renderer/components/buttons";

import VideoPlayer from "./VideoPlayer";
import { SaveHistory } from "@renderer/utils/FilesManager/history";
import { ChangePlugin } from "@renderer/utils/pluginApi";
import { useNavigate } from "@solidjs/router";
import { getConfig } from "@renderer/utils/stores/config";
import { createSignal, Match, onMount, Switch } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { createShortcut } from "@solid-primitives/keyboard";
import ExternalPlayer from "./externalPlayer";

const player = () => {
    const anime_data: { data: AnimeData, save: indentityPlayer, episodelist: { ep: string, img?: string, title?: string }[] } = JSON.parse(localStorage.getItem("playerCache") as any)
    const navigate = useNavigate()
    const config: SettingsConfig = getConfig();

    console.log(anime_data)

    if (!anime_data || !anime_data.save || !anime_data.episodelist || !anime_data.data) {
        showDialog({
            type: "error",
            title: "Error In Player",
            description: "Missing data to extract urls",
            buttons: [{
                title: t("dialog.return"),
                onClick: () => navigate("/")
            }]
        })
        return
    }

    const [playerVolume, setPlayerVolume] = createSignal<number>(config.Player.general.Volume)
    const [extractionData, setExtractionData] = createSignal<{ actual: string, type: string, episodelist: { ep: string, img?: string, title?: string }[], time: number }>({
        actual: anime_data.save.episode,
        type: anime_data.save.type,
        episodelist: anime_data.episodelist,
        time: anime_data.save.last_Time
    })
    const [externalPlayerType, setexternalPlayerType] = createSignal<"Movian" | "VLC" | "Mpv" | "ChromeCast">(config.Player.external.type)

    const response = useQuery(() => ({
        queryKey: [anime_data.data?.player_ID, extractionData().actual, extractionData().type],
        queryFn: async ({ queryKey }) => {
            const [player_id, episode, animeType] = queryKey;
            if (!player_id || !episode || !animeType) return console.error("THIS CAN'T HAPPEN IF Happen then something is wrong with player_id, episode, queryFetch/player", queryKey)
            let pluginPlayer = ChangePlugin(anime_data.save?.pluginName ? anime_data.save.pluginName : "")
            return await pluginPlayer.player.extractPlayerData(animeType, episode, player_id)
        },
        refetchOnWindowFocus: false,
        staleTime: 2 * 60 * 60 * 1000,
        cacheTime: 2 * 60 * 60 * 1000
    }));

    function setNewEpisode(ep: string) {
        setExtractionData((prev) => ({
            ...prev,
            time: 0,
            actual: ep
        }))
        response.refetch()
        updateHistory()
    }

    function updateHistory() {
        if (!anime_data || !anime_data.data) return
        console.log("SAVE HISTORY", anime_data.save?.pluginName ? anime_data.save.pluginName : "")
        SaveHistory({
            saveData: {
                pluginName: anime_data.save?.pluginName ? anime_data.save.pluginName : "",
                last_Time: 0,
                isStarted: true,
                type: extractionData().type,
                episode: extractionData().actual.toString()
            },
            AnimeData: {
                ...anime_data.data,
                nextAiringEpisode: undefined
            }
        })
        refetchHistory()
    }

    createShortcut(["Escape"], async () => {
        await leave()
    });

    createShortcut(["m"], () => {
        console.log(anime_data, extractionData, response)
    })

    onMount(() => {
        SaveHistory({
            saveData: {
                pluginName: anime_data.save?.pluginName ? anime_data.save.pluginName : "",
                last_Time: anime_data.save.last_Time,
                isStarted: anime_data.save.last_Time == 0,
                type: extractionData().type,
                episode: extractionData().actual.toString()
            },
            AnimeData: {
                ...anime_data.data,
                nextAiringEpisode: undefined
            }
        })
    })

    function showErrorDialog() {
        showDialog({
            type: "error",
            title: "Error In Player",
            description: t("player.error.notfound"),
            buttons: [
                {
                    title: t("dialog.return"),
                    onClick: () => navigate("/")
                },
                {
                    title: t("dialog.retry"),
                    onClick: () => response.refetch()
                }
            ]
        })
        return loadingAnimation(leave, { data: anime_data?.data as any, ep: extractionData().actual }, extractionData())
    }

    async function leave() {
        if (window.api) window.BrowserWindow.setFullscreen(false)
        else document.exitFullscreen()
        closeDialog()
        if (!anime_data) return
        if (anime_data.save?.last_Time != 0) {
            navigate("/")
            return
        }
        if (config.Player.general.PlayerBehavior === "home") navigate("/")
        else navigate("/info", { state: { anime: anime_data.data, saveData: anime_data.save } })
    }

    return (
        <Switch fallback={showErrorDialog()}>
            <Match when={response.isError || response.isLoading == false && response.data && response.data.length <= 0}>
                {showErrorDialog()}
            </Match>
            <Match when={response.isLoading && response.isError == false}>
                {loadingAnimation(leave, { data: anime_data?.data as any, ep: extractionData().actual }, extractionData())}
            </Match>
            <Match when={response.data && response.isLoading == false && response.isError == false && config.Player.external.enable}>
                <ExternalPlayer
                    animeData={{
                        AnimeData: anime_data.data,
                        saveData: anime_data.save
                    }}
                    playerData={response.data as playerData[]}
                    time={extractionData().time}
                    setNextEpisode={setNewEpisode}
                    now_episodes={{ episode: extractionData().actual, type: extractionData().type, episodes: extractionData().episodelist }}
                    externalPlayerData={{ onChage: (data) => setexternalPlayerType(data), current: externalPlayerType() }}
                />
            </Match>
            <Match when={response.data && response.isLoading == false && response.isError == false}>
                <VideoPlayer
                    player_data={response.data as any}
                    anime_data={{
                        AnimeData: anime_data.data,
                        saveData: anime_data.save
                    }}
                    temp={{ episode: extractionData().actual, type: extractionData().type, episodes: extractionData().episodelist }}
                    setNextEpisode={setNewEpisode}
                    volumeCacheFunc={setPlayerVolume}
                    PlayerVolume={playerVolume()}
                    time={extractionData().time}
                    exitFromPlayer={leave}
                />
            </Match>
        </Switch>
    )

    // return loadingAnimation(leave, { title: anime_data.data.title, ep: extractionData().actual, format: anime_data.data.format }, extractionData())
}

function getCurrentImage(currentdata: { actual: string, type: string, episodelist: { ep: string, img?: string, title?: string }[], time: number }): string | undefined {
    for (let index = 0; index < currentdata.episodelist.length; index++) {
        const element = currentdata.episodelist[index];
        if (element.ep == currentdata.actual && element.img) return element.img
    }
    return undefined
}

function loadingAnimation(leave: () => void, anime_data: { data: AnimeData, ep: string }, currentdata: { actual: string, type: string, episodelist: { ep: string, img?: string, title?: string }[], time: number }) {
    return (
        <div class="player-loading-container" style={{ "background-image": `url(${getCurrentImage(currentdata)})` }}>
            <div class="player-loading-container-black"></div>
            <div class="player-loading-top">
                <Button icon='arrow_back' ButtonClass='player-buttons' iconClassName="player-button-icons" onClick={leave} />
                <div class="player-title ">{detectTitle({
                    title: anime_data.data.title,
                    ep: currentdata.actual
                })}</div>
            </div>
            <div class="player-loading-animation-container" style={{ "max-height": "min-content" }}>
                <div class="material-symbols-outlined player-waiting">progress_activity</div>
            </div>
        </div>
    )
}

export default player