import { useEffect, useRef, useState } from "react"
import Button from "./buttons"
import "./css/sidebar.css"
import icon from "../../../../resources/icon.png"
import { SettingsConfig, sidebarData } from "@renderer/utils/GlobalInterface"
import { motion } from "framer-motion"
import { useHotkeys } from "react-hotkeys-hook"
import { setHomeLocalSearch } from "@renderer/utils/pluginApi"
import { useSelector } from "react-redux"

interface sidebarProps {
    showLogo?: boolean
    hideButton?: boolean
    sidebarClass?: {
        container?: string
        sidebar?: string
    }
    data: {
        top: sidebarData[]
        bottom: sidebarData[]
    }
}

const Sidebar: React.FC<sidebarProps> = ({ showLogo, sidebarClass, data, hideButton = false }) => {
    const [sidebarHover, setHover] = useState<boolean>(false)
    const sidebarRef = useRef<HTMLDivElement>(null);
    const [version, setversion] = useState<string>("")
    const config: SettingsConfig = useSelector((data: any) => data.config);

    const getVersion = async (): Promise<void> => setversion(await window.backend.version())

    const handleClickOutside = (event: MouseEvent) => {
        let data = event.target as HTMLElement
        if (data.classList.contains("sidebar-button")) return
        if (data.classList.contains("sidebar-hide-button")) return
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
        if (!func) return
        func(event)
        if (!config.General.HoverSidebar) return
        setHover((prev) => !prev)
        
    }

    const sidebarVariants = {
        hidden: { opacity: 1, x: -200 },
        visible: { opacity: 1, x: 0 },
    };

    function detectSidebarStateButton(text: string): string | undefined {
        if (showLogo) return text
        if (sidebarHover) return text
        if (!config.General.HideSidebar) return undefined
        if (hideButton) return text
        return undefined
    }

    function detectSidebarState() {
        if (showLogo) return "sidebar-container-max"
        if (sidebarHover) return "sidebar-container-max"
        if (!config.General.HideSidebar) return "sidebar-container-min"
        return "sidebar-container-max"
    }

    function detectSidebarStateClass() {
        if (showLogo) return "sidebar-button"
        if (sidebarHover) return "sidebar-button"
        if (!config.General.HideSidebar) return "sidebar-button-min"
        return "sidebar-button"
    }

    function detectSidebarStateContainers() {
        if (showLogo) return "sidebar-max-button-container"
        if (sidebarHover) return "sidebar-max-button-container"
        if (!config.General.HideSidebar) return "sidebar-min-button-container"
        return "sidebar-max-button-container"
    }

    return (
        <div className={"sidebar-main-container " + sidebarClass?.container}>
            {!hideButton && (
                <div className="sidebar-hide-container">
                    <Button icon="menu" ButtonClass="sidebar-hide-button" onClick={() => setHover((prev) => !prev)} iconClassName="sidebar-hide-button" />
                </div>
            )}
            {showLogo && (
                <div className="sidebar-logo-icon-container">
                    <img src={icon} alt={version} className="sidebar-image" />
                    <div className="sidebar-version">{`v${version}`}</div>
                </div>
            )}
            <motion.div className={detectSidebarState()} ref={sidebarRef}
                initial={showLogo || !config.General.HideSidebar ? "visible" : "hidden"}
                animate={!config.General.HideSidebar ? "visible" : hideButton == false ? sidebarHover ? "visible" : "hidden" : "visible"}
                variants={sidebarVariants}
                transition={{ duration: 0.2 }}
                onMouseEnter={() => config.General.HoverSidebar && setHover(() => true)}
                onMouseLeave={() => !config.General.HideSidebar && config.General.HoverSidebar && setHover(() => false)}
            >

                <div className={`sidebar-top ${detectSidebarStateContainers()}`}>
                    {showLogo && <div className="sidebar-black-line"></div>}
                    {data.top.map((value) => <Button icon={value.icon} content={detectSidebarStateButton(value.text)} onClick={(event) => {setHomeLocalSearch(false); hideSidebar(event, value.onClick)}} ButtonClass={detectSidebarStateClass()} iconClassName="sidebar-button" />)}
                </div>
                <div className={`sidebar-bottom ${detectSidebarStateContainers()}`}>
                    <div className="sidebar-black-line"></div>
                    {data.bottom.map((value) => <Button icon={value.icon} content={detectSidebarStateButton(value.text)} onClick={(event) => {setHomeLocalSearch(false); hideSidebar(event, value.onClick)}} ButtonClass={detectSidebarStateClass()} iconClassName="sidebar-button" />)}
                </div>
            </motion.div>
        </div>
    )
}

export default Sidebar
