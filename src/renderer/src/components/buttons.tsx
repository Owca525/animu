import { Show } from "solid-js";
import "./css/buttons.css";

interface ButtonProps {
  icon?: string;
  iconClassName?: string;
  content?: string;
  ButtonClass?: string;
  onClick?: (event: MouseEvent) => void;
  titleButton?: string;
}

export default function Button(props: ButtonProps) {
  return (
    <button
      tabIndex={-1}
      class={"button " + (props.ButtonClass ?? "")}
      onClick={props.onClick}
      onKeyDown={(event) => event.code == "Space" || event.code == "Enter" ? event.preventDefault() : ""}
    >
      <Show when={props.titleButton}>
        <span class="button-tooltip">
          {props.titleButton}
        </span>
      </Show>
      <Show when={props.icon}>
        <span class={"material-symbols-outlined " + (props.iconClassName ?? "")}>
          {props.icon}
        </span>
      </Show>
      {props.content}
    </button>
  );
}