import React from "react";
import "../../css/elements/dialog.css"
import Button from "../ui/button";

interface dialogProps {
    type: string;
    header_text: string;
    text: string;
}

const dialog: React.FC<dialogProps> = ({ type, header_text, text }) => {
    return (
        <div className="dialog-container">
            <div className="dialog">
                <div className="dialog-space">
                    <div className="dialog-Header">{header_text}</div>
                    <div className="dialog-text">{text}</div>
                </div>
                <div className="dialog-buttons"><Button value="Okay" className="dialog-button"/></div>
            </div>
        </div>
    )
}

export default dialog