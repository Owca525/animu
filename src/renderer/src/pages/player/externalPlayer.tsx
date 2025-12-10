

import Button from "@renderer/components/buttons"
import "./components/css/externalPlayer.css"
import { AnimeData, indentityPlayer, playerData, playerSubtitlesFormat, resolutionFormat, SettingsConfig } from "@renderer/utils/types"
import { detectTitle, isNumberString } from "@renderer/utils/functions"
import Dropdown from "@renderer/components/dropDown"
import { Component, createSignal, For, onMount, Show } from "solid-js"
import { useNavigate } from "@solidjs/router"
import { getConfig } from "@renderer/utils/stores/config"
import { unwrap } from "solid-js/store"
import { toast } from "@renderer/utils/context/ToastNotification"
import { useI18n } from "@renderer/utils/i18n"

interface ExternalplayerProps {
    animeData: {
        AnimeData: AnimeData,
        saveData: indentityPlayer
    }
    playerData: playerData[]
    time: number
    setNextEpisode: (value: string) => void
    now_episodes: { episode: string, type: string, episodes: { ep: string, img?: string, title?: string }[] }
    externalPlayerData: { onChage: (data: "Movian" | "VLC" | "Mpv" | "ChromeCast") => void, current: "Movian" | "VLC" | "Mpv" | "ChromeCast" }
}

function filterTextChromeCast(text: string) {
    let index = text.lastIndexOf("-")
    if (index === -1) return text;
    return text.substring(0, index).replaceAll("-", " ")
}

