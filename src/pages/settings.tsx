import { useNavigate } from "react-router-dom";
import Button from "../components/ui/button";
import "../css/pages/settings.css";

export const Settings = () => {
    const navigate = useNavigate();
    
    return (
        <div className="settings-container">
            <div className="message">Settings have not been done</div>
            <Button value="Back" className="back-button" onClick={() => navigate("/")}/>
        </div>
    )
}