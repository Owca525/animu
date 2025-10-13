import { useEffect, useRef, useState } from "react"
import Button from "./buttons"
import "./css/sidebar.css"
import icon from "../../../../resources/icon.png"
import { sidebarData } from "@renderer/utils/GlobalInterface"
import { motion } from "framer-motion"
import { useHotkeys } from "react-hotkeys-hook"
import { setHomeLocalSearch } from "@renderer/utils/pluginApi"

interface sidebarProps {
    showLogo?: boolean
    openSidebar?: boolean
    onChange?: (isOpen: boolean) => void
    data: {
        top: sidebarData[]
        bottom: sidebarData[]
    }
    activeElement?: boolean
}

const Sidebar: React.FC<sidebarProps> = ({ showLogo = false, data, onChange, openSidebar, activeElement }) => {
    const [sidebarHover, setHover] = useState<boolean>(false)
    const sidebarRef = useRef<HTMLDivElement>(null);
    const [version, setversion] = useState<string>("")
    const currentButton = useRef<number>(activeElement ? 0 : -1)

    const getVersion = async (): Promise<void> => setversion(await window.backend.version())

    useEffect(() => {
        if (onChange) onChange(sidebarHover)
        if (openSidebar) setHover(openSidebar)
    }, [openSidebar, sidebarHover])

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

    function hideSidebar(event, func, num?: number) {
        if (activeElement && num != undefined) currentButton.current = num
        setHover((prev) => !prev)
        if (!func) return
        func(event)
    }

    const sidebarVariants = {
        hidden: { opacity: 1, x: -200 },
        visible: { opacity: 1, x: 0 },
    };

    function detectSidebarStateButton(text: string): string | undefined {
        if (sidebarHover) return text
        return undefined
    }

    function detectSidebarState() {
        if (sidebarHover) return "sidebar-container-max"
        return "sidebar-container-min"
    }

    function detectSidebarStateClass() {
        if (sidebarHover) return "sidebar-button"
        return "sidebar-button-min"
    }

    function detectSidebarStateContainers() {
        if (sidebarHover) return "sidebar-max-button-container"
        return "sidebar-min-button-container"
    }

    function checkNumber(num: number): string {
        if (num == currentButton.current) return "active"
        return ""
    }

    return (
        <motion.div className={detectSidebarState()} ref={sidebarRef}
            initial={showLogo ? "visible" : "hidden"}
            animate={showLogo ? "visible" : sidebarHover ? "visible" : "hidden"}
            variants={sidebarVariants}
            transition={{ duration: 0.2 }}
            onMouseEnter={() => showLogo && setHover(() => true)}
            onMouseLeave={() => showLogo && setHover(() => false)}
        >
            {showLogo && (
                <div className="sidebar-logo-icon-container">
                    <img src={icon} alt={version} className="sidebar-image" />
                    {sidebarHover && <div className="sidebar-version">v{version}</div>}
                </div>
            )}
            <div className="sidebar-buttons-content">
                <div className={`sidebar-top ${detectSidebarStateContainers()}`}>
                    {!showLogo && <Button icon={"arrow_back"} content={detectSidebarStateButton("Hide Sidebar")} onClick={(event) => { setHomeLocalSearch(false); hideSidebar(event, undefined) }} ButtonClass={detectSidebarStateClass()} iconClassName="sidebar-button" />}
                    <div className="sidebar-black-line"></div>
                    {data.top.map((value, i) => <Button icon={value.icon} 
                        content={detectSidebarStateButton(value.text)} 
                        onClick={(event) => { setHomeLocalSearch(false); hideSidebar(event, value.onClick, i) }} 
                        ButtonClass={`${detectSidebarStateClass()} ${checkNumber(i)}`} 
                        iconClassName={`sidebar-button ${checkNumber(i)}`} />
                    )}
                </div>
                <div className={`sidebar-bottom ${detectSidebarStateContainers()}`}>
                    <div className="sidebar-black-line"></div>
                    {data.bottom.map((value) => <Button icon={value.icon} content={detectSidebarStateButton(value.text)} onClick={(event) => { setHomeLocalSearch(false); hideSidebar(event, value.onClick) }} ButtonClass={detectSidebarStateClass()} iconClassName="sidebar-button" />)}
                </div>
            </div>
        </motion.div>
    )
}

export default Sidebar
