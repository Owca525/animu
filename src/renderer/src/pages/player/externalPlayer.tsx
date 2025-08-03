

import Button from "@renderer/components/buttons"
import "./components/css/externalPlayer.css"
import Drop from "../information/components/drop"

const ExternalPlayer = () => {

    function makeButtons(episode: number[]) {
        return (
          <div className='information-buttons-episode-container'>
            {episode.map((num) => (
              <div className='information-episode-button'>{num}</div>
            ))}
          </div>
        )
      }

    return (
        <div className="external-player-container">
        <div className="video-top">
            <Button icon="arrow_back" ButtonClass="player-buttons" />
            <div className="player-title">Episode 8 of Oshi No ko</div>
                <div className="external-dropdown"> <div className="dropdown-container"><div className="dropdown-button">test</div></div> </div>
        </div>
        <div className="external-player-center">
            <div className="external-button-container">
                <Button icon='skip_previous' ButtonClass="player-buttons" />
                <Button icon='replay' ButtonClass="player-buttons" />
                <Button icon='skip_next' ButtonClass="player-buttons" />
            </div>
            <Drop content={makeButtons([1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,])} LeftHeader={"Episodes"} RightHeader={""} />
        </div>
        </div>
    )
}

export default ExternalPlayer