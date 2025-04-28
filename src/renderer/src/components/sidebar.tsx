import { useState } from "react"
import Button from "./buttons"
import "./css/sidebar.css"

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

    return (
        <div className="sidebar-main-container">
            {hideButton ? "" : (
                <div className="sidebar-hide-container">
                    <Button icon="menu" onClick={() => setHover((prev) => !prev)} />
                </div>
            )}
            <div className={"sidebar-container-max"} style={sidebarHover ? {} : { display: "none" }}>
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
