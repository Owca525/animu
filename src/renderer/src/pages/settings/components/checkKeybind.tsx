import { convertKeybinds } from "@renderer/utils/functions";
import { useEffect, useState } from "react";

interface CheckKeybindProps {
    content: string
    keyBind?: (keys: string) => void
}

const CheckKeybind: React.FC<CheckKeybindProps> = ({ content, keyBind }) => {
  const [pressedKeys, setPressedKeys] = useState<string[]>([]);
  const [keysUp, setKeysUp] = useState<string[]>([]);
  const [isActive, setActive] = useState<boolean>(false)

  const handleKeyDown = (event: KeyboardEvent) => {
    console.log(event.key)
    setPressedKeys((previus) => {
      if (!previus.includes(convertKeybinds(event.key))) {
        previus.push(convertKeybinds(event.key))
        return previus
      }
      return previus
    })
    setKeysUp((previus) => {
      if (!previus.includes(convertKeybinds(event.key))) {
        previus.push(convertKeybinds(event.key))
        return previus
      }
      return previus
    })
    console.log(pressedKeys)
  };
  const handleKeyUp = (event: KeyboardEvent) => {
    setKeysUp((previus) => {
      const index = previus.findIndex((item) => item === event.key);
      previus.splice(index, 1)
      return previus
    })
    if (keysUp.length >= 0) removeEvents()
  };


  const handleBlur = () => {
    removeEvents()
    if (keyBind) keyBind(content)
  };

  useEffect(() => {
    if (isActive) {
      window.addEventListener('keydown', handleKeyDown, { passive: true });
      window.addEventListener('keyup', handleKeyUp, { passive: true });
      window.addEventListener('blur', handleBlur);
    }
  }, [isActive])

  function removeEvents() {
    if (keyBind) keyBind(pressedKeys.join('+'))
    setActive(() => false)
    setPressedKeys([]);
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    window.removeEventListener('blur', handleBlur);
  }

  return (
    <button onClick={() => setActive((prev) => !prev)} className={isActive ? "settings-keybind-check-active" : "settings-keybind-check"}>{pressedKeys.length > 0 ? pressedKeys.join('+') : content}</button>
  )
}

export default CheckKeybind
