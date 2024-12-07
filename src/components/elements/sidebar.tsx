import Button from "../ui/button"
import { SidebarProps } from "../../utils/interface"
import { get_recent } from "../../utils/backend"
import "../../css/elements/sidebar.css"
import { useNavigate } from "react-router-dom";
// className="active"

const Sidebar: React.FC<SidebarProps> = ({ change_content }) =>  {
  const navigate = useNavigate();
  
  return (
    <div className="sidebar-mini">
      <div className="top-sidebar">
        <Button value='<div class="material-symbols-outlined text-button">arrow_forward</div>' className="icon-button" />
        <div className="border"></div>
        <Button value='<div class="material-symbols-outlined text-button">schedule</div>' className="icon-button" title="Recent Anime" onClick={async () => change_content({ title: "Recent Anime", data: await get_recent() })}/>
        <Button value='<div class="material-symbols-outlined text-button">history</div>' className="icon-button" title="History" onClick={() => change_content({ title: "History" })}/>
      </div>
      <div className="bottom-sidebar">
        <div className="border"></div>
        <Button value='<div class="material-symbols-outlined text-button">extension</div>' className="icon-button" title="Extension" onClick={() => console.log("asdasdasd")} />
        <Button value='<div class="material-symbols-outlined text-button">settings</div>' className="icon-button" title="Settings" onClick={() => navigate("/settings")} />
      </div>
    </div>
  );
};

export default Sidebar;