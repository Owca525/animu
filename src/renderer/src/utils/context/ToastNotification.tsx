import { createContext, useContext, createSignal, JSX, For } from "solid-js";
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
    let toast = useContext(ToastContext)
    if (!toast) return
    return toast.addToast(msg, { ...defaultOptions, ...options })
}

export function updateToast(id: string, msg: string) {
    let toast = useContext(ToastContext)
    if (!toast) return
    return toast.updateToast(id, msg)
}

export function removeToast(id: string) {
    let toast = useContext(ToastContext)
    if (!toast) return
    return toast.removeToast(id)
}