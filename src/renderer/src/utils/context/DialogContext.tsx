import React, { useState } from "react";
import { dialogProps } from "../GlobalInterface";
import Button from "@renderer/components/buttons";
import "./css/DialogContext.css"
import { t } from "i18next";

let showDialog: (data: dialogProps) => void = () => { };
let closeDialog: () => void = () => { };
let dialogIsOpen: () => boolean = (): any => { };

const DialogContext: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<dialogProps | null>();

  showDialog = (dialogData: dialogProps) => {
    setData(dialogData);
    setIsOpen(true);
  };

  closeDialog = () => {
    setIsOpen(false);
    setData(null);
  };

  dialogIsOpen = (): boolean => isOpen

  return (
    <>
      {children}
      {isOpen && data && (
        <main className="dialog-main-background">
          <div className="dialog-container">
            <div className="dialog-title">
              {data.title}
              {data.type != "none" && data.type != "refresh" && (
                <span className="dialog-icon material-symbols-outlined">{data.type}</span>
              )}
            </div>
            <div className="dialog-description">{data.description}</div>
            <div className="dialog-buttons">
              {data.type == "refresh" && <>
                <Button content={t("dialog.exit")} onClick={() => { data.buttons.secondbutton(); closeDialog() }} />
                <Button content={t("dialog.retry")} onClick={() => { data.buttons.firstbutton(); closeDialog() }} />
              </>}
              {data.type != "refresh" && <>
                <Button content={t("dialog.yes")} onClick={() => { data.buttons.firstbutton(); closeDialog() }} />
                <Button content={t("dialog.no")} onClick={() => { data.buttons.secondbutton(); closeDialog() }} />
              </>}
            </div>
          </div>
        </main>
      )}
    </>
  );
};

export { DialogContext, showDialog, closeDialog, dialogIsOpen };