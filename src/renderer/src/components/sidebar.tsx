import Button from "./buttons"
import "./css/sidebar.css"

interface sidebarProps {
    showLogo?: boolean
    Hover?: boolean
    SidebarHide?: boolean
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

const Sidebar: React.FC<sidebarProps> = ({ showLogo, Hover, SidebarHide, data, hideButton }) => {
    return (
        <div className="sidebar-main-container">
            {hideButton ? "" : (
                <div className="sidebar-hide-container">
                    <Button icon="menu" />
                </div>
            )}
            <div className="sidebar-container">
                <div className="sidebar-top">
                    {data.top.map((value) => <Button icon={value.icon} content={value.text} onClick={value.onClick} />)}
                </div>
                <div className="sidebar-bottom">
                    <div className="sidebar-black-line"></div>
                    {data.bottom.map((value) => <Button icon={value.icon} content={value.text} onClick={value.onClick} />)}
                </div>
            </div>
        </div>
    )
}

export default Sidebar
