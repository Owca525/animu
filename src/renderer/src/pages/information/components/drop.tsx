import { Component, createSignal } from "solid-js";
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

      <div class={`drop-content ${isOpen() ? "expand" : ""}`}>
        {props.content}
      </div>
    </div>
  );
};

export default Drop;
