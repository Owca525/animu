import { useReducer } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

// utils
import { InformationData } from '@renderer/utils/interface'
import { hideInformation } from '@renderer/utils/context/InformationContext'
import { closeDialog } from '@renderer/utils/context/DialogContext'

// Components
import Drop from '../ui/drop'

// css
import '../../css/elements/information.css'

function decodeHtmlEntities(str: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(str, 'text/html');
  return doc.documentElement.textContent;
}

const initialImagesState = {
  isCoverLoaded: false,
  isCoverError: false,
  isBannerError: false,
};

const LoadingActionTypes = {
  SET_IS_COVER_LOADED: 'SET_IS_COVER_LOADED',
  SET_IS_COVER_ERROR: 'SET_IS_COVER_ERROR',
  SET_IS_BANNER_ERROR: 'SET_IS_BANNER_ERROR',
};

const reducer = (state, action) => {
  switch (action.type) {
    case LoadingActionTypes.SET_IS_COVER_LOADED:
      return { ...state, isCoverLoaded: action.payload };
    case LoadingActionTypes.SET_IS_COVER_ERROR:
      return { ...state, isCoverError: action.payload };
    case LoadingActionTypes.SET_IS_BANNER_ERROR:
      return { ...state, isBannerLoaded: action.payload };
    default:
      return state;
  }
};


export const Information: React.FC<{ data: InformationData }> = ({ data }) => {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const buttons = [
    { title: t('general.ok'), onClick: () => { closeDialog(); hideInformation() } },
    { title: t('general.reload'), onClick: async () => { closeDialog() } }
  ]

  const [state, dispatch] = useReducer(reducer, initialImagesState);

  const handleImageCoverLoad = () => {
    dispatch({ type: LoadingActionTypes.SET_IS_COVER_LOADED, payload: true })
    dispatch({ type: LoadingActionTypes.SET_IS_COVER_ERROR, payload: false })
  }

  function RunPlayer(ep: number, type: string) {
    if (data == undefined) return
    // data.episodes.forEach((element) => {
    //   if (element.type == type){ 
    //     navigate('/player', {
    //       state: {
    //         id: data.id,
    //         title: decodeURIComponent(data.title),
    //         episodes: element.listEpisodes,
    //         episode: { type: type, ep: ep },
    //         time: 0,
    //         img: data.images.cover
    //       }
    //     })
    //     hideInformation()
    //   }
    // })
  }

  function makeButtons(episode: number[], type: string) {
    return (
      <div className='information-buttons-episode-container'>
        {episode.map((num) => (
          <div className='information-episode-button' onClick={() => RunPlayer(num, type)}>{num}</div>
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
  console.log(data)
  return (
    <div className="information-background">
      <div className="information-exit-button material-symbols-outlined" onClick={() => hideInformation()}>
        arrow_back
      </div>
      <div className="information-banner">
        {data.data.bannerImage == null ? (
          <img className={`information-banner`} style={{ filter: "blur(3px)" }} src={data.data.coverImage ? data.data.coverImage : ""} />
        ) : (
          <img onError={() => dispatch({ type: LoadingActionTypes.SET_IS_BANNER_ERROR, payload: true })} className={`information-banner ${state.isBannerError ? "hidden" : ""}`} src={data.data.bannerImage} />
        )}
      </div>
      <div className="information-fade"></div>
      <div className="information-content">
        <div className="information-top">
          <div className="information-image">
            {state.isCoverLoaded == false && (
              <div className="information-image-placeholder">
                <div className='material-symbols-outlined loading'>progress_activity</div>
              </div>
            )}
            <img onLoad={handleImageCoverLoad} className={`${state.isCoverLoaded && !state.isCoverError ? 'loaded' : 'hidden'} information-image`} onError={() => dispatch({ type: LoadingActionTypes.SET_IS_COVER_ERROR, payload: true })} src={data.data.coverImage ? data.data.coverImage : ""} />
          </div>
          <div className="information-text">
            <div className="information-header">{data.data.title}</div>
            <div className="information-description">
              {decodeHtmlEntities(data.data.description ? data.data.description : "None" )}
            </div>
          </div>
        </div>
        <div className="information-bottom">
          <div className="information-anime-info">
            {data.data.format != undefined && (
              <div className="information-anime-info-content">
                <div className="information-anime-info-header">Format</div>
                <div className="information-anime-info-text">{data.data.format}</div>
              </div>
            )}
            {data.data.episodes != undefined && (
              <div className="information-anime-info-content">
                <div className="information-anime-info-header">Episodes</div>
                <div className="information-anime-info-text">{data.data.episodes}</div>
              </div>
            )}
            {data.data.duration != undefined && (
              <div className="information-anime-info-content">
                <div className="information-anime-info-header">Episode Duration</div>
                <div className="information-anime-info-text">{data.data.duration} minutes</div>
              </div>
            )}
            {data.data.status != undefined && (
              <div className="information-anime-info-content">
                <div className="information-anime-info-header">Status</div>
                <div className="information-anime-info-text">{data.data.status}</div>
              </div>
            )}
            {/* {data.data.airedStart != undefined && (
              <div className="information-anime-info-content">
                <div className="information-anime-info-header">Start Date</div>
                <div className="information-anime-info-text">{convertDateToFormattedString(data.information.airedStart.year, data.information.airedStart.month, data.information.airedStart.hour, data.information.airedStart.minute, data.information.airedStart.date)}</div>
              </div>
            )}
            {data.information.airedEnd != undefined && (
              <div className="information-anime-info-content">
                <div className="information-anime-info-header">End Date</div>
                <div className="information-anime-info-text">{convertDateToFormattedString(data.information.airedEnd.year, data.information.airedEnd.month, data.information.airedEnd.hour, data.information.airedEnd.minute, data.information.airedEnd.date)}</div>
              </div>
            )} */}
           {data.data.season != undefined && (
              <div className="information-anime-info-content">
                <div className="information-anime-info-header">Season</div>
                <div className="information-anime-info-text">{data.data.season} {data.data.seasonYear}</div>
              </div>
            )}
          </div>
          {/* <div className="information-episodes">
            {data.episodes.map((episode) => (
              <Drop LeftHeader={episode.type} RightHeader={`${episode.avaibleEpisodes} episodes`} content={makeButtons(episode.listEpisodes, episode.type)} />
            ))}
          </div> */}
        </div>
      </div>
    </div>
  )
}