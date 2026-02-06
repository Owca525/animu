import { Component } from "solid-js";
import "./css/checkBox.css";

interface CheckBoxProps {
  onChecked?: (check: boolean) => void;
  checked?: boolean;
  disable?: boolean
}

const CheckBox: Component<CheckBoxProps> = (props) => {
  return (
    <input
      tabIndex={-1}
      class="checkbox"
      type="checkbox"
      checked={props.checked}
      disabled={props.disable}
      onChange={(event) => props.onChecked?.(event.currentTarget.checked)}
    />
  );
};

export default CheckBox;
