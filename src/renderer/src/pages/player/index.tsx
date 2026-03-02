import { closeDialog, showDialog } from "@renderer/utils/context/DialogContext";
import { AnimeData, animulistProps, indentityPlayer, SettingsConfig } from "@renderer/utils/types";

import "./player.css"
import { changeTitleAnimu, dateToUnix, detectTitle, refetchHistory } from "@renderer/utils/functions";
import Button from "@renderer/components/buttons";

import VideoPlayer from "./VideoPlayer";
import { SaveHistory } from "@renderer/utils/FilesManager/history";
import { useNavigate } from "@solidjs/router";
import { getConfig } from "@renderer/utils/stores/config";
import { createSignal, Match, onMount, Switch } from "solid-js";
import { createShortcut } from "@solid-primitives/keyboard";
import ExternalPlayer from "./externalPlayer";
import { pluginManager } from "@renderer/utils/stores/plugins";
import { useResponse } from "@renderer/utils/hooks/useResponse";
import { useI18n } from "@renderer/utils/i18n";
import { addToAnimuList } from "@renderer/utils/FilesManager/animulist";

const player = () => {
    const { t } = useI18n()
    const anime_data: { data: AnimeData, save: indentityPlayer, episodelist: { ep: string, img?: string, title?: string }[], animulist?: animulistProps, continewatch: boolean } = JSON.parse(localStorage.getItem("playerCache") as any)
    const navigate = useNavigate()
    const config: SettingsConfig = getConfig();

    if (!anime_data || !anime_data.save || !anime_data.episodelist || !anime_data.data) {
        showDialog({
            type: "error",
            title: t("player.errors.error"),
            description: t("player.errors.missing"),
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

    const response = useResponse(
        {
            queryKey: [anime_data.data?.player_ID, extractionData().actual, extractionData().type],
            queryFn: async (queryKey) => {
                const [player_id, episode, animeType] = queryKey;
                if (!player_id || !episode || !animeType) {
                    console.error("THIS CAN'T HAPPEN IF Happen then something is wrong with player_id, episode, queryFetch/player", queryKey)
                    return []
                }
                let pluginPlayer = pluginManager().changePlugin(anime_data.save?.pluginName ? anime_data.save.pluginName : "")
                return await pluginPlayer.extractPlayerData(animeType, episode, player_id)
            },
            cacheTime: 60 * 60 * 1000,
        }
    )

    function setNewEpisode(ep: string) {
        setExtractionData((prev) => ({
            ...prev,
            time: 0,
            actual: ep
        }))
        response.Refetch([anime_data.data?.player_ID, extractionData().actual, extractionData().type])
        updateHistory()
    }

    function updateHistory() {
        if (!anime_data || !anime_data.data) return
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

    onMount(() => {
        changeTitleAnimu(`Animu - ${anime_data.data.title.romaji}`)
        SaveHistory({
            saveData: {
                ...anime_data.save,
                last_Time: anime_data.save.last_Time,
                isStarted: anime_data.save.last_Time == 0,
                type: extractionData().type,
                episode: extractionData().actual.toString()
            },
            AnimeData: {
                ...anime_data.data,
                nextAiringEpisode: undefined,
                recommendations: undefined
            }
        })

        if (anime_data.animulist) return
        addToAnimuList({
            status: "CURRENT",
            score: 0,
            reapeat: 0,
            startWatch: dateToUnix(new Date().toString()),
            endWatch: 0,
            added: dateToUnix(new Date().toString()),
            lastUpdate: dateToUnix(new Date().toString())
        }, {
            ...anime_data.data,
            nextAiringEpisode: undefined,
            recommendations: undefined
        })
    })

    function showErrorDialog() {
        showDialog({
            type: "error",
            title: t("player.errors.error"),
            description: t("player.error.notfound"),
            buttons: [
                {
                    title: t("dialog.return"),
                    onClick: () => navigate("/")
                },
                {
                    title: t("dialog.retry"),
                    onClick: () => response.Refetch([anime_data.data?.player_ID, extractionData().actual, extractionData().type], true)
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
        if (anime_data.continewatch) {
            navigate("/")
            return
        }
        if (config.Player.general.PlayerBehavior === "home") navigate("/")
        else {
            localStorage.setItem("informationCache", JSON.stringify({ anime: anime_data.data, saveData: anime_data.save, animulist: anime_data.animulist }))
            navigate("/info")
        }
    }

    return (
        <Switch>
            <Match when={response.error() || !response.loading() && response.data() && response.data()!.length <= 0}>
                {showErrorDialog()}
            </Match>
            <Match when={response.loading() && !response.error()}>
                {loadingAnimation(leave, { data: anime_data?.data as any, ep: extractionData().actual }, extractionData())}
            </Match>
            <Match when={response.data() && !response.loading() && !response.error() && config.Player.external.enable}>
                <ExternalPlayer
                    animeData={{
                        AnimeData: anime_data.data,
                        saveData: anime_data.save
                    }}
                    playerData={response.data()!}
                    time={extractionData().time}
                    setNextEpisode={setNewEpisode}
                    now_episodes={{ episode: extractionData().actual, type: extractionData().type, episodes: extractionData().episodelist }}
                    externalPlayerData={{ onChage: (data) => setexternalPlayerType(data), current: externalPlayerType() }}
                />
            </Match>
            <Match when={response.data() && !response.loading() && !response.error()}>
                <VideoPlayer
                    player_data={response.data()!}
                    anime_data={{
                        AnimeData: anime_data.data,
                        saveData: anime_data.save,
                        animulist: anime_data.animulist
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
            <div class="player-loading-animation-container show" style={{ "max-height": "min-content" }}>
                <div class="material-symbols-outlined player-waiting">progress_activity</div>
            </div>
        </div>
    )
}

export default player