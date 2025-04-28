import { useEffect, useRef, useState } from "react"
import Button from "./buttons"
import "./css/sidebar.css"
import useHotkeys from "@reecelucas/react-use-hotkeys"

interface sidebarProps {
    showLogo?: boolean
    alwaysShow?: boolean
    hideButton?: boolean
    data: {
        top: {
            icon: string
            text: string
            onClick?: () => void
        }[]
        bottom: {
            icon: string
            text: string
            onClick?: () => void
        }[]
    }
}

const Sidebar: React.FC<sidebarProps> = ({ showLogo, alwaysShow, data, hideButton }) => {
    const [sidebarHover, setHover] = useState<boolean>(false)
    const sidebarRef = useRef<HTMLDivElement>(null);

    const handleClickOutside = (event: MouseEvent) => {
        let data = event.target as HTMLElement
        console.log(event)
        if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) && data.classList.contains("material-symbols-outlined") == true) {
            setHover((prev) => !prev)
            return
        }
        if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) && data.classList.contains("sidebar-hide-button") == true) {
            setHover((prev) => !prev)
            return
        }
        setHover(() => false)
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [])

    useHotkeys("Tab", () => {
        setHover((prev) => !prev)
    })

    return (
        <div className="sidebar-main-container">
            {hideButton ? "" : (
                <div className="sidebar-hide-container">
                    <Button icon="menu" ButtonClass="sidebar-hide-button" />
                </div>
            )}
            <div className={"sidebar-container-max"} style={sidebarHover ? {} : { display: "none" }} ref={sidebarRef}>
                <div className={`sidebar-top ${"sidebar-max-button"}`}>
                    {data.top.map((value) => <Button icon={value.icon} content={sidebarHover ? value.text : undefined} onClick={value.onClick} />)}
                </div>
                <div className={`sidebar-bottom ${"sidebar-max-button"}`}>
                    <div className="sidebar-black-line"></div>
                    {data.bottom.map((value) => <Button icon={value.icon} content={sidebarHover ? value.text : undefined} onClick={value.onClick} />)}
                </div>
            </div>
        </div>
    )
}

export default Sidebar
