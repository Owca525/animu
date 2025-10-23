import React, { useState } from "react";
import { dialogProps } from "../GlobalInterface";
import Button from "@renderer/components/buttons";
import "./css/DialogContext.css"
import { t } from "i18next";
import { motion } from "framer-motion";

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

  function getClass() {
    if (data?.type == "info") return "info"
    if (data?.type == "error") return "error"
    return ""
  }

  return (
    <>
      {children}
      {isOpen && data && (
        <main className="dialog-main-background">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.1 }} className={`dialog-container ${getClass()}`}>
            <div className={`dialog-title ${getClass()}`}>
              <div className="material-symbols-outlined dialog-icon">
                {data.type == "error" && "error"}
                {data.type == "info" && "info"}
              </div>
              {data.title}
            </div>
            <div className={`dialog-description ${getClass()}`}>{data.description}</div>
            <div className={`dialog-buttons ${getClass()}`}>
                <Button content={t("dialog.yes")} ButtonClass={`dialog-button ${getClass()}`} onClick={() => { data.buttons.firstbutton(); closeDialog() }} />
                <Button content={t("dialog.no")} ButtonClass={`dialog-button ${getClass()}`} onClick={() => { data.buttons.secondbutton(); closeDialog() }} />
            </div>
          </motion.div>
        </main>
      )}
    </>
  );
};

export { DialogContext, showDialog, closeDialog, dialogIsOpen };