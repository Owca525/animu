import { get_player_anime } from "@renderer/utils/backend";
import { playerUrlProps } from "@renderer/utils/interface";
import { useQuery } from "react-query";
import { useLocation, useNavigate } from "react-router-dom"
import { lazy, Suspense, useContext, useState } from "react";
import { configContext } from "@renderer/utils/context/small";
import { closeDialog, showDialog } from "@renderer/utils/context/DialogContext";
import { useTranslation } from "react-i18next";
import useHotkeys from "@reecelucas/react-use-hotkeys";

const VideoPlayer = lazy(() => import('./VideoPlayer'));
// const ExternalPlayer = lazy(() => import('./externalPlayer'));

async function fetchEpisodeData({ queryKey }): Promise<playerUrlProps[]> {
    return await get_player_anime(queryKey[0], queryKey[1])
}

const player = () => {
    const { id, title, episodes, episode, time, img } = useLocation().state
    const { t } = useTranslation()
    const navigate = useNavigate()
    const config = useContext(configContext)

    const [playerVolume, setPlayerVolume] = useState<number>(config.Player.general.Volume)
    const [extractionData, setextractionData] = useState<{ id: string, episode: { type: string, ep: number } }>({ id: id, episode: episode })
    const { data, isLoading, refetch } = useQuery(
        [extractionData.id, extractionData.episode],
        fetchEpisodeData,
    );

    const buttons = [{ title: t('general.ok'), onClick: () => leave() }, { title: t('general.reload'), onClick: async () => { closeDialog(); refetch({ exact: true }) } }]

    function setNewEpisode(type: string) {
        navigate('/player', {
            state: {
                id: id,
                title: title,
                episodes: episodes,
                episode: episode,
                time: 0,
                img: img
            }
        })
        setextractionData((old) => {
            let ep = episodes.indexOf(old.episode.ep)
            if (type == 'prev') ep = ep - 1
            if (type == 'next') ep = ep + 1
            if (episodes[ep] === undefined) return {
                id: old.id,
                episode: old.episode
            }
            return {
                id: old.id,
                episode: { type: old.episode.type, ep: episodes[ep] }
            }
        })
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

    if (data && data.length === 0) {
        showDialog({ header_text: t("errors.playerHeaderError"), text: t("errors.playerCantFind"), buttons: buttons })
    }

    // if (true) {
    //     return (
    //         <ExternalPlayer />
    //     )
    // }

    if (data && data.length !== 0 && isLoading == false) {
        return (
            <Suspense fallback={loadingAnimation()}>
                <VideoPlayer
                    id={id}
                    img={img}
                    title={title}
                    episodes={episodes}
                    episode={extractionData.episode}
                    functions={{ nextButton: setNewEpisode, prevButton: setNewEpisode }}
                    episodesUrl={data}
                    time={time}
                    volumeCacheFunc={setPlayerVolume}
                    PlayerVolume={playerVolume}
                />
            </Suspense>
        )
    }
    return loadingAnimation()
}

function loadingAnimation() {
    return (
        <div className="video-container" style={{ height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div className="player-loading-container" style={{ maxHeight: "min-content" }}>
                <div className="player-waiting material-symbols-outlined">progress_activity</div>
            </div>
        </div>
    )
}

export default player