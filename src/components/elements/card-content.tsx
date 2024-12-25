import React from "react";
import Card from "../ui/card";
import { ContainerProps } from "../../utils/interface"
import "../../css/elements/card-content.css";
import { useTranslation } from "react-i18next";

const Container: React.FC<ContainerProps> = ({ title, data = [], className = ""}) => {
  const {t} = useTranslation();

  return (
    <div className={className + " content"}>
      <div className="title">{title}</div>
      <div className={"card-container" + (data.length > 0 ? "" : " message-content")}>
        {data.length > 0 ? (
          data.map((card) => <Card id={card.id} title={card.title} img={card.img} player={card.player} text={card.text} />)
        ) : (
          <div className="no-data-message">{t("errors.emptyMessage")}</div>
        )}
      </div>
    </div>
  );
};

export default Container;
