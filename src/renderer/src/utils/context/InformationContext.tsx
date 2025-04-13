import React, { useState } from "react";
import { Information } from "@renderer/components/elements/information";
import { InformationData } from "../interface";

let showIndormation: (data: { data: InformationData }) => void = () => {};
let hideInformation: () => void = () => {};
let isInformationShow: () => boolean = (): any => {};

const InformationContext: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isShow, setIsShow] = useState(false);
  const [data, setData] = useState<{ data: InformationData } | null>();

  showIndormation = (informationData: { data: InformationData }) => {
    setData(informationData);
    setIsShow(true);
  };

  hideInformation = () => {
    setIsShow(false);
    setData(null);
    const container = document.querySelector(".container") as HTMLDivElement
    if (container) container.style.display = ""
  };

  isInformationShow = (): boolean => isShow

  return (
    <>
      {children}
      {isShow && data && (
        <Information data={data.data} />
      )}
    </>
  );
};

export { InformationContext, showIndormation, hideInformation, isInformationShow };