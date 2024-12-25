import React, { useState, useRef, useEffect } from "react";
import { Information } from "../elements/information";
import "../../css/ui/card.css";

import { CardProps } from "../../utils/interface"
import { useNavigate } from "react-router-dom";

const Card: React.FC<CardProps> = ({ id, title, img, player = null, text = null }) => {
  const navigate = useNavigate();
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showInf, setShowInf] = useState<boolean>(false);

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
    if(!showInf && player == null){
      document.addEventListener('click', handleClick);
    } else document.removeEventListener('click', handleClick)

    return () => {
      document.removeEventListener('click', handleClick);
    }
  }, [showInf])

  const shortText = (text: string) => {
    if (player && text.length > 40) {
      return text.slice(0, 40) + "...";
    }
    if (text.length > 58) {
      return text.slice(0, 58) + "...";
    }
    return text;
  }

  const ContinueWatch = () => {
    if (player) {
      navigate("/player", {state: { id: id, title: title, episodes: player.episodes, ep: player.episode, time: player.time, img: img }})
    }
  }

  return (
      <div className="card" title={title} ref={cardRef} onClick={ContinueWatch}>
        <div title="" style={{ cursor: "default" }}>
          <Information id_anime={id} showPopup={showInf} toggle={toggleShow}/>
        </div>
        <div className="card-img">
          {!isImageLoaded && !hasError && (
            <div className="material-symbols-outlined placeholder" style={{ animation: "spin 1s linear infinite" }}>
              progress_activity
            </div>
          )}
          {hasError && (
            <div className="material-symbols-outlined placeholder" title="img can't load">
              error
            </div>
          )}
          <img
            onLoad={handleImageLoad}
            onError={() => setHasError(true)}
            className={`card-image ${isImageLoaded && !hasError ? "loaded" : "hidden"}`}
            src={img}
          />
        </div>
        <div className="card-title">{shortText(title)}</div>
        {text ? <div className="card-continue-info">{text}</div> : ""}
      </div>
  );
};

export default Card;
