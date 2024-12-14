import React from "react";
import "../../css/dialogs/keybind.css"

interface keybindsProps {
    title: string;
    value: string;
    changeKey: () => void;
}

const keybind: React.FC<keybindsProps> = ({ title, value }) => {
    return (
        <div className="keybind-container">
            {title} <div className="keybind-space">{value}</div>
        </div>
    )
}

export default keybind