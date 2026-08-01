import { Component, JSX, createSignal, onCleanup, For } from "solid-js";
import "./css/ContextMenu.css";
import { ContextMenuProps } from "../types";
import { useI18n } from "../i18n";
import { CreateContextMenuOptions, SaveToClipboard } from "../functions";

// Sygnały globalne do otwierania/zamykania menu
let openMenuSignal: (event: MouseEvent, data?: { start?: ContextMenuProps, center?: ContextMenuProps, end?: ContextMenuProps }) => void = () => { };
let closeMenuSignal: () => void = () => { };

function MergeContent(data: ContextMenuProps, content?: { start?: ContextMenuProps, center?: ContextMenuProps, end?: ContextMenuProps }): { start: ContextMenuProps, center?: ContextMenuProps, end?: ContextMenuProps } {
  if (!content) return { start: data }

  return {
    ...content,
    start: [
      ...content["start"] ?? [],
      ...data,
    ]
  }
}

async function CutContent(target: EventTarget | null) {
  if (target instanceof HTMLInputElement == false && target instanceof HTMLTextAreaElement == false) return

  const { selectionStart, selectionEnd, value } = target;

  if (selectionStart == null || selectionEnd == null) return;

  const selected = value.slice(selectionStart, selectionEnd);

  SaveToClipboard("text", selected)

  target.setRangeText("", selectionStart, selectionEnd, "start");
  target.dispatchEvent(new Event("input", { bubbles: true }));
}

async function PasteContent(target: EventTarget | null) {
  if (target instanceof HTMLInputElement == false && target instanceof HTMLTextAreaElement == false) return

  try {
    target.value = await navigator.clipboard.readText()
  } catch (error) {
    console.error("Failed Paste Content", error)
  }
}

const ContextMenu: Component<{ children: JSX.Element }> = (props) => {

  let contextMenuRef!: HTMLDivElement;

  const { t, pathExist } = useI18n()
  const [isOpen, setIsOpen] = createSignal(false);
  const [data, setData] = createSignal<ContextMenuProps>([]);
  const [position, setPosition] = createSignal<{ x: number, y: number }>({ x: 0, y: 0 });

  async function DetectCutAndCopy(event: MouseEvent): Promise<ContextMenuProps> {

    let canCut = false
    let canPaste = false

    if (event["target"] instanceof HTMLInputElement || event["target"] instanceof HTMLTextAreaElement) {
      canCut = event["target"].selectionStart != 0 && event["target"].selectionEnd != 0

      try {
        canPaste = await navigator.clipboard.readText() != ""
      } catch (e) { }
    }

    let content = [{
      option: "Copy",
      onClick: () => SaveToClipboard("text", `${window.getSelection()}`),
      disable: `${window.getSelection()}` == ""
    }, {
      option: "Cut",
      onClick: () => CutContent(event["target"]),
      disable: !canCut
    }]

    if (canPaste) {
      content.push({
        option: "Paste",
        onClick: () => PasteContent(event["target"]),
        disable: !canPaste
      })
    }

    return content
  }

  openMenuSignal = async (ev: MouseEvent, menuData?: { start?: ContextMenuProps, center?: ContextMenuProps, end?: ContextMenuProps }) => {
    ev.stopPropagation();

    let newmenuData = CreateContextMenuOptions(MergeContent(await DetectCutAndCopy(ev), menuData))

    setData(newmenuData.filter((v) => v != undefined));
    setIsOpen(true);
    CalculateContextMenuBoundary(ev);
  };

  function CalculateContextMenuBoundary(ev: MouseEvent) {
    // TODO: FIX BUG SECOND CLICK FIX POSITION OUTSIDE THE WINDOW

    const rect = contextMenuRef.getBoundingClientRect();

    let x = ev.clientX;
    let y = ev.clientY;

    if (rect.right > window.innerWidth) {
      x = window.innerWidth - rect.width - 8;
    }

    if (rect.bottom > window.innerHeight) {
      y = window.innerHeight - rect.height - 8;
    }

    if (x < 8) x = 8;
    if (y < 8) y = 8;

    setPosition({ x, y })
  }

  closeMenuSignal = () => {
    setIsOpen(false);
    setData([]);
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
      <div
        ref={contextMenuRef}
        class="contextmenu-container"
        style={{
          "position": "absolute",
          "top": `${position().y}px`,
          "left": `${position().x}px`,
          "z-index": "9999",
          "display": isOpen() ? "" : "none"
        }}
      >
        <For each={data()!}>
          {(option) =>
            option.line ? (
              <div class="contextmenu-option-line"></div>
            ) : (
              <div
                class={`contextmenu-option ${option["disable"] ? "disable" : ""} ${option.deletion ? "contextmenu-option-deletion" : ""}`}
                onClick={() => {
                  if (option["disable"]) return
                  closeMenuSignal();
                  option.onClick?.();
                }}
              >
                {pathExist(option.option) ? t(option.option) : option.option}
              </div>
            )
          }
        </For>
      </div>
    </>
  );
};

export { ContextMenu, openMenuSignal as OpenContextMenu, closeMenuSignal as CloseContextMenu };
