import React from "react";
import Card from "../components/ui/card";

interface ContainerProps {
  title: string;
  data?: { title: string; img: string }[];
}

const Container: React.FC<ContainerProps> = ({ title, data = [] }) => {
  return (
    <div className="content">
      <div className="title">{title}</div>
      <div className="card-container">
        {data.length > 0 ? (
          data.map((card) => <Card title={card.title} img={card.img} />)
        ) : (
          <div className="no-data-message">Brak dostępnych elementów.</div>
        )}
      </div>
    </div>
  );
};

export default Container;
