import { Component, For } from "solid-js";
import "./css/buttonGroup.css";

interface ButtonGroupProps {
  selectedValue: string;
  listValues: { value: string; onClick: () => void }[];
}

const ButtonGroup: Component<ButtonGroupProps> = (props) => {
  return (
    <div class="button-group-container">
      <For each={props.listValues}>
        {(element) => (
          <div
            class={`button-group-button ${
              element.value === props.selectedValue ? "active" : ""
            }`}
            onClick={element.onClick}
          >
            {element.value}
          </div>
        )}
      </For>
    </div>
  );
};

export default ButtonGroup;
