import { useState } from "react";
import { convertKeybinds } from "../functions";

const useKeyPress = (func: (keybinds: string) => void) => {
  const [keysUp, setKeysUp] = useState<string[]>([]);
  const [isActive, setActive] = useState<boolean>(false)

  const handleKeyDown = (event: KeyboardEvent) => {
    setKeysUp((previus) => {
      if (!previus.includes(convertKeybinds(event.key))) {
        previus.push(convertKeybinds(event.key))
        return previus
      }
      return previus
    })
    func(keysUp.join('+'))
  };
  const handleKeyUp = (event: KeyboardEvent) => {
    setKeysUp((previus) => {
      const index = previus.findIndex((item) => item === event.key);
      previus.splice(index, 1)
      return previus
    })
  };

  if (!isActive) {
      window.addEventListener('keydown', handleKeyDown, { passive: true });
      window.addEventListener('keyup', handleKeyUp, { passive: true });
      setActive(() => true)
  }
};

export default useKeyPress;