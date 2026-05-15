import { createContext, createSignal, JSX, For, Show, Switch, Match } from "solid-js";
import { Portal } from "solid-js/web";
import "./css/ToastNotification.css"

type ToastProps = {
    id: string;
    message: string;
    added?: { description: string, icon?: string }
    options?: ToastOptions;
};

type expandedToastProps = ToastProps & { animation: boolean, updated: boolean, timer: NodeJS.Timeout | undefined }

export interface ToastOptions {
    type?: "success" | "error" | "info" | "warning" | "loading" | "notification",
    duration?: number,
    onClick?: () => void;
    timer?: boolean
    click?: boolean
}

const defaultOptions: ToastOptions = {
    type: "info",
    duration: 5000,
    timer: false,
}

interface ToastContextType {
    addToast: (msg: string | { title: string, description: string, icon?: string }, options: ToastOptions) => string;
    updateToast: (id: string, msg: string | { title: string, description: string, icon?: string }, options?: ToastOptions) => void;
    removeToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextType>();
let toastAPI: ToastContextType | undefined;

export function ToastProvider(props: { children: JSX.Element }) {
    const [toasts, setToasts] = createSignal<expandedToastProps[]>([]);

    function addToast(message: string | { title: string, description: string, icon?: string }, options: ToastOptions) {
        const id = crypto.randomUUID();
        let duration = options.duration;
        let timer: NodeJS.Timeout | undefined
        if (options.timer == false) {
            timer = setTimeout(() => {
                removeToast(id)
            }, duration);
        }
        if (typeof message == "string") setToasts(prev => [...prev, { id, message: message as string, options, animation: false, updated: false, timer }]);
        else setToasts(prev => [...prev, { id, message: message.title, added: message, options, animation: false, updated: false, timer }])
        return id
    };

    function updateToast(id: string, msg: string | { title: string, description: string, icon?: string }, options?: ToastOptions) {
        setToasts((prevToast) => prevToast.map((tost) => {
            if (tost.id != id) return tost
            clearInterval(tost.timer)
            let timer: NodeJS.Timeout | undefined

            if (options?.timer == false) {
                timer = setTimeout(() => {
                    removeToast(id)
                }, options?.duration ? options.duration : defaultOptions.duration);
            }
            if (typeof msg == "string") return { ...tost, message: msg as string, options: { ...tost.options, ...options }, updated: true, timer }
            return { ...tost, message: msg.title, added: msg, options: { ...tost.options, ...options }, updated: true, timer }
        }))
    };

    function removeToast(id: string) {
        setToasts(prev => prev.map(t => t.id == id ? ({ ...t, animation: true, updated: false }) : t))
    };

    return (
        <ToastContext.Provider value={{ addToast, updateToast, removeToast }}>
            {(() => { toastAPI = { addToast, updateToast, removeToast }; return undefined; })()}
            {props.children}

            <Portal>
                <div class="toast-container">
                    <For each={toasts()}>
                        {toast => (
                            <div class={`toast ${!toast.updated && !toast.animation ? "show" : ""} ${toast.options?.type} ${toast.animation && !toast.updated ? "disable" : ""} ${!toast.options?.click == false || !toast.options?.onClick ? "" : "click"}`}
                                onclick={() => {
                                    if (toast.options?.onClick) toast.options.onClick()
                                    if (toast.options?.click) return
                                    removeToast(toast.id)
                                }}
                                onanimationend={(event) => {
                                    if (event.target.classList.contains("disable")) setToasts(prev => prev.filter(t => t.id !== toast.id))
                                }}
                            >
                                <Show when={toast.options?.type == "loading"}>
                                    <span class="material-symbols-outlined loading-animation">progress_activity</span>
                                </Show>
                                <Show when={toast.options?.type == "success"}>
                                    <span class="material-symbols-outlined">check_circle</span>
                                </Show>
                                <Show when={toast.options?.type == "error"}>
                                    <span class="material-symbols-outlined">cancel</span>
                                </Show>
                                <Show when={toast.options?.type == "info"}>
                                    <span class="material-symbols-outlined">info</span>
                                </Show>
                                <Switch>
                                    <Match when={!toast.options || toast.options.type != "notification"}>
                                        {toast.message}
                                    </Match>
                                    <Match when={toast["options"]?.type == "notification"}>
                                        <span class="toast-notification-top-bar">
                                            {toast.message}
                                        </span>
                                        <span class="toast-notification-content">
                                            {toast.added?.description}
                                            <Show when={toast.added?.icon}>
                                                <img src={toast.added?.icon} class="toast-notification-icon" />
                                            </Show>
                                        </span>
                                    </Match>
                                </Switch>
                            </div>
                        )}
                    </For>
                </div>
            </Portal>
        </ToastContext.Provider>
    );
}

export function toast(msg: string | { title: string, description: string, icon?: string }, options?: ToastOptions) {
    if (!toastAPI) return "";
    return toastAPI.addToast(msg, { ...defaultOptions, ...options })
}

export function updateToast(id: string, msg: string | { title: string, description: string, icon?: string }, options?: ToastOptions) {
    if (!toastAPI) return "";
    return toastAPI.updateToast(id, msg, options)
}

export function removeToast(id: string) {
    if (!toastAPI) return "";
    return toastAPI.removeToast(id)
}