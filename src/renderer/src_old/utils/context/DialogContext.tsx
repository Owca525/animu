import React, { useState } from "react";
import Dialog from "@renderer/components/dialogs/dialog";
import { dialogProps } from "../interface";

let showDialog: (data: dialogProps) => void = () => {};
let closeDialog: () => void = () => {};
let dialogIsOpen: () => boolean = (): any => {};

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
        <Dialog header_text={data.header_text} text={data.text} buttons={data.buttons} type={data.type} content={data.content}/>
      )}
    </>
  );
};

export { DialogContext, showDialog, closeDialog, dialogIsOpen };