import React, { useState } from 'react'
import "./css/drop.css"
import { motion } from 'framer-motion'

interface dropData {
    content: React.ReactNode
    LeftHeader: string
    RightHeader: string
}

const Drop: React.FC<dropData> = ({ content, LeftHeader, RightHeader }) => {
    const [isOpen, setIsOpen] = useState(false)

    const dropVariants = {
        hidden: { opacity: 0, height: 0 },
        visible: { opacity: 1, height: "max-content" },
    };

    return (
        <div className="drop-container">
            <div className={`drop-button ${isOpen ? "active-drop" : ""}`} onClick={() => setIsOpen((prev) => !prev)}>
                <div className="drop-header">{LeftHeader}</div>
                <div className="drop-header">{RightHeader} <div className="episodes-arrow material-symbols-outlined">{isOpen ? "arrow_drop_up" : "arrow_drop_down"}</div></div>
            </div>
            <motion.div variants={dropVariants} initial={"hidden"} animate={isOpen ? "visible" : "hidden"} transition={{duration: 0.2}} className={`drop-content ${isOpen ? "drop-content-show" : ""}`}>{content}</motion.div>
        </div>
    )
}

export default Drop
