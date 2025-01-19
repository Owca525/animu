import { useEffect, useReducer, useState } from 'react'
import { InformationData } from '../../utils/interface'
import { get_information } from '../../utils/backend'
import '../../css/elements/information.css'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { hideInformation } from '@renderer/utils/context/InformationContext'
import { closeDialog, showDialog } from '@renderer/utils/context/DialogContext'
import Drop from '../ui/drop'

const htmlEntities = {
  '&apos;': "'",
  '&quot;': '"',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&#x2014;': '—',
  '&#x2013;': '–',
};

function decodeHtmlEntities(str) {
  let decodedString = str.replace(/&[a-zA-Z0-9#]+;/g, (match) => {
    return htmlEntities[match] || match;
  });
  decodedString = decodedString.replace(/<br\s*\/?>/gi, '\n');
  decodedString = decodedString.replace(/<\/?[^>]+(>|$)/g, "");
  return decodedString;
}

const initialImagesState = {
  isCoverLoaded: false,
  isCoverError: false,
  isBannerLoaded: false,
};

const LoadingActionTypes = {
  SET_IS_COVER_LOADED: 'SET_IS_COVER_LOADED',
  SET_IS_COVER_ERROR: 'SET_IS_COVER_ERROR',
  SET_IS_BANNER_LOADED: 'SET_IS_BANNER_LOADED',
};

const reducer = (state, action) => {
  switch (action.type) {
    case LoadingActionTypes.SET_IS_COVER_LOADED:
      return { ...state, isCoverLoaded: action.payload };
    case LoadingActionTypes.SET_IS_COVER_ERROR:
      return { ...state, isCoverError: action.payload };
    case LoadingActionTypes.SET_IS_BANNER_LOADED:
      return { ...state, isBannerLoaded: action.payload };
    default:
      return state;
  }
};

export const Information: React.FC<{ anime_id: string }> = ({ anime_id }) => {
  const { t } = useTranslation()
  const [state, dispatch] = useReducer(reducer, initialImagesState);

  const [data, setData] = useState<InformationData | undefined>()
  // const navigate = useNavigate()
  const buttons = [
    { title: t('general.ok'), onClick: () => { closeDialog(); hideInformation() } },
    { title: t('general.reload'), onClick: async () => { await fetchData(); closeDialog() } }
  ]

  const fetchData = async () => {
    const anime_data = await get_information(anime_id)
    console.log(anime_data)
    if (anime_data == null) {
      showDialog({ header_text: "Error in information", text: "Error Fetch Data", buttons: buttons })
      return
    }
    const container = document.querySelector(".container") as HTMLDivElement
    if (container) container.style.display = "none"; container.scrollTop = 0
    setData(anime_data)
  }

  const handleImageCoverLoad = () => {
    dispatch({ type: LoadingActionTypes.SET_IS_COVER_LOADED, payload: true })
    dispatch({ type: LoadingActionTypes.SET_IS_COVER_ERROR, payload: false })
  }

  useEffect(() => {
    fetchData()
  }, [])

  function makeButtons(episode: number[]) {
    return (
      <div className='information-buttons-episode-container'>
        {episode.map((num) => (
          <div className='information-episode-button'>{num}</div>
        ))}
      </div>
    )
  }

  if (data == undefined) {
    return (
      <div className="information-background" style={{ backgroundColor: "rgb(0,0,0, 0.5)", position: "fixed" }}>
        <div className="material-symbols-outlined loading">progress_activity</div>
      </div>
    )
  }

  return (
    <div className="information-background">
      <div className="information-exit-button material-symbols-outlined" onClick={() => hideInformation()}>
        arrow_back
      </div>
      <div className="information-banner"><img className={`information-banner`} src={data.banner} /></div>
      <div className="informartion-fade"></div>
      <div className="information-content">
        <div className="information-top">
          <div className="information-image">
            {state.isCoverLoaded == false && (
              <div className="information-image-placeholder">
                <div className='material-symbols-outlined loading'>progress_activity</div>
              </div>
            )}
            <img onLoad={handleImageCoverLoad} className={`${state.isCoverLoaded && !state.isCoverError ? 'loaded' : 'hidden'} information-image`} onError={() => dispatch({ type: LoadingActionTypes.SET_IS_COVER_ERROR, payload: true })} src={data.img} />
          </div>
          <div className="information-text">
            <div className="information-header">{data.title}</div>
            <div className="information-description">
              {decodeHtmlEntities(data.description)}
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
            {data.episodes.map((episode) => (
              <Drop LeftHeader={episode.type} RightHeader={`${episode.avaibleEpisodes} episodes`} content={makeButtons(episode.listEpisodes)}/>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
