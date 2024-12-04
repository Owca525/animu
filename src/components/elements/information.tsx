import { useEffect, useRef } from "react"
import "./information.css"

interface Props {
    title: string
    showPopup: boolean
    toggle: () => void;
}

export const Information: React.FC<Props> = ({title, showPopup, toggle}) => {
    
    const modalRef: any = useRef();

    const handleClickOutside = (event:any) => {
        if(modalRef.current && !modalRef.current.contains(event.target)) {
            toggle();
        }
    };

    useEffect(() => {
        if(showPopup) {
            document.addEventListener('click', handleClickOutside);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
        }
    }, [showPopup])

    useEffect(() => {
        const handleKeyDown = (event: any) => {
            if(event.key === 'Escape') {
                toggle();
            }
        }

        document.addEventListener('keydown', handleKeyDown)

        return () => {
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [])

    return (
        <div className="modal-backdrop" style={{display: showPopup ? "flex" : "none"}} ref={modalRef}>
            <div className="modal-content">
                {title}
            </div>
        </div>
    )
}