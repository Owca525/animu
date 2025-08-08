

import Button from "@renderer/components/buttons"
import "./components/css/externalPlayer.css"
import { cardData, notificationProps, playerData, SettingsConfig } from "@renderer/utils/GlobalInterface"
import { detectTitle } from "@renderer/utils/functions"
import { useEffect, useState } from "react"
import { toast } from "react-toastify"
import { useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import Dropdown from "@renderer/components/dropDown"

interface ExternalplayerProps {
    animeData: cardData
    playerData: playerData[]
    time: number
    setNextEpisode: (value: string) => void
    now_episodes: { episode: string, type: string, episodes: Array<string> }
}

const ExternalPlayer: React.FC<ExternalplayerProps> = ({ animeData, now_episodes, playerData, setNextEpisode, time }) => {
    const navigate = useNavigate()
    const config: SettingsConfig = useSelector((data: any) => data.config);
    const [AnimeTitle, _setAnimeTitle] = useState<string>(() => detectTitle({
        ...animeData, saveData: {
            episode: now_episodes.episode,
            pluginName: "",
            last_Time: 0,
            type: ""
        }
    }))

    const [chromCastDeviceList, setchromCastDeviceList] = useState<{ host: string, port: number, name: string }[]>([])

    async function RunMovian() {
        let url = playerData[0].resolution[0].url
        let req = await window.api.request.get(`http://${config.Player.external.movianIP}/showtime/open?url=${encodeURIComponent(url)}`, {})
        if (!req.success && req.error == "fetch failed") {
            toast.error("Failed to run Movian", notificationProps)
        }
    }

    console.log(playerData)

    function setEpisode(type: "next" | "prev") {
        let ep = now_episodes.episodes.indexOf(now_episodes.episode)
        if (type == 'prev') ep = ep - 1
        if (type == 'next') ep = ep + 1
        if (now_episodes.episodes[ep] === undefined) return
        setNextEpisode(ep.toString())
    }

    function runMpvPlayer() {
        window.api.runExternaPlayer({ url: playerData[0].resolution[0].url, title: AnimeTitle, path: "/usr/bin/mpv", time: time }, "mpv")
    }

    function runVlcPlayer() {
        window.api.runExternaPlayer({ url: playerData[0].resolution[0].url, title: AnimeTitle, path: "/usr/bin/vlc", time: time }, "vlc")
    }

    useEffect(() => {
        if (config.Player.external.type === "movian") RunMovian()
        if (config.Player.external.type === "mpv") runMpvPlayer()
        if (config.Player.external.type === "vlc") runVlcPlayer()
        window.api.chromecast.startSearch()
    }, [])

    // TODO: napraw wyszukiwanie urządzeń i zabezpieczenia do tego
    async function runChromeCast(device: { host: string, port: number, name: string }) {
        await window.api.chromecast.connect(device, { title: AnimeTitle, time: time, url: playerData[0].resolution[0].url, type: "video/mp4" })
    }

    async function refetchChromeCastDevices() {
        console.log(await window.api.chromecast.deviceList())
        setchromCastDeviceList(await window.api.chromecast.deviceList())
    }

    useEffect(() => {
        refetchChromeCastDevices()
    }, [window.api.chromecast.deviceList()])

    return (
        // TODO: add .external-player-container-chromecast class when left bar is shown
        <div className="external-player-container">
            <div className="external-leftpanel-container">
                <div className="external-leftpanel-topbar">
                    <button className="button external-leftpanel-topbar-button material-symbols-outlined" onClick={refetchChromeCastDevices}>refresh</button>
                </div>
                <div className="external-leftpanel">
                    {chromCastDeviceList.map((element) => (
                        <button className="button external-panelbutton" onClick={async () => await runChromeCast(element)}>
                            <div className="external-panelbutton-icon material-symbols-outlined">cast</div>
                            <div className="external-button-textcontainer">
                                {element.name}
                                <span className="external-panelbutton-bottomtext">disconnected</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
            <div className="external-player-top">
                <div className="video-top">
                    <Button icon="arrow_back" ButtonClass="player-buttons" onClick={() => navigate("/")} />
                    <div className="player-title">{AnimeTitle}</div>
                </div>
                <div className="external-dropdown">
                    <Dropdown placeholder={playerData[0].hostname} options={playerData.map((element) => { return { label: element.hostname } })} disableX />
                    <Dropdown placeholder="1080p" options={[{ label: "1080p" }, { label: "720p" }, { label: "480p" }, { label: "360p" }]} disableX />
                    <Dropdown options={
                        [
                            { label: "mpv", icon: "https://mpv.io/images/mpv-logo-128-0baae5aa.png" },
                            { label: "VLC", icon: "https://images.videolan.org/images/largeVLC.png" },
                            { label: "Movian", icon: "https://apps.movian.eu/favicon.ico" },
                        ]
                    } disableX placeholder={"test"}
                    /></div>
            </div>
            <div className="external-player-center">
                <div className="external-button-container">
                    <Button icon='skip_previous' ButtonClass="player-buttons" onClick={() => setEpisode("prev")} />
                    <Button icon='replay' ButtonClass="player-buttons" onClick={RunMovian} />
                    <Button icon='skip_next' ButtonClass="player-buttons" onClick={() => setEpisode("next")} />
                </div>
            </div>
            <div className="external-episodes-container">
                <div className="external-episodes-title">Episodes:</div>
                <div className="external-episodes">
                    {now_episodes.episodes.map((num) => (
                        <div className='information-episode-button' onClick={() => setNextEpisode(num)}>{num}</div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default ExternalPlayer