const ExternalPlayer: Component<ExternalplayerProps> = ({ animeData, now_episodes, playerData, setNextEpisode, time, externalPlayerData }) => {
    const { t } = useI18n()
    
    const navigate = useNavigate()
    const config: SettingsConfig = getConfig();
    const AnimeTitle = detectTitle({ title: animeData.AnimeData.title, ep: now_episodes.episode, format: animeData.AnimeData.format })

    // Player Related
    const [currentHost, setCurrentHost] = createSignal<playerData | undefined>(undefined)
    const [currentResolution, setCurrentResolution] = createSignal<resolutionFormat | undefined>(undefined)
    // t("global.notFound")
    const [currentPlayer, setCurrentPlayer] = createSignal<"Movian" | "VLC" | "Mpv" | "ChromeCast">(externalPlayerData.current)

    // Chomecast Related
    const [chromCastDeviceList, setchromCastDeviceList] = createSignal<{ host: string, port: number, name: string }[]>([])
    const [isSearchChromecastHidded, setisSearchChromecastHidded] = createSignal<boolean>(false)
    const [_secondsLeft, setSecondsLeft] = createSignal<number>(0);
    const [isChromeCastSearch, setisChromeCastSearch] = createSignal<boolean>(false);

    // Running Players
    async function RunMovian(url?: string) {
        if (!url) return
        let req = await fetch(`http://${config.Player.external.movianIP}/showtime/open?url=${encodeURIComponent(url)}`)
        if (!req.ok) toast(t("externalPlayer.failed.movian"), { type: "error" })
    }

    function getNumberOfSub(data: playerSubtitlesFormat[] | undefined) {
        if (!data) return 0
        for (let index = 0; index < data.length; index++) {
            const element = data[index];
            if (!element.label.includes("Forced")) return index + 1
        }
        return 0
    }

    async function runMpvPlayer() {
        if (!currentResolution() || !currentHost()) return
        let subsList: string[] = []
        if (currentHost()?.subtitles) subsList = currentHost()?.subtitles?.map(el => el.url) as string[]
        await window.api.runExternaPlayer({ url: currentResolution()?.url as string, 
            title: AnimeTitle, 
            path: config.Player.external.mpvPath, 
            time: time, 
            subs: { subList: subsList, sid: getNumberOfSub(currentHost()?.subtitles) }, 
            chapters: currentHost()?.external?.chaptersUrl 
        }, "mpv")
    }

    async function runVlcPlayer() {
        if (!currentResolution() || !currentHost()) return
        let subsList: string[] = []
        if (currentHost()?.subtitles) subsList = currentHost()?.subtitles?.map(el => el.url) as string[]
        await window.api.runExternaPlayer({ url: currentResolution()?.url as string, 
            title: AnimeTitle, 
            path: config.Player.external.vlcPath, 
            time: time, 
            subs: { subList: subsList, sid: getNumberOfSub(currentHost()?.subtitles) } 
        }, "vlc")
    }

    async function runChromeCast(device: { host: string, port: number, name: string }) {
        if (!currentResolution() || currentResolution()?.hls) {
            toast(t("externalPlayer.failed.chromecast"), { type: "error" })
            return
        }
        await window.api.chromecast.connect(device, { title: AnimeTitle, time: time, url: currentResolution()?.url as any, type: "video/mp4" })
    }

    function setEpisode(type: "next" | "prev") {
        let ep = now_episodes.episodes.findIndex((item) => item.ep === now_episodes.episode)
        if (ep < 0) return
        if (type == 'prev') ep = ep - 1
        if (type == 'next') ep = ep + 1
        if (now_episodes.episodes[ep].ep === undefined) return
        setNextEpisode(now_episodes.episodes[ep].ep)
    }

    function ChangeHost(data: playerData) {
        setCurrentHost(data)
        setCurrentResolution(() => data.resolution[0])
        RunPlayers()
    }

    function RunPlayers() {
        if (!currentHost()) return
        if (currentPlayer() === "Movian") RunMovian()
        if (currentPlayer() === "Mpv") runMpvPlayer()
        if (currentPlayer() === "VLC") runVlcPlayer()
        externalPlayerData.onChage(currentPlayer())
        if (currentPlayer() !== "ChromeCast") toast(t("externalPlayer.running", { player: currentPlayer() }), { type: "success" })
        if (currentPlayer() === "ChromeCast") startSearchChromeCast()
    }

    onMount(() => {
        if (playerData.length <= 0) {
            toast(t("externalPlayer.failed.player"), { type: "error" })
            return
        }

        setCurrentHost(playerData[0])
        if (playerData[0].resolution.length <= 0) {
            toast(t("externalPlayer.failed.resolution"), { type: "error" })
            return
        }
        setCurrentResolution(() => playerData[0].resolution[0])

        RunPlayers()

        document.querySelectorAll('*').forEach((element: any) => {
            element.tabIndex = -1
        });
    })

    // useEffect(() => {
    //     if (secondsLeft <= 0) {
    //         stopSearchChromeCast()
    //         return
    //     }
    //     const intervalId = setInterval(() => {
    //         setSecondsLeft(prev => {
    //             refetchChromeCastDevices()
    //             return prev - 1
    //         });
    //     }, 1000);
    //     return () => clearInterval(intervalId);
    // }, [secondsLeft]);

    async function refetchChromeCastDevices() {
        setchromCastDeviceList(await window.api.chromecast.deviceList())
    }

    function startSearchChromeCast() {
        setSecondsLeft(() => 30)
        setisChromeCastSearch(() => true)
        window.api.chromecast.startSearch()
    }

    function stopSearchChromeCast() {
        setSecondsLeft(() => 0)
        setisChromeCastSearch(() => false)
        window.api.chromecast.stopSearch()
    }

    // const chromecastSearchContainerVariants = {
    //     invisible: { opacity: 0, x: -500 },
    //     hidden: { opacity: 1, x: -230 },
    //     visible: { opacity: 1, x: 0 },
    // };

    function checkCurrentResolution(): string {
        if (!currentResolution()) return t("global.notFound")
        if (currentResolution()?.hls) return "HLS Mode"
        if (isNumberString(currentResolution()?.res as string)) return `${unwrap(currentResolution()?.res)}p`
        return currentResolution()?.res as string
    }

    return (
        <div class="external-player-container">
            <div class="external-player-container-player">
                <div class="external-player-top">
                    <div class="video-top">
                        <Button icon="arrow_back" ButtonClass="player-buttons" onClick={() => navigate("/")} />
                        <div class="player-title">{AnimeTitle}</div>
                    </div>
                    <div class="external-dropdown">
                        <Dropdown options={[
                            { label: "Mpv", onClick: () => { setCurrentPlayer(() => "Mpv"), RunPlayers() } },
                            { label: "VLC", onClick: () => { setCurrentPlayer(() => "VLC"), RunPlayers() } },
                            { label: "Movian", onClick: () => { setCurrentPlayer(() => "Movian"), RunPlayers() } },
                            { label: "ChromeCast", onClick: () => { setCurrentPlayer(() => "ChromeCast"), RunPlayers() } }
                        ]} placeholder={t("global.notFound")} buttonText={config.Player.external.type} disableX
                        />
                        <Show when={currentResolution()}>
                            <Dropdown 
                                placeholder={t("global.notFound")} 
                                buttonText={checkCurrentResolution()} 
                                options={currentHost()?.resolution.map((element) => { 
                                    let res = unwrap(element.res)
                                    return { label: isNumberString(res) ? `${res}p` : res, onClick: () => {setCurrentResolution(element); RunPlayers()} }
                                 })} 
                                disableX 
                            />
                        </Show>
                        <Dropdown 
                            placeholder={t("global.notFound")} 
                            buttonText={currentHost() ? currentHost()?.hostname : t("global.notFound")} 
                            options={playerData.map((element) => { return { label: element.hostname, onClick: () => ChangeHost(element) } })} 
                            disableX 
                        />
                    </div>
                </div>
                <div class="external-player-center">
                    <div class="external-button-container">
                        <Button icon='skip_previous' ButtonClass="player-buttons" onClick={() => setEpisode("prev")} />
                        <Button icon='replay' ButtonClass="player-buttons" onClick={() => RunPlayers()} />
                        <Button icon='skip_next' ButtonClass="player-buttons" onClick={() => setEpisode("next")} />
                    </div>
                </div>
                <div class="external-episodes-container">
                    <div class="external-episodes-title">{t("externalPlayer.episodes")}</div>
                    <div class="external-episodes">
                        {now_episodes.episodes.map((num) => (
                            <div class='information-episode-button' onClick={() => setNextEpisode(num.ep)}>{num.ep}</div>
                        ))}
                    </div>
                </div>
            </div>

            <Show when={currentPlayer() == "ChromeCast" && isSearchChromecastHidded()}>
                <div class="external-player-container-player-chromecast"
                    onMouseEnter={() => setisSearchChromecastHidded(() => true)}
                    onMouseLeave={() => setisSearchChromecastHidded(() => false)}
                >
                    <div class="external-leftpanel-container">
                        <div class="external-leftpanel-topbar">
                            <button class="button external-leftpanel-topbar-button material-symbols-outlined" 
                                onClick={() => isChromeCastSearch() ? stopSearchChromeCast() : startSearchChromeCast()}>
                                    {isChromeCastSearch() ? "close" : "search"}
                            </button>
                            <button class="button external-leftpanel-topbar-button material-symbols-outlined" onClick={refetchChromeCastDevices}>refresh</button>
                        </div>
                        <div class="external-leftpanel">
                            <For each={chromCastDeviceList()}>
                                {(element) => (
                                    <button class="button external-panelbutton" onClick={async () => await runChromeCast(element)}>
                                        <div class="external-panelbutton-icon material-symbols-outlined">cast</div>
                                        <div class="external-button-textcontainer">
                                            <span class="external-panelbutton-title">{filterTextChromeCast(element.name)}</span>
                                            <span class="external-panelbutton-bottomtext">{t("externalPlayer.chromeCast.disconnected")}</span>
                                        </div>
                                    </button>
                                )}
                            </For>
                            <Show when={isChromeCastSearch()}>
                                <div class="external-panel-search-text">{t("externalPlayer.chromeCast.search")}</div>
                            </Show>
                        </div>
                    </div>
                </div>
            </Show>
        </div>
    )
}

export default ExternalPlayer