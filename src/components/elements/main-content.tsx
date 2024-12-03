import React from "react";
import Card from "../ui/card";
import { ContainerProps } from "../../utils/interface"

const Container: React.FC<ContainerProps> = ({ title, data = [], className = ""}) => {
  return (
    <div className={className + " content"}>
      <div className="title">{title}</div>
      <div className="card-container">
        {data.length > 0 ? (
          data.map((card) => <Card title={card.title} img={card.img} />)
        ) : (
          <div className="no-data-message">Nothing Found...</div>
        )}
      </div>
    </div>
  );
};

export default Container;