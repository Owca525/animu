import { createContext, createSignal, JSX, For, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { v4 as uuidv4 } from 'uuid';
import "./css/ToastNotification.css"

type ToastProps = {
    id: string;
    message: string;
    options?: ToastOptions;
};

type expandedToastProps = ToastProps & { animation: boolean }

interface ToastOptions {
    type?: "success" | "error" | "info" | "warning" | "loading",
    duration?: number,
    onClick?: () => void;
    removeTimer?: boolean
}

const defaultOptions: ToastOptions = {
    type: "info",
    duration: 3000,
    removeTimer: false,
}

interface ToastContextType {
    addToast: (msg: string, options: ToastOptions) => string;
    updateToast: (id: string, msg: string) => void;
    removeToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextType>();
let toastAPI: ToastContextType | undefined;

export function ToastProvider(props: { children: JSX.Element }) {
    const [toasts, setToasts] = createSignal<expandedToastProps[]>([]);

    function addToast(message: string, options: ToastOptions) {
        const id = uuidv4();
        let duration = options.duration;
        setToasts(prev => [...prev, { id, message, options, animation: false }]);

        if (!options.removeTimer) {
            setTimeout(() => {
                removeToast(id)
            }, duration);
        }

        return id
    };

    function updateToast(id: string, msg: string) {
        setToasts((prevToast) => prevToast.map((tost) => tost.id == id ? { ...tost, message: msg } : tost))
    };

    function removeToast(id: string) {
        setToasts(prev => prev.map(t => t.id == id ? ({ ...t, animation: true }) : t))
    };

    return (
        <ToastContext.Provider value={{ addToast, updateToast, removeToast }}>
            {(() => { toastAPI = { addToast, updateToast, removeToast }; return null; })()}
            {props.children}

            <Portal>
                <div class="toast-container">
                    <For each={toasts()}>
                        {toast => (
                            <div class={`toast ${toast.options?.type} ${toast.animation ? "disable" : ""}`}
                                onanimationend={(event) => {
                                    if (event.target.classList.contains("disable")) setToasts(prev => prev.filter(t => t.id !== toast.id))
                                }}
                            >
                                <Show when={toast.options?.type == "loading"}>
                                    <span class="material-symbols-outlined loading-animation">progress_activity</span>
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

export function updateToast(id: string, msg: string) {
    if (!toastAPI) return "";
    return toastAPI.updateToast(id, msg)
}

export function removeToast(id: string) {
    if (!toastAPI) return "";
    return toastAPI.removeToast(id)
}