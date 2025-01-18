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

  return (
    <div className="information-background" style={{ visibility: showPopup ? 'visible' : 'hidden' }}>
    </div>
  )
}
