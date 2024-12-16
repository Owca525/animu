import { useNavigate } from "react-router-dom";
// import Button from "../components/ui/button";
import "../css/pages/settings.css";
import Sidebar from "../components/elements/sidebar";
import { useEffect, useRef, useState } from "react";
import Checkbox from "../components/ui/checkbox";
import Keybind from "../components/dialogs/keybind";
import { readConfig, saveConfig } from "../utils/config";
import { SettingsConfig } from "../utils/interface";
// import { readConfig } from "../utils/config";

export const Settings = () => {
  const navigate = useNavigate();
  const [settingPage, setsettingPage] = useState<string>("general");
  const [config, setConfig] = useState<SettingsConfig | undefined>(undefined);
  const [isLoading, setisLoading] = useState<boolean>(true);
  const generalRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  const sidebarSettingsTopData = [
    {
      value: '<div class="material-symbols-outlined text-button">manufacturing</div>General',
      class: "icon-button",
      title: "General",
      onClick: async () => setsettingPage("general"),
    },
    {
      value: '<div class="material-symbols-outlined text-button">movie</div>Player',
      class: "icon-button",
      title: "Player",
      onClick: async () => setsettingPage("player"),
    },
  ];

  const sidebarSettingsBottomData = [
    {
      value: '<div class="material-symbols-outlined text-button">folder</div>Config Folder',
      class: "icon-button",
      title: "Config Folder",
    },
    {
      value: '<div class="material-symbols-outlined text-button">home</div>Home',
      class: "icon-button",
      title: "Home",
      onClick: async () => navigate("/"),
    },
  ];

  useEffect(() => {
    readConfig().then((tmpConfig) => {
      setConfig(tmpConfig);
    });
  }, []);


  useEffect(() => {
    saveConfig(config);
    if (config !== undefined) {
      setisLoading(false)
    }

  }, [config]);

  if (isLoading) {
    return (
      <div className="settings-container">
        <Sidebar top={sidebarSettingsTopData} bottom={sidebarSettingsBottomData} class="sidebar-first" onlyMax={true} showVersion={true} />
        <div className="settings-content settings-loading">
          <div className="loading settings-loading-animation material-symbols-outlined">
            progress_activity
          </div>
        </div>
      </div>
    )
  }

  const getKeybind = (key: any) => {
    if (key == " ") {
      return "space"
    } 
    return key
  }

  const handleChange = (path: string, value: string | number | boolean) => {
    setConfig((prevConfig) => {
      if (!prevConfig) return prevConfig;
  
      const keys = path.split(".");
      const newConfig = { ...prevConfig };

      let current: any = newConfig;
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];

        if (!current[key]) {
          current[key] = {};
        }
        current = current[key];
      }

      current[keys[keys.length - 1]] = value;
  
      return newConfig;
    });
  };

  if (settingPage == "general" && config) {
    return (
      <div className="settings-container">
        <Sidebar top={sidebarSettingsTopData} bottom={sidebarSettingsBottomData} class="sidebar-first" onlyMax={true} showVersion={true} />
        <div className="settings-content">
          <div className="settings-header">General Settings</div>
          <div className="settings-general" ref={generalRef} >
            <div className="settings-space">
              <div className="text">Sidebar:</div>
              <Checkbox title="Hover Sidebar" checked={config.General.SideBar.HoverSidebar} onClick={(event) => handleChange("General.SideBar.HoverSidebar", event.currentTarget.checked)}/>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (settingPage == "player" && config) {
    return (
      <div className="settings-container">
        <Sidebar top={sidebarSettingsTopData} bottom={sidebarSettingsBottomData} class="sidebar-first" onlyMax={true} showVersion={true} />
        <div className="settings-content">
          <div className="settings-header">Player Settings</div>
          <div className="settings-general" ref={playerRef}>
            <div className="settings-space">
              <div className="text">General:</div>
              <Checkbox title="AutoPlay" classContainer="small-text" checked={config.Player.general.Autoplay} onClick={(event) => handleChange("Player.general.Autoplay", event.currentTarget.checked)}/>
              <div className="same-space">
                Default Volume <input type="text" className="number" placeholder="25" value={config.Player.general.Volume} onChange={(event) => handleChange("Player.general.Volume", event.currentTarget.value)} />
              </div>

              <div className="same-space">
                Long Time Skip Forward <input type="text" value={config.Player.general.LongTimeSkipForward} className="number" placeholder="80" onChange={(event) => handleChange("Player.general.LongTimeSkipForward", event.currentTarget.value)} />
              </div>
              <div className="same-space">
                Long Time Skip Back <input type="text" value={config.Player.general.LongTimeSkipBack} className="number" placeholder="80" onChange={(event) => handleChange("Player.general.LongTimeSkipBack", event.currentTarget.value)} />
              </div>
              <div className="same-space">
                Time Skip Forward <input type="text" value={config.Player.general.TimeSkipRight} className="number" placeholder="5" onChange={(event) => handleChange("Player.general.TimeSkipRight", event.currentTarget.value)} />
              </div>
              <div className="same-space">
                Time Skip Back <input type="text" value={config.Player.general.TimeSkipLeft} className="number" placeholder="5" onChange={(event) => handleChange("Player.general.TimeSkipLeft", event.currentTarget.value)}/> 
              </div>
            </div>
            <div className="settings-space">
              <div className="text">Keybinds:</div>
              <Keybind title="Pause:" value={getKeybind(config.Player.keybinds.Pause)} changeKey={(key) => handleChange("Player.keybinds.Pause", key)} />
              <Keybind title="Fullscreen:" value={getKeybind(config.Player.keybinds.Fullscreen)} changeKey={(key) => handleChange("Player.keybinds.Fullscreen", key)} />
              <Keybind title="Exit Player:" value={getKeybind(config.Player.keybinds.ExitPlayer)} changeKey={(key) => handleChange("Player.keybinds.ExitPlayer", key)} />
              <Keybind title="Long Skip forward:" value={getKeybind(config.Player.keybinds.LongTimeSkipForward)} changeKey={(key) => handleChange("Player.keybinds.LongTimeSkipForward", key)} />
              <Keybind title="Long Skip Back:" value={getKeybind(config.Player.keybinds.LongTimeSkipBack)} changeKey={(key) => handleChange("Player.keybinds.LongTimeSkipBack", key)} />
              <Keybind title="Skip Forward:" value={getKeybind(config.Player.keybinds.TimeSkipRight)} changeKey={(key) => handleChange("Player.keybinds.TimeSkipRight", key)} />
              <Keybind title="Skip back:" value={getKeybind(config.Player.keybinds.TimeSkipLeft)} changeKey={(key) => handleChange("Player.keybinds.TimeSkipLeft", key)} />
            </div>
          </div>
        </div>
      </div>
    );
  }
};
