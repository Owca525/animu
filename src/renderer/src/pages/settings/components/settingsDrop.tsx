import { createSignal, Show } from "solid-js";
import "./css/settingsDrop.css";
import Button from "@renderer/components/buttons";

interface SettingsDropProps {
  content: any;
  LeftHeader: string;
  leftbutton?: { icon: string, onClick?: () => void | Promise<void> },
}

export default function settingsDrop(props: SettingsDropProps) {
  const [isOpen, setIsOpen] = createSignal(false);

  return (
    <div class="settings-drop-container">
      <div
        class={`settings-drop-button ${isOpen() ? "active-drop" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div class="settings-drop-header">{props.LeftHeader}</div>
        <div class="settings-drop-header">
          <Show when={props.leftbutton}>
            <Button icon={props.leftbutton?.icon} onClick={(event) => {
              event.stopPropagation()
              if (props.leftbutton?.onClick) props.leftbutton.onClick()
            }}/>
          </Show>
          <div class="material-symbols-outlined">
            {isOpen() ? "arrow_drop_up" : "arrow_drop_down"}
          </div>
        </div>
      </div>

      <div class={`settings-drop-content ${isOpen() ? "expand" : ""}`}>
        {props.content}
      </div>
    </div>
  );
};
