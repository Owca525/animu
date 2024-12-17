import React from "react";
import "../../css/dialogs/dialog.css"
import Button from "../ui/button";

interface dialogProps {
    header_text: string;
    text: string;
    buttons: { title: string, onClick: () => void; }[];
}

const dialog: React.FC<dialogProps> = ({ header_text, text, buttons }) => {
    return (
        <div className="dialog-container">
            <div className="dialog">
                <div className="dialog-space">
                    <div className="dialog-Header">{header_text}</div>
                    <div className="dialog-text">{text}</div>
                </div>
                <div className="dialog-buttons">
                    {buttons.map((button) => <Button value={button.title} className="dialog-button" onClick={button.onClick}/>)}
                </div>
            </div>
        </div>
    )
}

export default dialog