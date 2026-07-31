import { getSocket, PlayerCache, setIncognitoMode, setSocket, setSocketRoom } from "./stores/global";
import { io } from "socket.io-client";
import { toast } from "./context/ToastNotification";
import { globalNavigate } from "./functions";
import { playerData } from "./types";

(window as any).runSocket = runSocket;
(window as any).createRoom = createRoom;
(window as any).getRooms = getRooms;
(window as any).closeSocket = closeSocket;

export function closeSocket() {
    const socket = getSocket()
    if (!socket) return
    socket.close()
}

function OverWritePlayer(url: string, hls: boolean) {
    if (!url || !hls) throw new Error("Give 2 Aruments");

    PlayerCache.update({
        anime: {
            title: {
                native: "Player Overwrite",
                romaji: "Player Overwrite"
            },
            id: crypto.randomUUID(),
            player_ID: crypto.randomUUID()
        },
        saveData: {
            last_Time: 0,
            type: "sub",
            pluginName: "Animu_Player_Overwriter_Mode",
            episode: "1"
        },
        episodelist: [{ ep: "" }],
        continewatch: false
    });

    (window as any).playerOverWriteContent = [
        {
            hostname: "OverWriter",
            resolution: [{
                res: "1080",
                url: url,
                hls: hls
            }],
        }
    ] as playerData[]

    globalNavigate("/player")

    setIncognitoMode(true)
}

(window as any).OverWritePlayer = OverWritePlayer;

export function runSocket(server: string = "") {
    const socket = io(server)

    socket.on("player:init", (playerData) => {
        PlayerCache.update({
            anime: playerData.anime,
            saveData: playerData.saveData,
            episodelist: playerData.temp.episodes,
            continewatch: false
        });

        (window as any).playerOverWriteContent = playerData["owcapierdolik"]

        if (location.href.includes("/player")) return
        const tmp = location.href.replaceAll("info", "")
        location.href = `${tmp}player`
    })

    socket.on("disconnect", () => {
        socket.off("player:init")
        socket.off("rooms-list")
        setSocket(undefined as any)
        toast("Disconected From Websocket")
    });
    setSocket(socket)
    return socket
}

export function createRoom(name: string) {
    const socket = getSocket()
    if (!socket) return
    socket.emit("join-room", name, (resp) => {
        if (!resp.success) return toast(`Failed Connect to Room ${name}`)
        else {
            toast(`Sucesfully Connected to ${name}`)
            setSocketRoom(name)
        }
    });
    setSocketRoom(name)
}

export function getRooms() {
    const socket = getSocket()
    if (!socket) return
    return socket.emit("gets-rooms");
}