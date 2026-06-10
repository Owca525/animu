import {
    createEffect,
    createSignal,
    For,
    JSX,
    Show
} from 'solid-js';
import { getConfig } from '../stores/config';
import './css/SocketContext.css';
import { createRoom, runSocket } from '../socket';
import { getSocket, getSocketRoom } from '../stores/global';
import Button from '@renderer/components/buttons';
import { unwrap } from 'solid-js/store';
import { Portal } from 'solid-js/web';
import { SheepShortcut } from '../hooks/useKeyPress';

export function SocketProvider(props: { children: JSX.Element }) {
    const [show, setShow] = createSignal<boolean>(false);
    const [roomList, setRoomList] = createSignal<{ name: string, users: number }[]>([]);
    const [currentRoom, setRoom] = createSignal<string | undefined>(undefined);
    let refreshTime: NodeJS.Timeout | undefined

    // SheepShortcut(["ctrl", "shift", "i"], () => {
    //     if (!getConfig().socket.useSocket) return
    // })

    SheepShortcut(["Control", "Shift", "S"], () => {
        if (!getConfig().socket.useSocket) return
        setShow((v) => !v)
    })

    function conncetToWebSocket() {
        const config = getConfig()
        const backend = config.socket.backend
        if (!config.socket.useSocket) return
        if (backend.replaceAll(" ", "").length > 0 || backend.startsWith("http://") || backend.startsWith("https://")) {
            if (!getSocket()) {
                const socket = runSocket(config.socket.backend)
                socket.on("rooms-list", (rooms) => setRoomList(rooms))
                socket.emit("gets-rooms")
            }
        }
    }

    function disconnectWebSocket() {
        const socket = getSocket()
        if (socket) socket.disconnect() 
    }

    function reconnectWebsocket() {
        if (getSocket()) disconnectWebSocket()
        conncetToWebSocket()
        if (currentRoom()) createRoom(unwrap(currentRoom()!))
    }

    createEffect(() => {
        setRoom(getSocketRoom())
    })

    createEffect(() => {
        show()
        const socket = getSocket()
        
        if (show() && socket) {
            clearInterval(refreshTime)
            socket.emit("gets-rooms")
            setInterval(() => {
                const socket = getSocket()
                if (socket) socket.emit("gets-rooms")
            }, 5000)
        } else {
            clearInterval(refreshTime)
        }
    })

    function connectToRoom(name: string) {
        if (currentRoom() == name) return
        createRoom(name)
    }

    function makeNewRoom() {
        createRoom(crypto.randomUUID())
    }

    return (
        <>
            {props.children}
            <Portal>
                <Show when={show()}>
                    <main class='socket-main-container'>
                        <div class='socket-topbar'>
                            <span class='socket-userid'>{getSocket() ? getSocket()?.id : "Uknown"}</span>
                            <div class="socket-buttons-contaienr">
                                <Button ButtonClass='socket-button' onClick={() => getSocket() ? disconnectWebSocket() : conncetToWebSocket()}
                                    content={getSocket() ? "Disconnect" : "Connect"} />
                                <Button icon='replay' onClick={reconnectWebsocket} titleButton='Reconnect'/>
                                <Button icon='add' onClick={makeNewRoom} titleButton='Make Room'/>
                            </div>
                        </div>
                        <div class='socket-roomList'>
                            <For each={roomList()}>
                                {(item) => (
                                    <span class='socket-button-connect' onClick={() => connectToRoom(item.name)}>
                                        <span>{item.name}</span>
                                        <span>{item.users}</span>
                                    </span>
                                )}
                            </For>
                        </div>
                    </main>
                </Show>
            </Portal>
        </>
    );
}

// export { };
