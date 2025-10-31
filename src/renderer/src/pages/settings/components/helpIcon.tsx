import { Component, createSignal, Show } from "solid-js";
import "./css/helpicon.css";

interface HelpIconProps {
  description: string;
}

const HelpIcon: Component<HelpIconProps> = (props) => {
  const [isHovered, setIsHovered] = createSignal(false);

  return (
    <div
      tabIndex={-1}
      class="help-icon-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div class="material-symbols-outlined help-icon">help</div>

      <Show when={isHovered()}>
        <div class="help-icon-description">{props.description}</div>
      </Show>
    </div>
  );
};

export default HelpIcon;
