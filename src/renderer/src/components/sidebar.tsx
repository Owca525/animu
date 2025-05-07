import { useEffect, useRef, useState } from "react"
import Button from "./buttons"
import "./css/sidebar.css"
import useHotkeys from "@reecelucas/react-use-hotkeys"
import icon from "../../../../resources/icon.png"

interface sidebarProps {
    showLogo?: boolean
    hideButton?: boolean
    sidebarClass?: {
        container?: string
        sidebar?: string
    }
    data: {
        top: {
            icon: string
            text: string
            onClick?: () => any
        }[]
        bottom: {
            icon: string
            text: string
            onClick?: () => any
        }[]
    }
}

const Sidebar: React.FC<sidebarProps> = ({ showLogo, sidebarClass, data, hideButton = false }) => {
    const [sidebarHover, setHover] = useState<boolean>(false)
    const sidebarRef = useRef<HTMLDivElement>(null);
    const [version, setversion] = useState<string>("")

    const getVersion = async (): Promise<void> => setversion(await window.backend.version())

    const handleClickOutside = (event: MouseEvent) => {
        let data = event.target as HTMLElement
        if (data.classList.contains("sidebar-button")) return
        if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) && data.classList.contains("sidebar-hide-button")) {
            setHover((prev) => !prev)
            return
        }
        setHover(() => false)
    };

    useEffect(() => {
        getVersion()
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [])

    useHotkeys("Tab", () => {
        setHover((prev) => !prev)
    })

    function hideSidebar(event, func) {
        if (func) {
            func(event)
            setHover((prev) => !prev)
        }
    }

    return (
        <div className={"sidebar-main-container " + sidebarClass?.container}>
            {hideButton ? "" : (
                <div className="sidebar-hide-container">
                    <Button icon="menu" ButtonClass="sidebar-hide-button" iconClassName="sidebar-hide-button" />
                </div>
            )}
            {showLogo ? (
                <div className="sidebar-logo-icon-container">
                    <img src={icon} alt={version} className="sidebar-image" />
                    <div className="sidebar-version">{version}</div>
                </div>
            ) : ""}
            <div className={"sidebar-container-max"} style={hideButton == false ? sidebarHover ? {} : { display: "none" } : {}} ref={sidebarRef}>
                <div className={`sidebar-top ${"sidebar-max-button"}`}>
                    {showLogo ? <div className="sidebar-black-line"></div> : ""}
                    {data.top.map((value) => <Button icon={value.icon} content={hideButton == false ? sidebarHover ? value.text : undefined : value.text} onClick={(event) => hideSidebar(event, value.onClick)} ButtonClass="sidebar-button" iconClassName="sidebar-button" />)}
                </div>
                <div className={`sidebar-bottom ${"sidebar-max-button"}`}>
                    <div className="sidebar-black-line"></div>
                    {data.bottom.map((value) => <Button icon={value.icon} content={hideButton == false ? sidebarHover ? value.text : undefined : value.text} onClick={(event) => hideSidebar(event, value.onClick)} ButtonClass="sidebar-button" iconClassName="sidebar-button" />)}
                </div>
            </div>
        </div>
    )
}

export default Sidebar
