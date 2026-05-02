import { createSignal, JSX } from "solid-js";
import "./css/characterActorMenu.css";

interface characterActorMenuProps {
  type: "actor" | "character"
  id: string
}

// TODO: END THIS
export default function characterActorMenu(props: characterActorMenuProps) {
  const [isLoading, setIsLoading] = createSignal<boolean>(true)
  const [isError, setIsError] = createSignal<boolean>(true)

  return (
    <></>
  );
};
