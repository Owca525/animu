import { createEffect, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import "./css/dropDown.css";

export interface DropdownOption {
  label: string;
  onClick?: (text: string) => void;
}

interface DropdownProps {
  options?: DropdownOption[];
  placeholder?: string;
  placeholderChange?: () => string | undefined;
  buttonText?: string;
  disableX?: boolean;
  onClickX?: (text: string) => void;
  dropClassName?: string;
}

export default function Dropdown(props: DropdownProps) {
  const dropdownID = crypto.randomUUID()

  const [isOpen, setIsOpen] = createSignal(false);
  const [text, setText] = createSignal(props.buttonText);

  function checkIDSystem(event: MouseEvent) {
    const target = event["target"] as HTMLElement
    if (!("parentElement" in target)) return

    if (target["parentElement"]!["id"] != dropdownID) setIsOpen(false)
  }

  onMount(() => {
    setText(props.buttonText)

    document.addEventListener('mousedown', checkIDSystem);
  })

  onCleanup(() => {
    document.removeEventListener('mousedown', checkIDSystem);
  })
  
  createEffect(() => {
    setText(props.buttonText)
  })

  const toggleDropdown = () => setIsOpen(prev => !prev);

  const handleOptionClick = (option: DropdownOption) => {
    setIsOpen(false);
    if (option.onClick) option.onClick(option.label);
    if (props.placeholderChange) {
      const placeholderText = props.placeholderChange();
      if (placeholderText) setText(placeholderText);
    } else setText(option.label);
  };

  const resetText = (event: MouseEvent) => {
    event.stopPropagation();
    if (props.onClickX) props.onClickX(text() || "");
    setText("");
  };

  const displayText = () => {
    if (props.placeholder && !text()) return props.placeholder;
    if (text() != "") return text();
    return props.buttonText;
  };

  return (
    <div tabIndex={-1} id={dropdownID} class={`dropdown-container ${props.dropClassName ?? ""}`}>
      <div tabIndex={-1} class="dropdown-button" onClick={toggleDropdown}>
        <div
          tabIndex={-1}
          class={`dropdown-button-text ${(text() === "" || (props.options?.length ?? 0) <= 1) ? "dropdown-button-shadow-text" : ""
            }`}
        >
          {displayText()}
        </div>
        <Show when={text() === "" && !props.disableX}>
          <div class="material-symbols-outlined dropdown-button-icon">
            {isOpen() ? "keyboard_arrow_left" : "keyboard_arrow_down"}
          </div>
        </Show>
        <Show when={text() !== "" && !props.disableX}>
          <div class="material-symbols-outlined dropdown-button-icon" onClick={resetText}>
            close
          </div>
        </Show>
      </div>

      <Show when={isOpen() && (props.options?.length ?? 0) > 1}>
        <ul class="dropdown-menu" id={dropdownID}>
          <For each={props.options}>
            {option => (
              <li
                class="dropdown-item"
                onClick={() => handleOptionClick(option)}
                title={option.label}
              >
                {option.label}
              </li>
            )}
          </For>
        </ul>
      </Show>
    </div>
  );
}
