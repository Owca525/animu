

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
        <div className="external-container">
            <div className="external-title">Episode 8 of Oshi No ko</div>
            <div className="external-player-container">
                <Button icon='skip_previous' ButtonClass="player-buttons" />
                <Button icon='replay' ButtonClass="player-buttons" />
                <Button icon='skip_next' ButtonClass="player-buttons" />
            </div>
            <Drop content={makeButtons([1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,])} LeftHeader={"Episodes"} RightHeader={""} />
        </div>
    )
}

export default ExternalPlayer