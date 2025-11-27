import { createContext, createSignal, JSX, For } from "solid-js";
import { Portal } from "solid-js/web";
import { v4 as uuidv4 } from 'uuid';
import "./css/ToastNotification.css"

interface ToastProps {
    id: string;
    message: string;
    options?: ToastOptions;
};

interface ToastOptions {
    type?: "success" | "error" | "info" | "warning",
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
    const [toasts, setToasts] = createSignal<ToastProps[]>([]);

    function addToast(message: string, options: ToastOptions) {
        const id = uuidv4();
        let duration = options.duration;
        setToasts(prev => [...prev, { id, message, options }]);

        if (!options.removeTimer) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        }

        return id
    };

    function updateToast(id: string, msg: string) {
        setToasts((prevToast) => prevToast.map((tost) => tost.id == id ? { ...tost, message: msg } : tost))
    };

    function removeToast(id: string) {
        setToasts(prev => prev.filter(t => t.id !== id))
    };

    return (
        <ToastContext.Provider value={{ addToast, updateToast, removeToast }}>
            {(() => { toastAPI = { addToast, updateToast, removeToast }; return null; })()}
            {props.children}

            <Portal>
                <div class="toast-container">
                    <For each={toasts()}>
                        {toast => (
                            <div class={`toast ${toast.options?.type}`}>
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
    console.log(toastAPI)
    if (!toastAPI) return;
    return toastAPI.addToast(msg, { ...defaultOptions, ...options })
}

export function updateToast(id: string, msg: string) {
    if (!toastAPI) return;
    return toastAPI.updateToast(id, msg)
}

export function removeToast(id: string) {
    if (!toastAPI) return;
    return toastAPI.removeToast(id)
}