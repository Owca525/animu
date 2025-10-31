import { Component } from "solid-js";
import "./css/settingsInput.css";

interface SettingsInputProps {
  type?: "number" | "text";
  iconChar?: string;
  onKeyDown?: (text: string) => void;
  startValue?: string;
}

const SettingsInput: Component<SettingsInputProps> = (props) => {
  const handleData = (event: InputEvent & { currentTarget: HTMLInputElement }) => {
    if (!props.onKeyDown) return;
    props.onKeyDown(event.currentTarget.value);
  };

  return (
    <div tabIndex={-1} class="settings-input-container">
      <input
        class={props.iconChar === "" ? "settings-input-field-hide-type" : "settings-input-field"}
        type={props.type ?? "text"}
        value={props.startValue}
        onInput={handleData}
      />
      {props.iconChar !== "" && (
        <div class="settings-input-type">{props.iconChar}</div>
      )}
    </div>
  );
};

export default SettingsInput;
