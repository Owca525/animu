
import { useQuery } from "react-query";
import { useLocation, useNavigate } from "react-router-dom"
import { lazy, Suspense, useState } from "react";
import { closeDialog, showDialog } from "@renderer/utils/context/DialogContext";
import useHotkeys from "@reecelucas/react-use-hotkeys";
import { cardData, SettingsConfig } from "@renderer/utils/GlobalInterface";
import { useSelector } from "react-redux";
import { extractURLS } from "@renderer/plugins/allmanga";
import { t } from "i18next";

import "./css/player.css"

const VideoPlayer = lazy(() => import('./VideoPlayer'));
// const ExternalPlayer = lazy(() => import('./externalPlayer'));

const player = () => {
    const anime_data: { data: cardData, episodelist: Array<string> } = useLocation().state
    // const { t } = useTranslation()
    const navigate = useNavigate()
    const config: SettingsConfig = useSelector((data: any) => data.config);

    const [playerVolume, setPlayerVolume] = useState<number>(config.Player.general.Volume)
    const [extractionData, setextractionData] = useState<{ actual: string, type: string, episodelist: Array<string> }>({ actual: anime_data.data.saveData ? anime_data.data.saveData.episode : "1", type: anime_data.data.saveData ? anime_data.data.saveData.type : "sub", episodelist: anime_data.episodelist })
    const func = () => extractURLS(extractionData.type, extractionData.actual, anime_data.data.AnimeData.player_ID ? anime_data.data.AnimeData.player_ID : "")
    // const buttons = [{ title: t('general.ok'), onClick: () => leave() }, { title: t('general.reload'), onClick: async () => { closeDialog(); refetch({ exact: true }) } }]

    const { data, isLoading, error, refetch } = useQuery(
        [func.toString()],
        func,
        {
            refetchOnWindowFocus: false,
        }
    );

    function setNewEpisode(type: string) {
        setextractionData((old) => {
            let ep = extractionData.episodelist.indexOf(old.actual)
            if (type == 'prev') ep = ep - 1
            if (type == 'next') ep = ep + 1
            if (extractionData.episodelist[ep] === undefined) return {
                ...old
            }
            return {
                ...old,
                actual: extractionData.episodelist[ep]
            }
        })
        console.log(extractionData)
        refetch({ exact: true })
    }

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
            type: "error",
            title: t("player.error.notfound"),
            buttons: {
                yesButton: () => leave(),
                noButton: () => refetch({ exact: true })
            }
        })
        return
    }

    // if (true) {
    //     return (
    //         <ExternalPlayer />
    //     )
    // }
    if (data) {
        return (
            <Suspense fallback={loadingAnimation()}>
                <VideoPlayer
                    player_data={data}
                    anime_data={anime_data.data}
                    temp={{ episode: extractionData.actual, type: extractionData.type, episodes: extractionData.episodelist }}
                    functions={{ nextButton: setNewEpisode, prevButton: setNewEpisode }}
                    volumeCacheFunc={setPlayerVolume}
                    PlayerVolume={playerVolume}
                    time={anime_data.data.saveData ? anime_data.data.saveData.last_Time : 0}
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