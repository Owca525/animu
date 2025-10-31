import { Component, createSignal, Show } from "solid-js";
import "./css/drop.css";

interface DropProps {
  content: any;
  LeftHeader: string;
  RightHeader: string;
}

const Drop: Component<DropProps> = (props) => {
  const [isOpen, setIsOpen] = createSignal(false);

  return (
    <div class="drop-container">
      <div
        class={`drop-button ${isOpen() ? "active-drop" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div class="drop-header">{props.LeftHeader}</div>
        <div class="drop-header">
          {props.RightHeader}
          <div class="episodes-arrow material-symbols-outlined">
            {isOpen() ? "arrow_drop_up" : "arrow_drop_down"}
          </div>
        </div>
      </div>

      <div class={`drop-content ${isOpen() ? "drop-content-show" : ""}`}>
        <Show when={isOpen()}>{props.content}</Show>
      </div>
    </div>
  );
};

export default Drop;
