import { useEffect, useRef } from "react";
import { convertKeybinds } from "../functions";

const useKeyPress = (func: (keybinds: string) => void) => {
  const keysRef = useRef<string[]>([]);
  const funcRef = useRef(func);

  useEffect(() => {
    funcRef.current = func;
  }, [func]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = convertKeybinds(event.key);
      if (!keysRef.current.includes(key)) {
        keysRef.current.push(key);
        funcRef.current(keysRef.current.join("+"));
        return
      }
      funcRef.current(key);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = convertKeybinds(event.key);
      keysRef.current = keysRef.current.filter((k) => k !== key);
      funcRef.current(keysRef.current.join("+"));
    };

    window.addEventListener('keydown', handleKeyDown, { passive: true });
    window.addEventListener('keyup', handleKeyUp, { passive: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    }
  }, [])
};

export default useKeyPress;
