
// import { useQuery } from "react-query";
import { useLocation, useNavigate } from "react-router-dom"
import { useEffect, useRef, useState } from "react";
import { closeDialog, showDialog } from "@renderer/utils/context/DialogContext";
import { AnimeData, indentityPlayer, SettingsConfig } from "@renderer/utils/GlobalInterface";
import { useSelector } from "react-redux";
import { t } from "i18next";

import "./player.css"
import { detectTitle, refetchHistory } from "@renderer/utils/functions";
import { useHotkeys } from "react-hotkeys-hook";
import Button from "@renderer/components/buttons";
import ExternalPlayer from "./externalPlayer";

import VideoPlayer from "./VideoPlayer";
import { useQuery } from "react-query";
import { SaveToFile } from "@renderer/utils/FilesManager/readFiles";

const player = () => {
    const anime_data: { data: AnimeData, save: indentityPlayer, episodelist: { ep: string, img?: string, title?: string }[] } = useLocation().state
    const navigate = useNavigate()
    const config: SettingsConfig = useSelector((data: any) => data.config);

    const pluginPlayer = useSelector((plugin: any) => plugin.plugin.playerPlugin);
    const [playerVolume, setPlayerVolume] = useState<number>(config.Player.general.Volume)
    const extractionData = useRef<{ actual: string, type: string, episodelist: { ep: string, img?: string, title?: string }[], time: number }>({
        actual: anime_data.save.episode,
        type: anime_data.save.type,
        episodelist: anime_data.episodelist,
        time: anime_data.save.last_Time
    })
    const [externalPlayerType, setexternalPlayerType] = useState<"Movian" | "VLC" | "Mpv" | "ChromeCast">(config.Player.external.type)

    const { data, isFetching: isLoading, refetch } = useQuery({
        queryKey: [anime_data.data.player_ID],
        queryFn: async ({ queryKey }) => {
            const [player_id] = queryKey;
            return await pluginPlayer.player.extractPlayerData(extractionData.current.type, extractionData.current.actual, player_id)
        },
        refetchOnWindowFocus: false,
        staleTime: 2 * 60 * 60 * 1000,
        cacheTime: 2 * 60 * 60 * 1000
    });

    function setNewEpisode(ep: string) {
        extractionData.current = {
            ...extractionData.current,
            time: 0,
            actual: ep
        }
        refetch()
        updateHistory()
    }

    function updateHistory() {
        console.log("SAVE HISTORY", anime_data.save.pluginName)
        SaveToFile({
            saveData: {
                pluginName: anime_data.save.pluginName,
                last_Time: 0,
                type: extractionData.current.type,
                episode: extractionData.current.actual.toString()
            },
            AnimeData: {
                ...anime_data.data,
                nextAiringEpisode: undefined
            }
        }, "history.json")
        refetchHistory()
    }

    useHotkeys("Escape", async () => {
        await leave()
    });

    useHotkeys("m", () => {
        console.log(anime_data, extractionData)
    })

    useEffect(() => {
        updateHistory()
    },[])

    async function leave() {
        window.BrowserWindow.setFullscreen(false)
        closeDialog()
        if (anime_data.save.last_Time != 0) {
            navigate("/")
            return
        }
        if (config.Player.general.PlayerBehavior === "home") navigate("/")
        else navigate("/info", { state: { anime: anime_data.data, saveData: anime_data.save } })
    }
    if (isLoading == false && data && data.length <= 0) {
        showDialog({
            type: "error",
            title: "Error In Player",
            description: t("player.error.notfound"),
            buttons: {
                firstbutton: () => refetch(),
                secondbutton: () => leave()
            }
        })
        loadingAnimation(leave, { title: anime_data.data.title, ep: extractionData.current.actual, format: anime_data.data.format }, extractionData.current)
        return
    }

    // External Player
    if (data && isLoading == false && config.Player.external.enable) {
        return (
            <ExternalPlayer
                animeData={{
                    AnimeData: anime_data.data,
                    saveData: anime_data.save
                }}
                playerData={data}
                time={extractionData.current.time}
                setNextEpisode={setNewEpisode}
                now_episodes={{ episode: extractionData.current.actual, type: extractionData.current.type, episodes: extractionData.current.episodelist }}
                externalPlayerData={{ onChage: (data) => setexternalPlayerType(data), current: externalPlayerType }}
            />
        )
    }

    // Player
    if (data && isLoading == false) {
        return (
            <VideoPlayer
                player_data={data}
                anime_data={{
                    AnimeData: anime_data.data,
                    saveData: anime_data.save
                }}
                temp={{ episode: extractionData.current.actual, type: extractionData.current.type, episodes: extractionData.current.episodelist}}
                setNextEpisode={setNewEpisode}
                volumeCacheFunc={setPlayerVolume}
                PlayerVolume={playerVolume}
                time={extractionData.current.time}
                exitFromPlayer={leave}
            />
        )
    }
    return loadingAnimation(leave, { title: anime_data.data.title, ep: extractionData.current.actual, format: anime_data.data.format }, extractionData.current)
}

function getCurrentImage(currentdata: { actual: string, type: string, episodelist: { ep: string, img?: string, title?: string }[], time: number }): string | undefined {
    for (let index = 0; index < currentdata.episodelist.length; index++) {
        const element = currentdata.episodelist[index];
        if (element.ep == currentdata.actual && element.img) return element.img
    }
    return undefined
}

function loadingAnimation(leave: () => void, anime_data: { title: { english?: string | undefined; native: string; romaji: string; }, ep: string, format?: string }, currentdata: { actual: string, type: string, episodelist: { ep: string, img?: string, title?: string }[], time: number }) {
    return (
        <div className="player-loading-container" style={{ backgroundImage: `url(${getCurrentImage(currentdata)})` }}>
            <div className="player-loading-container-black"></div>
            <div className="player-loading-top">
                <Button icon='arrow_back' ButtonClass='player-buttons' iconClassName="player-button-icons" onClick={leave} />
                <div className="player-title ">{detectTitle(anime_data)}</div>
            </div>
            <div className="player-loading-animation-container" style={{ maxHeight: "min-content" }}>
                <div className="player-waiting material-symbols-outlined">progress_activity</div>
            </div>
        </div>
    )
}

export default player