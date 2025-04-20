import Button from "./buttons"
import "./css/sidebar.css"

interface sidebarProps {

}

const Sidebar: React.FC<sidebarProps> = () => {
  return (
    <div className="sidebar-container">
        <Button content="tekst"/>
        <Button content="tekst"/>
        <Button content="tekst"/>
        <Button content="tekst"/>
        <Button content="tekst"/>
        <Button content="tekst"/>
        <Button content="tekst"/>
    </div>
  )
}

export default Sidebar
