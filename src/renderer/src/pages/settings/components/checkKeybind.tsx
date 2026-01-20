import { createSignal, onCleanup, Component, For, Show, createEffect } from "solid-js";
import { convertKeybinds } from "@renderer/utils/functions";
import "./css/CheckKeybind.css";

interface CheckKeybindProps {
  content: string;
  keyBind?: (keys: string) => void;
}

const CheckKeybind: Component<CheckKeybindProps> = (props) => {
  const [pressedKeys, setPressedKeys] = createSignal<string[]>([]);
  const [keysUp, setKeysUp] = createSignal<string[]>([]);
  const [isActive, setActive] = createSignal(false);

  const handleKeyDown = (event: KeyboardEvent) => {
    event.preventDefault();
    const key = convertKeybinds(event.key);

    setPressedKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
    setKeysUp((prev) => (prev.includes(key) ? prev : [...prev, key]));
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    event.preventDefault();
    const key = convertKeybinds(event.key);
    setKeysUp((prev) => prev.filter((k) => k !== key));

    if (keysUp().length <= 0 || keysUp().length >= 3) removeEvents();
  };

  const handleBlur = () => {
    removeEvents();
    props.keyBind?.(props.content);
  };

  const removeEvents = () => {
    props.keyBind?.(pressedKeys().join("+"));
    setActive(false);
    setPressedKeys([]);
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
    window.removeEventListener("blur", handleBlur);
  };

  onCleanup(() => {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
    window.removeEventListener("blur", handleBlur);
  });

  createEffect(() => {
    if (isActive()) {
      window.addEventListener("keydown", handleKeyDown, { passive: true });
      window.addEventListener("keyup", handleKeyUp, { passive: true });
      window.addEventListener("blur", handleBlur);
    }
  })

  return (
    <div
      tabIndex={-1}
      class={isActive() ? "settings-keybind-check-active" : "settings-keybind-check"}
      onClick={() => setActive((prev) => !prev)}
    >
      <Show when={pressedKeys().length <= 0} fallback={
        <For each={pressedKeys()}>
          {(element, index) => (
            <>
              <div class="settings-input-content">{element}</div>
              <Show when={index() !== pressedKeys().length - 1}>+</Show>
            </>
          )}
        </For>
      }>
        <For each={props.content.split("+")}>
          {(element, index) => (
            <>
              <div class="settings-input-content">{element}</div>
              <Show when={index() !== props.content.split("+").length - 1}>+</Show>
            </>
          )}
        </For>
      </Show>
    </div>
  );
};

export default CheckKeybind;
