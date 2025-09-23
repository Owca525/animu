
import { useQuery } from "react-query";
import { useLocation, useNavigate } from "react-router-dom"
import { useCallback, useEffect, useState } from "react";
import { closeDialog, showDialog } from "@renderer/utils/context/DialogContext";
import { cardData, SettingsConfig } from "@renderer/utils/GlobalInterface";
import { useSelector } from "react-redux";
import { t } from "i18next";

import "./player.css"
import { SaveHistory } from "@renderer/utils/history/history";
import { detectTitle, refetchHistory } from "@renderer/utils/functions";
import { useHotkeys } from "react-hotkeys-hook";
import Button from "@renderer/components/buttons";
import ExternalPlayer from "./externalPlayer";

import VideoPlayer from "./VideoPlayer";
// const VideoPlayer = lazy(() => import('./VideoPlayer'));
// const ExternalPlayer = lazy(() => import('./externalPlayer'));

const player = () => {
    const anime_data: { data: cardData, episodelist: { ep: string, img?: string, title?: string }[], continueWatch?: boolean } = useLocation().state
    // const { t } = useTranslation()
    const navigate = useNavigate()
    const config: SettingsConfig = useSelector((data: any) => data.config);

    const pluginPlayer = useSelector((plugin: any) => plugin.plugin.playerPlugin);
    const [playerVolume, setPlayerVolume] = useState<number>(config.Player.general.Volume)
    const [extractionData, setextractionData] = useState<{ actual: string, type: string, episodelist: { ep: string, img?: string, title?: string }[], time: number }>({ actual: anime_data.data.saveData ? anime_data.data.saveData.episode : "1", type: anime_data.data.saveData ? anime_data.data.saveData.type : "sub", episodelist: anime_data.episodelist, time: anime_data.data.saveData ? anime_data.data.saveData?.last_Time : 0 })
    const playerID = anime_data.data.AnimeData.player_ID ?? "";
    const extractFunc = useCallback(() => {
        return pluginPlayer.player.getUrls(extractionData.type, extractionData.actual, playerID);
    }, [extractionData, playerID]);
    const [externalPlayerType, setexternalPlayerType] = useState<"Movian" | "VLC" | "Mpv" | "ChromeCast">(config.Player.external.type)

    const { data, isLoading, refetch } = useQuery({
        queryKey: [extractionData.type, extractionData.actual, playerID],
        queryFn: extractFunc,
        refetchOnWindowFocus: false,
        staleTime: 2 * 60 * 60 * 1000,
        cacheTime: 2 * 60 * 60 * 1000
    });

    function setNewEpisode(ep: string) {
        setextractionData((old) => {
            return {
                ...old,
                time: 0,
                actual: ep
            }
        })
        refetch()
    }

    useEffect(() => {
        SaveHistory({
            saveData: {
                pluginName: anime_data.data.saveData && anime_data.data.saveData.pluginName == "" ? "Allmanga" : config.plugins.player,
                last_Time: 0,
                type: extractionData.type,
                episode: extractionData.actual.toString()
            },
            AnimeData: {
                ...anime_data.data.AnimeData,
                nextAiringEpisode: undefined
            }
        })
        refetchHistory()
    }, [extractionData])

    useHotkeys("Escape", async () => {
        await leave()
    });

    async function leave() {
        window.BrowserWindow.setFullscreen(false)
        closeDialog()
        if (anime_data.continueWatch) {
            navigate("/")
            return
        }
        if (config.Player.general.PlayerBehavior === "home") navigate("/")
        else navigate("/info", { state: anime_data.data.AnimeData })
    }
    if (isLoading == false && data && data.length <= 0) {
        loadingAnimation(leave, { title: anime_data.data.AnimeData.title, ep: extractionData.actual, format: anime_data.data.AnimeData.format }, extractionData)
        showDialog({
            type: "refresh",
            title: t("player.error.notfound"),
            buttons: {
                firstbutton: () => refetch(),
                secondbutton: () => leave()
            }
        })
        return
    }

    if (data && isLoading == false && config.Player.external.enable) {
        return (
            <ExternalPlayer
                animeData={anime_data.data}
                playerData={data}
                time={extractionData.time}
                setNextEpisode={setNewEpisode}
                now_episodes={{ episode: extractionData.actual, type: extractionData.type, episodes: extractionData.episodelist }}
                externalPlayerData={{ onChage: (data) => setexternalPlayerType(data), current: externalPlayerType }}
            />
        )
    }

    if (data && isLoading == false) {
        return (
            <VideoPlayer
                player_data={data}
                anime_data={anime_data.data}
                temp={{ episode: extractionData.actual, type: extractionData.type, episodes: extractionData.episodelist }}
                setNextEpisode={setNewEpisode}
                volumeCacheFunc={setPlayerVolume}
                PlayerVolume={playerVolume}
                time={extractionData.time}
                exitFromPlayer={leave}
            />
        )
    }
    return loadingAnimation(leave, { title: anime_data.data.AnimeData.title, ep: extractionData.actual, format: anime_data.data.AnimeData.format }, extractionData)
}

function getCurrentImage(currentdata: { actual: string, type: string, episodelist: { ep: string, img?: string, title?: string }[], time: number }): string | undefined {
    for (let index = 0; index < currentdata.episodelist.length; index++) {
        const element = currentdata.episodelist[index];
        console.log(element.img)
        if (element.ep == currentdata.actual && element.img) return element.img
    }
    return undefined
}

function loadingAnimation(leave: () => void, anime_data: { title: { english?: string | undefined; native: string; romaji: string; }, ep: string, format?: string }, currentdata: { actual: string, type: string, episodelist: { ep: string, img?: string, title?: string }[], time: number }) {
    return (
        <div className="player-loading-container" style={{ backgroundImage: `url(${getCurrentImage(currentdata)})` }}>
            <div className="player-loading-container-black"></div>
            <div className="player-loading-top">
                <Button icon='arrow_back' ButtonClass='player-buttons' onClick={leave} />
                <div className="player-title ">{detectTitle(anime_data)}</div>
            </div>
            <div className="player-loading-animation-container" style={{ maxHeight: "min-content" }}>
                <div className="player-waiting material-symbols-outlined">progress_activity</div>
            </div>
        </div>
    )
}

export default player