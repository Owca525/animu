import Button from "../ui/button";
import { SidebarProps } from "../../utils/interface";
import "../../css/elements/sidebar.css";
import { useState } from "react";

const Sidebar: React.FC<SidebarProps> = ({ top, bottom }) => {

  const [isMaxSidebar, setIsMaxSidebar] = useState(false);

  return (
    <div className={isMaxSidebar ? "sidebar-max" : "sidebar-mini"} onMouseEnter={() => setIsMaxSidebar(true)} onMouseLeave={() => setIsMaxSidebar(false)}>
      <div className="top-sidebar">
        <Button
          value={isMaxSidebar ? '<div class="material-symbols-outlined text-button">arrow_back</div>Minimize' : '<div class="material-symbols-outlined text-button">arrow_forward</div>'}
          className="icon-button"
          title={isMaxSidebar ? "Minimize" : "Maximize"}
          type={isMaxSidebar ? "icon-text" : "icon"}
          onClick={() => setIsMaxSidebar((prevState) => !prevState)}
        />
        <div className="border"></div>
        {top.length > 0
          ? top.map((button) => (
              <Button
                value={button.value}
                className={button.class}
                title={button.title}
                type={isMaxSidebar ? "icon-text" : "icon"}
                onClick={button.onClick}
              />
            ))
          : ""}
      </div>
      <div className="bottom-sidebar">
        <div className="border"></div>
        {bottom.length > 0
          ? bottom.map((button) => (
              <Button
                value={button.value}
                className={button.class}
                title={button.title}
                type={isMaxSidebar ? "icon-text" : "icon"}
                onClick={button.onClick}
              />
            ))
          : ""}
      </div>
    </div>
  );
};

export default Sidebar;
