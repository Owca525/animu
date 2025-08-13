

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
    externalPlayerData: { onChage: (data: "Movian" | "VLC" | "Mpv" | "ChromeCast") => void, current: "Movian" | "VLC" | "Mpv" | "ChromeCast" }
}

function filterTextChromeCast(text: string) {
    let index = text.lastIndexOf("-")
    if (index === -1) return text;
    return text.substring(0, index).replaceAll("-", " ")
}

const ExternalPlayer: React.FC<ExternalplayerProps> = ({ animeData, now_episodes, playerData, setNextEpisode, time, externalPlayerData }) => {
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

    // Player Related
    const [resolutionList, setResolutionList] = useState<{ res: string, url: string }[]>([])
    const [currentHost, setCurrentHost] = useState<playerData | undefined>(undefined)
    const [currentResolution, setCurrentResolution] = useState<string>("Not Found")
    const [currentUrl, setCurrentUrl] = useState<string | undefined>(undefined)
    const [currentPlayer, setCurrentPlayer] = useState<"Movian" | "VLC" | "Mpv" | "ChromeCast">(externalPlayerData.current)

    // Chomecast Related
    const [chromCastDeviceList, setchromCastDeviceList] = useState<{ host: string, port: number, name: string }[]>([])

    // Running Players
    async function RunMovian(url?: string) {
        if (!url) return
        let req = await window.api.request.get(`http://${config.Player.external.movianIP}/showtime/open?url=${encodeURIComponent(url)}`, {})
        if (!req.success && req.error == "fetch failed") {
            toast.error("Failed to run Movian", notificationProps)
        }
    }
    function runMpvPlayer(url?: string) {
        if (!url) return
        window.api.runExternaPlayer({ url: url, title: AnimeTitle, path: config.Player.external.mpvPath, time: time }, "mpv")
    }

    function runVlcPlayer(url?: string) {
        if (!url) return
        window.api.runExternaPlayer({ url: url, title: AnimeTitle, path: config.Player.external.vlcPath, time: time }, "vlc")
    }
    // TODO: napraw wyszukiwanie urządzeń i zabezpieczenia do tego
    async function runChromeCast(device: { host: string, port: number, name: string }) {
        if (currentHost && currentHost.hls) {
            toast.error("ChromeCast Doesn't support m3u8 format")
            return
        }
        if (currentUrl) await window.api.chromecast.connect(device, { title: AnimeTitle, time: time, url: currentUrl, type: "video/mp4" })
    }

    function setEpisode(type: "next" | "prev") {
        let ep = now_episodes.episodes.indexOf(now_episodes.episode)
        if (type == 'prev') ep = ep - 1
        if (type == 'next') ep = ep + 1
        if (now_episodes.episodes[ep] === undefined) return
        setNextEpisode(now_episodes.episodes[ep])
    }

    function ChangeResolution(data: { res: string, url: string }) {
        setCurrentResolution(() => data.res)
        setCurrentUrl(() => data.url)
    }

    function ChangeHost(data: playerData) {
        setCurrentHost(() => data)
        setResolutionList(() => data.resolution)
    }

    function RunPlayers(url?: string, type?: "Movian" | "VLC" | "Mpv" | "ChromeCast") {
        let tempType = currentPlayer != type && type ? type : currentPlayer
        let temp = currentUrl
        if (url) temp = url
        if (tempType === "Movian") RunMovian(temp)
        if (tempType === "Mpv") runMpvPlayer(temp)
        if (tempType === "VLC") runVlcPlayer(temp)
        externalPlayerData.onChage(tempType)
        toast.success(`Running ${tempType}`)
    }

    useEffect(() => {
        if (playerData.length <= 0) {
            toast.error("Players Not Found", notificationProps)
            return
        }

        setCurrentHost(() => playerData[0])
        if (playerData[0].resolution.length <= 0) {
            toast.error("Resolution not found", notificationProps)
            return
        }
        setResolutionList(() => playerData[0].resolution)
        setCurrentResolution(() => playerData[0].resolution[0].res)
        setCurrentUrl(() => playerData[0].resolution[0].url)
        
        RunPlayers(playerData[0].resolution[0].url)
    }, [])

    async function refetchChromeCastDevices() {
        console.log(await window.api.chromecast.deviceList())
        setchromCastDeviceList(await window.api.chromecast.deviceList())
    }

    return (
        <div className="external-player-container">
            {/* TODO: Give this div class external-player-container-player when chromecast panel is shown */}
            <div className="external-player-container-player">
                <div className="external-player-top">
                    <div className="video-top">
                        <Button icon="arrow_back" ButtonClass="player-buttons" onClick={() => navigate("/")} />
                        <div className="player-title">{AnimeTitle}</div>
                    </div>
                    <div className="external-dropdown">
                        <Dropdown options={[
                            { label: "Mpv", onClick: () => {setCurrentPlayer(() => "Mpv"), RunPlayers(undefined, "Mpv")} },
                            { label: "VLC", onClick: () => {setCurrentPlayer(() => "VLC"), RunPlayers(undefined, "VLC")} },
                            { label: "Movian", onClick: () => {setCurrentPlayer(() => "Movian"), RunPlayers(undefined, "Movian")} },
                            { label: "ChromeCast", onClick: () => {setCurrentPlayer(() => "ChromeCast"), RunPlayers(undefined, "ChromeCast")} }
                        ]} placeholder="Not Found" buttonText={config.Player.external.type} disableX
                        />
                        {currentHost && !currentHost.hls && <Dropdown placeholder="Not Found" buttonText={currentResolution != "Not Found" && currentResolution != "" ? `${currentResolution}p` : "Not Found"} options={resolutionList.map((element) => { return { label: `${element.res}p`, onClick: () => ChangeResolution(element) } })} disableX />}
                        <Dropdown placeholder="Not Found" buttonText={currentHost ? currentHost.hostname : "Not Found"} options={playerData.map((element) => { return { label: element.hostname, onClick: () => ChangeHost(element) } })} disableX />
                    </div>
                </div>
                <div className="external-player-center">
                    <div className="external-button-container">
                        <Button icon='skip_previous' ButtonClass="player-buttons" onClick={() => setEpisode("prev")} />
                        <Button icon='replay' ButtonClass="player-buttons" onClick={RunPlayers} />
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
            {/* TODO: Give this thing display: none if external player is not chromecast */}
            <div className="external-player-container-player-chromecast">
                <div className="external-leftpanel-container">
                    <div className="external-leftpanel-topbar">
                        <button className="button external-leftpanel-topbar-button material-symbols-outlined" onClick={refetchChromeCastDevices}>refresh</button>
                    </div>
                    <div className="external-leftpanel">
                        {chromCastDeviceList.map((element) => (
                            <button className="button external-panelbutton" onClick={async () => await runChromeCast(element)}>
                                <div className="external-panelbutton-icon material-symbols-outlined">cast</div>
                                <div className="external-button-textcontainer">
                                    <span className="external-panelbutton-title">{filterTextChromeCast(element.name)}</span>
                                    <span className="external-panelbutton-bottomtext">disconnected</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ExternalPlayer