import "../css/pages/player.css";
import { useLocation } from "react-router-dom";

export const Player = () => {
    const location = useLocation();
    const { id, title, episodes, ep} = location.state;
    console.log(id, title, episodes)

    return (
        <div>
            <p>{ep}</p>
        </div>
    )
}