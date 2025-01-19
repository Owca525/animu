import React, { useState } from "react";
import { Information } from "@renderer/components/elements/information";

let showIndormation: (data: { anime_id: string }) => void = () => {};
let hideInformation: () => void = () => {};
let isInformationShow: () => boolean = (): any => {};

const InformationContext: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isShow, setIsShow] = useState(false);
  const [data, setData] = useState<{ anime_id: string } | null>();

  showIndormation = (informationData: { anime_id: string }) => {
    setData(informationData);
    setIsShow(true);
    const container = document.querySelector(".container") as HTMLDivElement
    if (container) container.style.display = "none"
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
        <Information anime_id={data.anime_id} />
      )}
    </>
  );
};

export { InformationContext, showIndormation, hideInformation, isInformationShow };