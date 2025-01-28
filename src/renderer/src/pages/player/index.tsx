import { get_player_anime } from "@renderer/utils/backend";
import { playerUrlProps } from "@renderer/utils/interface";
import { useQuery } from "react-query";
import { useLocation } from "react-router-dom"
import VideoPlayer from "./VideoPlayer";

async function fetchEpisodeData({ queryKey }): Promise<playerUrlProps[]> {
    return await get_player_anime(queryKey[0], queryKey[1])
}

const player = () => {
    const { id, title, episodes, episode, time, img } = useLocation().state

    const { data, isLoading, isError } = useQuery(
        [id, episode],
        fetchEpisodeData,
    );

    console.log(data, isLoading, isError)

    if (isLoading) {
        return (
            <div className="video-container" style={{ height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <div className="player-waiting material-symbols-outlined loading" style={{ maxHeight: "min-content" }}>progress_activity</div>
            </div>
        )
    }

    if (isError) {
        return (
            <div></div>
        )
    }

    if (data) {
        return (
            <>
                <VideoPlayer
                    id={id}
                    img={img}
                    title={title}
                    episodes={episodes}
                    episode={episode}
                    functions={{ nextButton: () => "", prevButton: () => "" }}
                    episodesUrl={data}
                    time={time}
                />
            </>
        )
    }
}

export default player