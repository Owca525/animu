import { Component, JSX, createSignal, onCleanup, For } from "solid-js";
import "./css/ContextMenu.css";
import { ContextMenuProps } from "../types";

// Sygnały globalne do otwierania/zamykania menu
let openMenuSignal: (data: ContextMenuProps, event: MouseEvent) => void = () => {};
let closeMenuSignal: () => void = () => {};

const ContextMenu: Component<{ children: JSX.Element }> = (props) => {
  const [isOpen, setIsOpen] = createSignal(false);
  const [data, setData] = createSignal<ContextMenuProps | null>(null);
  const [event, setEvent] = createSignal<MouseEvent | null>(null);

  openMenuSignal = (menuData: ContextMenuProps, ev: MouseEvent) => {
    ev.stopPropagation();
    setData(menuData);
    setEvent(ev);
    setIsOpen(true);
  };

  closeMenuSignal = () => {
    setIsOpen(false);
    setData(null);
  };

  const handleClickOutside = (ev: MouseEvent) => {
    const target = ev.target as HTMLElement;
    if (
      target.classList.contains("contextmenu-container") ||
      target.classList.contains("contextmenu-option") ||
      target.classList.contains("contextmenu-option-line")
    )
      return;
    if (ev.button === 0) {
      setIsOpen(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  onCleanup(() => document.removeEventListener("mousedown", handleClickOutside));

  return (
    <>
      {props.children}
      {isOpen() && data() && data()!.length !== 0 && event() && (
        <div
          class="contextmenu-container"
          style={{
            "position": "absolute",
            "top": `${event()!.pageY}px`,
            "left": `${event()!.pageX}px`,
            "z-index": "9999"
          }}
        >
          <For each={data()!}>
            {(option) =>
              option.line ? (
                <div class="contextmenu-option-line"></div>
              ) : (
                <div
                  class={`contextmenu-option ${option.deletion ? "contextmenu-option-deletion" : ""}`}
                  onClick={() => {
                    closeMenuSignal();
                    option.onClick?.();
                  }}
                >
                  {option.option}
                </div>
              )
            }
          </For>
        </div>
      )}
    </>
  );
};

export { ContextMenu, openMenuSignal as OpenContextMenu, closeMenuSignal as CloseContextMenu };
