import Button from "../ui/icon-button"
import { SidebarProps } from "../../utils/interface"
import { get_recent } from "../../utils/backend"
import "../../css/elements/sidebar.css"
import { Link } from "react-router-dom";
// className="active"

const Sidebar: React.FC<SidebarProps> = ({ onButtonClick }) =>  {
  return (
    <div className="sidebar-mini">
      <div className="top-sidebar">
        <Button value="arrow_forward" />
        <div className="border"></div>
        <Button value="schedule" title="Recent Anime" onClick={async () => onButtonClick({ title: "Recent Anime", data: await get_recent() })}/>
        <Button value="history" title="History" onClick={() => onButtonClick({ title: "History" })}/>
      </div>
      <div className="bottom-sidebar">
        <div className="border"></div>
        <Button value="extension" title="Extension" onClick={() => console.log("asdasdasd")} />
        <Link to={"/settings"}>
          <Button value="settings" title="Settings" onClick={() => console.log("asdasd")} />
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;