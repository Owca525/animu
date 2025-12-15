import { createContext, createSignal, JSX, For, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { v4 as uuidv4 } from 'uuid';
import "./css/ToastNotification.css"

type ToastProps = {
    id: string;
    message: string;
    options?: ToastOptions;
};

type expandedToastProps = ToastProps & { animation: boolean, updated: boolean, timer: NodeJS.Timeout | undefined }

interface ToastOptions {
    type?: "success" | "error" | "info" | "warning" | "loading",
    duration?: number,
    onClick?: () => void;
    removeTimer?: boolean
    removeClick?: boolean
}

const defaultOptions: ToastOptions = {
    type: "info",
    duration: 3000,
    removeTimer: false,
}

interface ToastContextType {
    addToast: (msg: string, options: ToastOptions) => string;
    updateToast: (id: string, msg: string, options?: ToastOptions) => void;
    removeToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextType>();
let toastAPI: ToastContextType | undefined;

export function ToastProvider(props: { children: JSX.Element }) {
    const [toasts, setToasts] = createSignal<expandedToastProps[]>([]);

    function addToast(message: string, options: ToastOptions) {
        const id = uuidv4();
        let duration = options.duration;
        let timer: NodeJS.Timeout | undefined
        if (!options.removeTimer) {
            timer = setTimeout(() => {
                removeToast(id)
            }, duration);
        }
        setToasts(prev => [...prev, { id, message, options, animation: false, updated: false, timer }]);
        return id
    };

    function updateToast(id: string, msg: string, options?: ToastOptions) {
        setToasts((prevToast) => prevToast.map((tost) => {
            if (tost.id != id) return tost
            clearInterval(tost.timer)
            let timer: NodeJS.Timeout | undefined

            if (!options?.removeTimer) {
                timer = setTimeout(() => {
                    removeToast(id)
                }, options?.duration ? options.duration : defaultOptions.duration);
            }
            return { ...tost, message: msg, options: { ...tost.options, ...options }, updated: true, timer }
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
                            <div class={`toast ${!toast.updated && !toast.animation ? "show" : ""} ${toast.options?.type} ${toast.animation && !toast.updated ? "disable" : ""} ${!toast.options?.removeClick || !toast.options?.onClick ? "" : "click"}`}
                                onclick={() => {
                                    if (toast.options?.onClick) toast.options.onClick()
                                    if (!toast.options?.removeClick) removeToast(toast.id)
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
                                {toast.message}
                            </div>
                        )}
                    </For>
                </div>
            </Portal>
        </ToastContext.Provider>
    );
}

export function toast(msg: string, options?: ToastOptions) {
    if (!toastAPI) return "";
    return toastAPI.addToast(msg, { ...defaultOptions, ...options })
}

export function updateToast(id: string, msg: string, options?: ToastOptions) {
    if (!toastAPI) return "";
    return toastAPI.updateToast(id, msg, options)
}

export function removeToast(id: string) {
    if (!toastAPI) return "";
    return toastAPI.removeToast(id)
}