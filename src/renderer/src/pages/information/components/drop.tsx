import React, { useState } from 'react'
import "./css/drop.css"

interface dropData {
    content: React.ReactNode
    LeftHeader: string
    RightHeader: string
}

const Drop: React.FC<dropData> = ({ content, LeftHeader, RightHeader }) => {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="drop-container">
            <div className={`drop-button ${isOpen ? "active-drop" : ""}`} onClick={() => setIsOpen((prev) => !prev)}>
                <div className="drop-header">{LeftHeader}</div>
                <div className="drop-header">{RightHeader} <div className="episodes-arrow material-symbols-outlined">{isOpen ? "arrow_drop_up" : "arrow_drop_down"}</div></div>
            </div>
            <div className={`drop-content ${isOpen ? "drop-content-show" : ""}`}>{content}</div>
        </div>
    )
}

export default Drop
