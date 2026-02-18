import "./css/checkBox.css";

interface CheckBoxProps {
  onChecked?: (check: boolean) => void;
  checked?: boolean;
  disable?: boolean
}

export default function CheckBox(props: CheckBoxProps) {
  return (
    <input
      tabIndex={-1}
      class="checkbox"
      type="checkbox"
      checked={props.checked}
      disabled={props.disable}
      onclick={(event) => {
        event.stopPropagation()
        props.onChecked?.(event.currentTarget.checked)
      }}
    />
  );
};
