import React, { useState } from "react";

interface CardProps {
  title: string;
  img: string;
}

const Card: React.FC<CardProps> = ({ title, img }) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleImageLoad = () => {
    setIsImageLoaded(true);
    setHasError(false);
  };

  return (
    <div className="prevcard">
      <div className="card" title={title}>
        <div className="card-img">
          {!isImageLoaded && !hasError && (
            <div className="material-symbols-outlined placeholder">
              progress_activity
            </div>
          )}
          <img
            onLoad={handleImageLoad}
            className={`card-image ${isImageLoaded ? "loaded" : "hidden"}`}
            src={img}
          />
        </div>
        <div className="card-title">{title}</div>
      </div>
    </div>
  );
};

export default Card;
