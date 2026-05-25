import { getSocket, setSocket, setSocketRoom } from "./stores/global";
import { io } from "socket.io-client";
import { unwrap } from "solid-js/store";
import { toast } from "./context/ToastNotification";
import { socketPlayerInit } from "@renderer/pages/player/VideoPlayer";

(window as any).runSocket = runSocket;
(window as any).createRoom = createRoom;
(window as any).getRooms = getRooms;
(window as any).closeSocket = closeSocket;

export function closeSocket() {
    const socket = getSocket()
    if (!socket) return
    socket.close()
}

export function runSocket(server: string = "") {
    const socket = io(server)
    console.log(socket)

    socket.on("player:init", (playerData: socketPlayerInit) => {
        localStorage.setItem("playerCache", JSON.stringify(unwrap({
            data: playerData.anime,
            save: playerData.saveData,
            episodelist: playerData.temp.episodes,
        })));

        (window as any).customPlayerData = playerData["owcapierdolik"]

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