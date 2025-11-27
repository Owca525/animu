import { createSignal, For, JSX, Show } from "solid-js";
import Button from "@renderer/components/buttons";
import type { dialogProps } from "../types";
import "./css/DialogContext.css";

let showDialog: (data: dialogProps) => void = () => { };
let closeDialog: () => void = () => { };
let dialogIsOpen: () => boolean = () => false;

export function DialogProvider(props: { children: JSX.Element }) {
  const [isOpen, setIsOpen] = createSignal(false);
  const [data, setData] = createSignal<dialogProps | undefined>(undefined);
  let dialogRef: HTMLDivElement | undefined

  showDialog = (dialogData: dialogProps) => {
    setData(dialogData);
    setIsOpen(true);
  };

  closeDialog = () => {
    setIsOpen(false);
    setData(undefined);
  };

  dialogIsOpen = () => isOpen();

  return (
    <>
      {props.children}
      <Show when={data()}>
        <div class="dialog-main-background">
          <div
            class={`dialog-container ${data()?.type}`}
            ref={dialogRef}
          >
            <div class={`dialog-title ${data()?.type}`}>
              <div class="material-symbols-outlined dialog-icon">
                {data()?.type === "error" && "error"}
                {data()?.type === "info" && "info"}
              </div>
              {data()?.title}
            </div>

            <div class={`dialog-description ${data()?.type}`}>
              {data()?.description}
            </div>

            <div class={`dialog-buttons ${data()?.type}`}>
              <For each={data()?.buttons}>
                {(button) => (
                  <Button
                    content={button.title}
                    ButtonClass={`dialog-button ${data()?.type}`}
                    onClick={() => {
                      button.onClick();
                      closeDialog();
                    }}
                  />
                )}
              </For>
            </div>
          </div>
        </div>
      </Show>
    </>
  );
}

export { showDialog, closeDialog, dialogIsOpen };
