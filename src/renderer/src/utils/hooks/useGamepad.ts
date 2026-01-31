import { createSignal, onMount, onCleanup } from "solid-js";

export function useGamepad(index = 0, wrapper: (num: number, pressed: boolean) => void) {
    const [connected, setConnected] = createSignal(false);

    let rafId;

    const update = () => {
        const pads = navigator.getGamepads?.();
        const pad = pads?.[index];

        if (pad) {
            var buttons = pad.buttons;
            for (var i in buttons) {
                if (buttons[i].pressed == true) { 
                    wrapper(buttons[i].value, buttons[i].pressed)
                    console.log("buttons[%s] pressed", i); 
                };
            };
            setConnected(true);
        } else {
            setConnected(false);
        }

        rafId = requestAnimationFrame(update);
    };

    const onConnect = () => update();
    const onDisconnect = () => {
        setConnected(false);
    };

    onMount(() => {
        window.addEventListener("gamepadconnected", onConnect);
        window.addEventListener("gamepaddisconnected", onDisconnect);
        update();
    });

    onCleanup(() => {
        cancelAnimationFrame(rafId);
        window.removeEventListener("gamepadconnected", onConnect);
        window.removeEventListener("gamepaddisconnected", onDisconnect);
    });

    return {
        connected,
    };
}
