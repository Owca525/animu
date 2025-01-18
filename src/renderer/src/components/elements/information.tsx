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

  // const navigate = useNavigate()

  // const handleImageLoad = () => {
  //   setIsImageLoaded(true)
  //   setimgHasError(false)
  // }

  const fetchData = async () => {
    const anime_data = await get_information(id_anime)
    console.log(anime_data)
    // setData(anime_data)
    // setLoading(false)
  }

  // const handleClickOutside = (event: any) => {
  //   if (modalRef.current && !modalRef.current.contains(event.target)) {
  //     toggle()
  //   }
  // }

  useEffect(() => {
    // fetchData()
  }, [])

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

  return (
    <div className="information-background" style={{ visibility: showPopup ? 'visible' : 'hidden' }}> {/* style={{ visibility: showPopup ? 'visible' : 'hidden' }} */}
      <div className="information-exit-button material-symbols-outlined">
        arrow_back
      </div>
      <div className="information-banner"><img className='information-banner' src="https://s4.anilist.co/file/anilistcdn/media/anime/banner/150672-ISwoA0eS722H.jpg" /></div>
      <div className="informartion-fade"></div>
      <div className="information-content">
        <div className="information-top">
          <div className="information-image"><img className='information-image' src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx150672-jguvEfP0vGfW.png" /></div>
          <div className="information-text">
            <div className="information-header">Oshi no ko</div>
            <div className="information-description">
              When a pregnant young starlet appears in Gorou Amemiya’s countryside medical clinic, the doctor takes it upon himself to safely (and secretly) deliver Ai Hoshino’s child so she can make a scandal-free return to the stage. But no good deed goes unpunished, and on the eve of her delivery, he finds himself slain at the hands of Ai’s deluded stalker — and subsequently reborn as Ai’s child, Aquamarine Hoshino! The glitz and glamor of showbiz hide the dark underbelly of the entertainment industry, threatening to dull the shine of his favorite star. Can he help his new mother rise to the top of the charts? And what will he do when unthinkable disaster strikes?
            </div>
          </div>
        </div>
        <div className="information-bottom">
          <div className="information-anime-info">
            <div className="information-anime-info-content">
              <div className="information-anime-info-header">Format</div>
              <div className="information-anime-info-text">TV</div>
            </div>
            <div className="information-anime-info-content">
              <div className="information-anime-info-header">Episodes</div>
              <div className="information-anime-info-text">11</div>
            </div>
            <div className="information-anime-info-content">
              <div className="information-anime-info-header">Episode Duration </div>
              <div className="information-anime-info-text">24 mins</div>
            </div>
            <div className="information-anime-info-content">
              <div className="information-anime-info-header">Status</div>
              <div className="information-anime-info-text">Finished</div>
            </div>
            <div className="information-anime-info-content">
              <div className="information-anime-info-header">Start Date</div>
              <div className="information-anime-info-text">Apr 12, 2023</div>
            </div>
            <div className="information-anime-info-content">
              <div className="information-anime-info-header">End Date</div>
              <div className="information-anime-info-text">Jun 28, 2023</div>
            </div>
            <div className="information-anime-info-content">
              <div className="information-anime-info-header">Season</div>
              <div className="information-anime-info-text">Spring 2023 </div>
            </div>
          </div>
          <div className="information-episodes">
            <div className="information-episodes-content">
              <div className="episodes-header">Dub</div>
              <div className="episodes-header">12 episodes <div className="episodes-arrow material-symbols-outlined">arrow_drop_down</div></div>
            </div>
            <div className="information-episodes-content">
              <div className="episodes-header">Sub</div>
              <div className="episodes-header">13 episodes <div className="episodes-arrow material-symbols-outlined">arrow_drop_down</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
