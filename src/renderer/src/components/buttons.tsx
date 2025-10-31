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
      title={props.titleButton ?? ""}
    >
      {props.icon && (
        <span class={"material-symbols-outlined " + (props.iconClassName ?? "")}>
          {props.icon}
        </span>
      )}
      {props.content}
    </button>
  );
}