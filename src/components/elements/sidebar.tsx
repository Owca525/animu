import Button from "../ui/button";
import { SidebarProps } from "../../utils/interface";
import "../../css/elements/sidebar.css";
import { useEffect, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";

const Sidebar: React.FC<SidebarProps> = ({ class: className, top, bottom, onlyMax = false, showVersion = false, sidebarHover = true }) => {
  const [isMaxSidebar, setIsMaxSidebar] = useState(false);
  const [version, setversion] = useState<any>();

  const changeClass = () => {
    if (onlyMax) {
      return "sidebar-max " + className
    }
    if (isMaxSidebar) {
      return "sidebar-max " + className
    } else {
      return "sidebar-mini " + className
    }
  }

  const changeClassButton = () => {
    if (onlyMax) {
      return "icon-text"
    }
    if (isMaxSidebar) {
      return "icon-text"
    } else {
      return "icon"
    }
  }

  const getAndSetVersion = async () => {
    setversion(await getVersion())
  }

  useEffect(() => {
    getAndSetVersion();
  }, [])

  const setMax = () => {
    if (isMaxSidebar) {
      setIsMaxSidebar(false)
    }
    if (!isMaxSidebar && sidebarHover) {
      setIsMaxSidebar(true)
    }
  }

  return (
    <div className={changeClass()} onMouseEnter={() => setMax()} onMouseLeave={() => setMax()}>
      <div className="top-sidebar">
        {showVersion && (
          <div className="sidebar-version">Animu v{version}</div>
        )}
        {!onlyMax && (
          <Button
            value={
              isMaxSidebar
                ? '<div class="material-symbols-outlined text-button">arrow_back</div>Minimize'
                : '<div class="material-symbols-outlined text-button">arrow_forward</div>'
            }
            className="icon-button"
            title={isMaxSidebar ? "Minimize" : "Maximize"}
            type={isMaxSidebar ? "icon-text" : "icon"}
            onClick={() => setIsMaxSidebar((prevState) => !prevState)}
          />
        )}
        {!onlyMax && (
          <div className="border"></div>
        )}
        {top.length > 0
          ? top.map((button) => (
            <Button
              value={button.value}
              className={button.class}
              title={button.title}
              type={changeClassButton()}
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
              type={changeClassButton()}
              onClick={button.onClick}
            />
          ))
          : ""}
      </div>
    </div>
  );
};

export default Sidebar;
