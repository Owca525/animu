import { onMount, onCleanup } from "solid-js";
import { convertKeybinds } from "../functions";
import { isAnimuFocus } from "../stores/global";

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

  function clearEvents() {
    keysRef = []
    document.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener("keyup", handleKeyUp);
  }

  function runEvents() {
    keysRef = []
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
  }

  onMount(() => {
    window.addEventListener("focus", runEvents);
    window.addEventListener("blur", clearEvents);

    if (isAnimuFocus()) runEvents()
  });

  onCleanup(() => {
    clearEvents()
  
    window.removeEventListener("focus", runEvents);
    window.removeEventListener("blur", clearEvents);
  });

  return { setFunc };
}

export function SheepShortcut(keys: string[], wrapper: (keybinds: string) => void ) {
  const keybinds = convertKeybinds(keys.join("+"))
  return useKeyPress((keys) => {
    if (keybinds.toLowerCase() == keys.toLowerCase()) wrapper(keys)
  })
}