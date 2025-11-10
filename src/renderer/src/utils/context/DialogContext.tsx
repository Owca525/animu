import { createSignal, JSX } from "solid-js";
import { t } from "i18next";
import Button from "@renderer/components/buttons";
import type { dialogProps } from "../types";
import "./css/DialogContext.css";

let showDialog: (data: dialogProps) => void = () => {};
let closeDialog: () => void = () => {};
let dialogIsOpen: () => boolean = () => false;

export function DialogProvider(props: { children: JSX.Element }) {
  const [isOpen, setIsOpen] = createSignal(false);
  const [data, setData] = createSignal<dialogProps | null>(null);

  showDialog = (dialogData: dialogProps) => {
    setData(dialogData);
    setIsOpen(true);
  };

  closeDialog = () => {
    setIsOpen(false);
    setData(null);
  };

  dialogIsOpen = () => isOpen();

  const getClass = () => {
    if (data()?.type === "info") return "info";
    if (data()?.type === "error") return "error";
    return "";
  };

  return (
    <>
      {props.children}
      {isOpen() && data() && (
        <main class="dialog-main-background">
          <div
            class={`dialog-container ${getClass()}`}
          >
            <div class={`dialog-title ${getClass()}`}>
              <div class="material-symbols-outlined dialog-icon">
                {data()?.type === "error" && "error"}
                {data()?.type === "info" && "info"}
              </div>
              {data()?.title}
            </div>

            <div class={`dialog-description ${getClass()}`}>
              {data()?.description}
            </div>

            <div class={`dialog-buttons ${getClass()}`}>
              <Button
                content={t("dialog.yes")}
                ButtonClass={`dialog-button ${getClass()}`}
                onClick={() => {
                  data()?.buttons.firstbutton();
                  closeDialog();
                }}
              />
              <Button
                content={t("dialog.no")}
                ButtonClass={`dialog-button ${getClass()}`}
                onClick={() => {
                  data()?.buttons.secondbutton();
                  closeDialog();
                }}
              />
            </div>
          </div>
        </main>
      )}
    </>
  );
}

export { showDialog, closeDialog, dialogIsOpen };
