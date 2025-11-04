import { createSignal } from "solid-js";
import "./css/input.css";

interface InputProps {
  type?: "text" | "password" | "number";
  InputClass?: string;
  placeholder?: string;
  onKeyDown?: (text: string) => void;
  defaultValue?: string;
}

export default function Input(props: InputProps) {
  const [cacheText, setCacheText] = createSignal("");
  const [debounceTimeout, setDebounceTimeout] = createSignal<number | null>(null);
  let inputRef: HTMLInputElement | undefined;

  const handleData = (event: KeyboardEvent & { currentTarget: HTMLInputElement }) => {
    if (!props.onKeyDown) return;

    const value = event.currentTarget.value;
    if (cacheText() === value) return;

    if (debounceTimeout()) clearTimeout(debounceTimeout()!);

    if (event.code === "Enter") {
      setCacheText(value);
      props.onKeyDown(value);
      return;
    }

    const newTimeout = setTimeout(() => {
      if (inputRef) {
        setCacheText(inputRef.value);
        props.onKeyDown!(inputRef.value);
      }
    }, 300);

    setDebounceTimeout(newTimeout as unknown as number);
  };

  return (
    <input
      tabIndex={-1}
      ref={(el) => (inputRef = el!)}
      type={props.type ?? "text"}
      class={"input " + (props.InputClass ?? "")}
      placeholder={props.placeholder}
      value={props.defaultValue ? props.defaultValue : ""}
      onKeyDown={handleData}
    />
  );
}
