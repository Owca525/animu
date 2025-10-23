import React, { useEffect, useState } from "react";
import "./css/ContextMenu.css"
import { ContextMenuProps } from "../GlobalInterface";

let OpenContextMenu: (data: ContextMenuProps, event: React.MouseEvent) => void = () => { };
let CloseContextMenu: () => void = () => { };

const ContextMenu: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [data, setData] = useState<ContextMenuProps | null>(null);
    const [event, setEvent] = useState<React.MouseEvent | null>(null)

    OpenContextMenu = (data: ContextMenuProps, event: React.MouseEvent) => {
        event.stopPropagation()
        setData(data);
        setEvent(event)
        setIsOpen(true);
    };

    CloseContextMenu = () => {
        setIsOpen(false);
        setData(null);
    };
    const handleClickOutside = (event: MouseEvent) => {
        let data = event.target as HTMLElement
        if (data.classList.contains("contextmenu-container") || data.classList.contains("contextmenu-option") || data.classList.contains("contextmenu-option-line")) return
        if (event.button == 0) {
            setIsOpen(() => false)
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [])

    return (
        <>
            {children}
            {isOpen && data && data.length != 0 && event && (
                <div 
                    // onMouseLeave={() => CloseContextMenu()}
                    className="contextmenu-container"
                    style={{
                        position: 'absolute',
                        top: event.pageY,
                        left: event.pageX,
                        zIndex: 9999,
                    }}>
                        {data.map((option) => option.line ? 
                            <div className="contextmenu-option-line"></div> : 
                            <div className={`contextmenu-option ${option.deletion ? "contextmenu-option-deletion" : ""}`} onClick={() => {CloseContextMenu(); option.onClick ? option.onClick(): ""}}>{option.option}</div>
                        )}
                </div>
            )}
        </>
    );
};

export { ContextMenu, OpenContextMenu, CloseContextMenu };