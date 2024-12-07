import Button from "../ui/icon-button"
import { SidebarProps } from "../../utils/interface"
import { get_recent } from "../../utils/backend"
import "../../css/elements/sidebar.css"
import { Link, useNavigate } from "react-router-dom";
// className="active"

const Sidebar: React.FC<SidebarProps> = ({ change_content }) =>  {
  const navigate = useNavigate();
  
  return (
    <div className="sidebar-mini">
      <div className="top-sidebar">
        <Button value="arrow_forward" />
        <div className="border"></div>
        <Button value="schedule" title="Recent Anime" onClick={async () => change_content({ title: "Recent Anime", data: await get_recent() })}/>
        <Button value="history" title="History" onClick={() => change_content({ title: "History" })}/>
      </div>
      <div className="bottom-sidebar">
        <div className="border"></div>
        <Button value="extension" title="Extension" onClick={() => console.log("asdasdasd")} />
        <Link to={"/settings"}>
          <Button value="settings" title="Settings" onClick={() => navigate("/settings")} />
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;