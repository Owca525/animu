
import { useQuery } from "react-query";
import { useLocation, useNavigate } from "react-router-dom"
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { closeDialog, showDialog } from "@renderer/utils/context/DialogContext";
import { cardData, SettingsConfig } from "@renderer/utils/GlobalInterface";
import { useSelector } from "react-redux";
import { t } from "i18next";

import "./player.css"
import { SaveHistory } from "@renderer/utils/history/history";
import { refetchHistory } from "@renderer/utils/functions";
import { useHotkeys } from "react-hotkeys-hook";

const VideoPlayer = lazy(() => import('./components/VideoPlayer'));
// const ExternalPlayer = lazy(() => import('./externalPlayer'));

const player = () => {
    const anime_data: { data: cardData, episodelist: Array<string> } = useLocation().state
    // const { t } = useTranslation()
    const navigate = useNavigate()
    const config: SettingsConfig = useSelector((data: any) => data.config);

    console.log(anime_data, anime_data.data)

    const pluginPlayer = useSelector((plugin: any) => plugin.plugin.playerPlugin);
    const [playerVolume, setPlayerVolume] = useState<number>(config.Player.general.Volume)
    const [extractionData, setextractionData] = useState<{ actual: string, type: string, episodelist: Array<string>, time: number }>({ actual: anime_data.data.saveData ? anime_data.data.saveData.episode : "1", type: anime_data.data.saveData ? anime_data.data.saveData.type : "sub", episodelist: anime_data.episodelist, time: anime_data.data.saveData ? anime_data.data.saveData?.last_Time : 0 })
    const playerID = anime_data.data.AnimeData.player_ID ?? "";
    const extractFunc = useCallback(() => {
    return pluginPlayer.player.getUrls(extractionData.type, extractionData.actual, playerID);
    }, [extractionData, playerID]);

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['extract-urls', extractionData.type, extractionData.actual, playerID],
        queryFn: extractFunc,
        refetchOnWindowFocus: false,
    });

    function setNewEpisode(type: string) {
        setextractionData((old) => {
            let ep = extractionData.episodelist.indexOf(old.actual)
            if (type == 'prev') ep = ep - 1
            if (type == 'next') ep = ep + 1
            console.log(extractionData.episodelist[ep], extractionData.episodelist.indexOf(old.actual))
            if (extractionData.episodelist[ep] === undefined) return old
            return {
                ...old,
                time: 0,
                actual: extractionData.episodelist[ep]
            }
        })
        refetch()
    }

    useEffect(() => {
        SaveHistory({
            saveData: {
                pluginName: "",
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

    useHotkeys("Escape", () => {
        leave()
    });

    function leave() {
        navigate("/")
        window.BrowserWindow.setFullscreen(false)
        closeDialog()
    }
    console.log(data)
    if (isLoading == false && data && data.length <= 0) {
        loadingAnimation()
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

    // if (true) {
    //     return (
    //         <ExternalPlayer />
    //     )
    // }
    if (data && isLoading == false) {
        return (
            <Suspense fallback={loadingAnimation()}>
                <VideoPlayer
                    player_data={data}
                    anime_data={anime_data.data}
                    temp={{ episode: extractionData.actual, type: extractionData.type, episodes: extractionData.episodelist }}
                    functions={{ nextButton: setNewEpisode, prevButton: setNewEpisode }}
                    volumeCacheFunc={setPlayerVolume}
                    PlayerVolume={playerVolume}
                    time={extractionData.time}
                />
            </Suspense>
        )
    }
    return loadingAnimation()
}

function loadingAnimation() {
    return (
        <div className="player-video-container" style={{ height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div className="player-loading-container" style={{ maxHeight: "min-content" }}>
                <div className="player-waiting material-symbols-outlined">progress_activity</div>
            </div>
        </div>
    )
}

export default player