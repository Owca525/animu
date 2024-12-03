import Button from "../ui/icon-button"
import { SidebarProps } from "../../utils/interface"

const Sidebar: React.FC<SidebarProps> = ({ onButtonClick }) =>  {
  return (
    <div className="sidebar-mini">
      <div className="top-sidebar">
        <Button value="arrow_forward" />
        <div className="border"></div>
        <Button value="schedule" title="Recent Anime" className="active"/>
        <Button value="history" title="History" />
      </div>
      <div className="bottom-sidebar">
        <div className="border"></div>
        <Button value="extension" title="Extension" />
        <Button value="settings" title="Settings" />
      </div>
    </div>
  );
};

export default Sidebar;