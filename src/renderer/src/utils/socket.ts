import { socketPlayerInit } from "@renderer/components/miniPlayer";
import { getSocket, setSocket, setSocketRoom } from "./stores/global";
import { io } from "socket.io-client";
import { unwrap } from "solid-js/store";
import { toast } from "./context/ToastNotification";

(window as any).runSocket = runSocket;
(window as any).createRoom = createRoom;
(window as any).getRooms = getRooms;
(window as any).closeSocket = closeSocket;

function closeSocket() {
    const socket = getSocket()
    if (!socket) return
    socket.close()
}

function runSocket(server: string = "") {
    const socket = io(server)
    console.log(socket)

    socket.on("rooms-list", (rooms) => {
        console.log(rooms)
    })

    socket.on("player:init", (playerData: socketPlayerInit) => {
        localStorage.setItem("playerCache", JSON.stringify(unwrap({
            data: playerData.anime,
            save: playerData.saveData,
            episodelist: playerData.temp.episodes,
        })))
        if (location.href.includes("/player")) return
        const tmp = location.href.replaceAll("info", "")
        location.href = `${tmp}player`
    })

    socket.on("disconnect", () => {
        socket.off("player:init")
        socket.off("rooms-list")
        toast("Disconected From Websocket")
    });
    setSocket(socket)
}

function createRoom(name: string) {
    const socket = getSocket()
    console.log(socket)
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

function getRooms() {
    const socket = getSocket()
    console.log(socket)
    if (!socket) return
    return socket.emit("gets-rooms");
}