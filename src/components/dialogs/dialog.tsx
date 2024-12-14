import React from "react";
import "../../css/dialogs/dialog.css"
import Button from "../ui/button";

interface dialogProps {
    type: string;
    header_text: string;
    text: string;
    onClick: () => void;
}

const dialog: React.FC<dialogProps> = ({ type, header_text, text, onClick }) => {
    if (type == "error") {

    }
    return (
        <div className="dialog-container">
            <div className="dialog">
                <div className="dialog-space">
                    <div className="dialog-Header">{header_text}</div>
                    <div className="dialog-text">{text}</div>
                </div>
                <div className="dialog-buttons"><Button value="Okay" className="dialog-button" onClick={onClick}/></div>
            </div>
        </div>
    )
}

export default dialog