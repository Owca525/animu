import React, { useState, useRef, useEffect } from "react";
import { Information } from "../elements/information";

interface CardProps {
  title: string;
  img: string;
}

const Card: React.FC<CardProps> = ({ title, img }) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const[showInf, setShowInf] = useState<boolean>(false);

  const cardRef: any = useRef();

  const toggleShow = () => {
    setShowInf(!showInf);
  }

  const handleImageLoad = () => {
    setIsImageLoaded(true);
    setHasError(false);
  };

  const handleClick = (event: any) => {
    if(cardRef.current.contains(event.target)) {
      toggleShow();
    }
  }

  useEffect(() => {
    if(!showInf){
      document.addEventListener('click', handleClick);
    } else document.removeEventListener('click', handleClick)

    return () => {
      document.removeEventListener('click', handleClick);
    }
  }, [showInf])

  return (
    <div className="prevcard" ref={cardRef}>
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
      <Information title={title} showPopup={showInf} toggle={toggleShow}/>
    </div>
  );
};

export default Card;
