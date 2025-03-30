import React, { useState, useRef } from 'react'
import '../../css/ui/card.css'

import { CardProps } from '../../utils/interface'
import { useNavigate } from 'react-router-dom'
import { showIndormation } from '@renderer/utils/context/InformationContext'

const Card: React.FC<CardProps> = ({ id, title, img, player = null, text = null, deletion }) => {
  const navigate = useNavigate()
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  const cardRef: any = useRef(undefined)

  const handleImageLoad = () => {
    setIsImageLoaded(true)
    setHasError(false)
  }

  const ContinueWatch = () => {
    if (player) {
      navigate('/player', {
        state: {
          id: id,
          title: title,
          episodes: player.episodes,
          episode: player.episode,
          time: player.time,
          img: img
        }
      })
      return
    }
    showIndormation({ anime_id: id })
  }

  return (
    <div className="card-container" title={title} ref={cardRef} onClick={ContinueWatch}>
      <div className="card-image-container">
        {!isImageLoaded && !hasError && (
          <div
            className="material-symbols-outlined card-image-placeholder"
          >
            <div className='material-symbols-outlined' style={{ animation: 'spin 1s linear infinite' }}>progress_activity</div>
          </div>
        )}
        {hasError && (
          <div className="material-symbols-outlined card-image-placeholder" title="img can't load">
            <div className='material-symbols-outlined'>error</div>
          </div>
        )}
        <img
          onLoad={handleImageLoad}
          onError={() => setHasError(true)}
          className={`card-image ${isImageLoaded && !hasError ? 'loaded' : 'hidden'}`}
          src={img}
        />
      </div>
      <div className="card-title">{title}</div>
      {text && <div className="card-continue-watch-text">{text}</div>}
      {deletion && <div className="card-delete-icon material-symbols-outlined" onClick={(event) => deletion(event, id)}>close</div>}
    </div>
  )
}

export default Card
