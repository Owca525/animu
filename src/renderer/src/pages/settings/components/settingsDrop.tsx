import { createSignal } from "solid-js";
import "./css/settingsDrop.css";

interface SettingsDropProps {
  content: any;
  LeftHeader: string;
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
