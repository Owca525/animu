import { useNavigate } from "react-router-dom";
// import Button from "../components/ui/button";
import "../css/pages/settings.css";
import Sidebar from "../components/elements/sidebar";
import { useState } from "react";
import Checkbox from "../components/ui/checkbox";
import Keybind from "../components/dialogs/keybind";

export const Settings = () => {
  const navigate = useNavigate();
  const [settingPage, setsettingPage] = useState<string>("general");

  const sidebarSettingsTopData = [
    {
      value:
        '<div class="material-symbols-outlined text-button">manufacturing</div>General',
      class: "icon-button",
      title: "General",
      onClick: async () => setsettingPage("general"),
    },
    {
      value:
        '<div class="material-symbols-outlined text-button">movie</div>Player',
      class: "icon-button",
      title: "Player",
      onClick: async () => setsettingPage("player"),
    },
  ];

  const sidebarSettingsBottomData = [
    {
      value:
        '<div class="material-symbols-outlined text-button">folder</div>Folder Config',
      class: "icon-button",
      title: "Folder Config",
    },
    {
      value:
        '<div class="material-symbols-outlined text-button">home</div>Home',
      class: "icon-button",
      title: "Home",
      onClick: async () => navigate("/"),
    },
  ];

  if (settingPage == "general") {
    return (
      <div className="settings-container">
        <Sidebar
          top={sidebarSettingsTopData}
          bottom={sidebarSettingsBottomData}
          class="sidebar-first"
        />
        <div className="settings-content">
          <div className="settings-header">General</div>
          <div className="settings-general">
            <div className="settings-space">
              <div className="text">Sidebar:</div>
              <Checkbox title="Hover Sidebar" />
            </div>
            <div className="settings-space">
              <div className="text">Window:</div>
              <div className="same-space">
                Scale:
                <input
                  type="text"
                  value={1}
                  className="number"
                  placeholder="1"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (settingPage == "player") {
    return (
      <div className="settings-container">
        <Sidebar
          top={sidebarSettingsTopData}
          bottom={sidebarSettingsBottomData}
          class="sidebar-first"
        />
        <div className="settings-content">
          <div className="settings-header">Player</div>
          <div className="settings-general">
            <div className="settings-space">
              <div className="text">General:</div>
              <Checkbox title="AutoPlay" />
              <div className="same-space">
                Volume: 
                <input
                    type="text"
                    value={0.25}
                    className="number"
                    placeholder="1"
                    />
                %
              </div>
              <div className="same-space">
                Long Time Skip Forward
                <input
                    type="text"
                    value={80}
                    className="number"
                    placeholder="1"
                    />
              </div>
              <div className="same-space">
                Long Time Skip Back
                <input
                    type="text"
                    value={80}
                    className="number"
                    placeholder="1"
                    />
              </div>
              <div className="same-space">
                Time Skip Forward
                <input
                    type="text"
                    value={5}
                    className="number"
                    placeholder="1"
                    />
              </div>
              <div className="same-space">
                Time Skip Back
                <input
                    type="text"
                    value={5}
                    className="number"
                    placeholder="1"
                    />
              </div>
            </div>
            <div className="settings-space">
              <div className="text">Keybinds:</div>
              <Keybind title="Pause:" value="Space" changeKey={() => console.log()}/>
              <Keybind title="Fullscreen:" value="F" changeKey={() => console.log()}/>
              <Keybind title="Exit Player:" value="ESC" changeKey={() => console.log()}/>
              <Keybind title="Long Skip forward:" value="ArrowUp" changeKey={() => console.log()}/>
              <Keybind title="Long Skip Back:" value="ArrowDown" changeKey={() => console.log()}/>
              <Keybind title="Skip Forward:" value="ArrowLeft" changeKey={() => console.log()}/>
              <Keybind title="Skip back:" value="ArrowRight" changeKey={() => console.log()}/>
            </div>
          </div>
        </div>
      </div>
    );
  }
};
