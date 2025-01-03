import { useEffect, useRef, useState } from 'react'
import { InformationProps, InformationData } from '../../utils/interface'
import { get_information } from '../../utils/backend'
import '../../css/elements/information.css'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export const Information: React.FC<InformationProps> = ({ id_anime, showPopup, toggle }) => {
  const modalRef: any = useRef()

  const { t } = useTranslation()

  const [data, setData] = useState<InformationData>({
    id: '',
    title: '',
    description: '',
    img: '',
    episodes: []
  })
  const [loading, setLoading] = useState(true)
  const [imghasError, setimgHasError] = useState(false)
  const [isImageLoaded, setIsImageLoaded] = useState(false)

  const navigate = useNavigate()

  const handleImageLoad = () => {
    setIsImageLoaded(true)
    setimgHasError(false)
  }

  const fetchData = async () => {
    const anime_data = await get_information(id_anime)
    console.log(anime_data)
    setData(anime_data)
    setLoading(false)
  }

  const handleClickOutside = (event: any) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      toggle()
    }
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        toggle()
      }
    }

    if (showPopup) {
      document.addEventListener('keydown', handleKeyDown)
    } else document.removeEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showPopup])

  useEffect(() => {
    if (showPopup) {
      document.addEventListener('click', handleClickOutside)
      fetchData()
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [showPopup])

  // Loading animation
  if (loading) {
    return (
      <div className="modal-backdrop" style={{ visibility: showPopup ? 'visible' : 'hidden' }}>
        <div className="box" ref={modalRef}>
          <div
            className="box-img"
            style={{
              width: '200px',
              height: '290px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <div className="loading material-symbols-outlined">progress_activity</div>
          </div>
          <div className="box-info">
            <div
              className="box-text"
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
              <div className="description loading material-symbols-outlined">progress_activity</div>
            </div>
            <div className="box-episode" style={{overflow: "hidden"}}>
              <div className="text-episode">{t('information.episodes')}</div>
              <div
                className="box-episodes material-symbols-outlined"
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  animation: 'spin 1s linear infinite',
                  overflow: "hidden"
                }}
              >
                progress_activity
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-backdrop" style={{ visibility: showPopup ? 'visible' : 'hidden' }}>
      <div className="box" ref={modalRef}>
        <div className="box-img">
          {!isImageLoaded && !imghasError && (
            <div className="material-symbols-outlined placeholder loading">progress_activity</div>
          )}
          {imghasError && (
            <div className="material-symbols-outlined placeholder" title="img can't load">
              error
            </div>
          )}
          <img
            src={data.img}
            onLoad={handleImageLoad}
            onError={() => setimgHasError(true)}
            className={`${isImageLoaded && !imghasError ? 'loaded' : 'hidden'}`}
          />
        </div>
        <div className="box-info">
          <div className="box-text">
            <div className="header-text">{data.title}</div>
            <div
              className="description"
              dangerouslySetInnerHTML={{ __html: data.description }}
            ></div>
          </div>
          <div className="box-episode">
            <div className="text-episode">{t('information.episodes')}</div>
            <div className="box-episodes">
              {data.episodes.length > 0 ? (
                data.episodes.map((ep) => (
                  <div
                    className="episode"
                    onClick={() =>
                      navigate('/player', {
                        state: {
                          id: data.id,
                          title: data.title,
                          episodes: data.episodes,
                          ep: ep,
                          time: 0,
                          img: data.img
                        }
                      })
                    }
                  >
                    {ep}
                  </div>
                ))
              ) : (
                <div className="no-data-message">{t('information.emptyEpisodes')}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
