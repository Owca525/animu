import { onMount, onCleanup } from "solid-js";
import { convertKeybinds } from "../functions";

export function useKeyPress(func: (keybinds: string) => void) {
  let keysRef: string[] = [];
  let funcRef = func;

  const setFunc = (newFunc: typeof func) => {
    funcRef = newFunc;
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const key = convertKeybinds(event.key);
    if (!keysRef.includes(key)) {
      keysRef.push(key);
      funcRef(keysRef.join("+"));
      return;
    }
    funcRef(key);
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    const key = convertKeybinds(event.key);
    keysRef = keysRef.filter((k) => k !== key);
    funcRef(keysRef.join("+"));
  };

  onMount(() => {
    /* IFDEF DEBUG|PROD */
    const callback = window.BrowserWindow.onWindowFocus((focus) => {
      if (focus) {
        window.addEventListener("keydown", handleKeyDown, { passive: true });
        window.addEventListener("keyup", handleKeyUp, { passive: true });
      } else {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
      }
    })
    onCleanup(() => {
      callback()
    })
    /* ENDIF */

    window.addEventListener("keydown", handleKeyDown, { passive: true });
    window.addEventListener("keyup", handleKeyUp, { passive: true });
  });

  onCleanup(() => {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
  });

  return { setFunc };
}
