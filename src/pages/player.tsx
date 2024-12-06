import "../css/pages/player.css";
import { useLocation } from "react-router-dom";

export const Player = () => {
    const location = useLocation();
    const {ep} = location.state;

    return (
        <div>
            <p>{ep}</p>
        </div>
    )
}