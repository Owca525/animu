import { useNavigate } from "react-router-dom";
import { open } from '@tauri-apps/plugin-shell';
import { appConfigDir } from "@tauri-apps/api/path";
import { useEffect, useRef, useState } from "react";

import { readConfig, saveConfig } from "../utils/config";
import { SettingsConfig } from "../utils/interface";
import Sidebar from "../components/elements/sidebar";
import Checkbox from "../components/ui/checkbox";
import Keybind from "../components/dialogs/keybind";

import "../css/pages/settings.css";
import { useTranslation } from "react-i18next";

const Settings = () => {
  const navigate = useNavigate();

  const {t} = useTranslation();

  const [settingPage, setsettingPage] = useState<string>("general");
  const [config, setConfig] = useState<SettingsConfig | undefined>(undefined);
  const [isLoading, setisLoading] = useState<boolean>(true);
  const generalRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  const sidebarSettingsTopData = [
    {
      value: '<div class="material-symbols-outlined text-button">manufacturing</div>' + t("settings.sidebar.General"),
      class: "icon-button",
      title: t("settings.sidebar.General"),
      onClick: async () => setsettingPage("general"),
    },
    {
      value: '<div class="material-symbols-outlined text-button">movie</div>' + t("settings.sidebar.Player"),
      class: "icon-button",
      title: t("settings.sidebar.Player"),
      onClick: async () => setsettingPage("player"),
    },
  ];

  const sidebarSettingsBottomData = [
    {
      value: '<div class="material-symbols-outlined text-button">folder</div>' + t("settings.sidebar.ConfigFolder"),
      class: "icon-button",
      title: t("settings.sidebar.ConfigFolder"),
      onClick: async () => await open(await appConfigDir())
    },
    {
      value: '<div class="material-symbols-outlined text-button">home</div>' + t("settings.sidebar.Home"),
      class: "icon-button",
      title: t("settings.sidebar.Home"),
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

  const getKeybind = (key: string) => {
    if (key == " ") return "Space"
    if (key.length == 1) return key.toUpperCase()
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

  return isLoading ? (
    <div className="settings-container">
      <Sidebar top={sidebarSettingsTopData} bottom={sidebarSettingsBottomData} class="sidebar-first" onlyMax={true} showVersion={true} />
      <div className="settings-content settings-loading">
        <div className="loading settings-loading-animation material-symbols-outlined">
          progress_activity
        </div>
      </div>
    </div>
  ) : (
    <div className="settings-container">
      <Sidebar top={sidebarSettingsTopData} bottom={sidebarSettingsBottomData} class="sidebar-first" onlyMax={true} showVersion={true} />
      {settingPage == "general" && config ? (
        <div className="settings-content">
          <div className="settings-header">{t("settings.headers.general")}</div>
          <div className="settings-general" ref={generalRef} >
            <div className="settings-space">
              <div className="text">{t("settings.general.Sidebar")}</div>
              <Checkbox title={t("settings.general.HoverSidebar")} checked={config.General.SideBar.HoverSidebar} onClick={(event) => handleChange("General.SideBar.HoverSidebar", event.currentTarget.checked)} />
            </div>
            <div className="settings-space">
              <div className="text">{t("settings.general.Window")}</div>
              <Checkbox title={t("settings.general.AutoMaximize")} checked={config.General.Window.AutoMaximize} onClick={(event) => handleChange("General.Window.AutoMaximize", event.currentTarget.checked)} />
              <Checkbox title={t("settings.general.AutoFullscreen")} checked={config.General.Window.AutoFullscreen} onClick={(event) => handleChange("General.Window.AutoFullscreen", event.currentTarget.checked)} />
              <div className="same-space" style={{ marginTop: "10px" }}>
                {t("settings.general.Zoom")} <input type="text" className="number" placeholder="1.0" value={config.General.Window.Zoom} onChange={(event) => handleChange("General.Window.Zoom", event.currentTarget.value)} />
              </div>
            </div>
          </div>
        </div>
      ) : ""}
      {settingPage == "player" && config ? (
        <div className="settings-content">
          <div className="settings-header">{t("settings.headers.player")}</div>
          <div className="settings-general" ref={playerRef}>
            <div className="settings-space">
              <div className="text">{t("settings.sidebar.General") + ":"}</div>
              <Checkbox title={t("settings.player.autoPlay")} classContainer="small-text" checked={config.Player.general.Autoplay} onClick={(event) => handleChange("Player.general.Autoplay", event.currentTarget.checked)} />
              <Checkbox title={t("settings.general.AutoFullscreen")} classContainer="small-text" checked={config.Player.general.AutoFullscreen} onClick={(event) => handleChange("Player.general.AutoFullscreen", event.currentTarget.checked)} />
              <div className="same-space" style={{ marginTop: "10px" }}>
                {t("settings.player.DefaultVolume")} <input type="text" className="number" placeholder="25" value={config.Player.general.Volume} onChange={(event) => handleChange("Player.general.Volume", event.currentTarget.value)} />
              </div>
              <div className="same-space">
                {t("settings.player.LongTimeSkipForward")} <input type="text" value={config.Player.general.LongTimeSkipForward} className="number" placeholder="80" onChange={(event) => handleChange("Player.general.LongTimeSkipForward", event.currentTarget.value)} />
              </div>
              <div className="same-space">
                {t("settings.player.LongTimeSkipBack")} <input type="text" value={config.Player.general.LongTimeSkipBack} className="number" placeholder="80" onChange={(event) => handleChange("Player.general.LongTimeSkipBack", event.currentTarget.value)} />
              </div>
              <div className="same-space">
                {t("settings.player.TimeSkipForward")} <input type="text" value={config.Player.general.TimeSkipRight} className="number" placeholder="5" onChange={(event) => handleChange("Player.general.TimeSkipRight", event.currentTarget.value)} />
              </div>
              <div className="same-space">
                {t("settings.player.TimeSkipBack")} <input type="text" value={config.Player.general.TimeSkipLeft} className="number" placeholder="5" onChange={(event) => handleChange("Player.general.TimeSkipLeft", event.currentTarget.value)} />
              </div>
            </div>
            <div className="settings-space">
              <div className="text">{t("sidebar.History") + ":"}</div>
              <div className="same-space">
                {t("settings.player.MinimalTimeSave")} <input type="text" value={config.Player.History.MinimalTimeSave} className="number" placeholder="5" onChange={(event) => handleChange("Player.History.MinimalTimeSave", event.currentTarget.value)} />
              </div>
              <div className="same-space">
                {t("settings.player.MaximizeTimeSave")} <input type="text" value={config.Player.History.MaximizeTimeSave} className="number" placeholder="5" onChange={(event) => handleChange("Player.History.MaximizeTimeSave", event.currentTarget.value)} />
              </div>
            </div>
            <div className="settings-space">
              <div className="text">{t("settings.player.Keybinds")}</div>
              <Keybind title={t("settings.player.Pause")} value={getKeybind(config.Player.keybinds.Pause)} changeKey={(key) => handleChange("Player.keybinds.Pause", key)} />
              <Keybind title={t("settings.player.Fullscreen")} value={getKeybind(config.Player.keybinds.Fullscreen)} changeKey={(key) => handleChange("Player.keybinds.Fullscreen", key)} />
              <Keybind title={t("settings.player.ExitPlayer")} value={getKeybind(config.Player.keybinds.ExitPlayer)} changeKey={(key) => handleChange("Player.keybinds.ExitPlayer", key)} />
              <Keybind title={t("settings.player.LongTimeSkipForward")} value={getKeybind(config.Player.keybinds.LongTimeSkipForward)} changeKey={(key) => handleChange("Player.keybinds.LongTimeSkipForward", key)} />
              <Keybind title={t("settings.player.LongTimeSkipBack")} value={getKeybind(config.Player.keybinds.LongTimeSkipBack)} changeKey={(key) => handleChange("Player.keybinds.LongTimeSkipBack", key)} />
              <Keybind title={t("settings.player.TimeSkipForward")} value={getKeybind(config.Player.keybinds.TimeSkipRight)} changeKey={(key) => handleChange("Player.keybinds.TimeSkipRight", key)} />
              <Keybind title={t("settings.player.TimeSkipBack")} value={getKeybind(config.Player.keybinds.TimeSkipLeft)} changeKey={(key) => handleChange("Player.keybinds.TimeSkipLeft", key)} />
            </div>
          </div>
        </div>
      ) : ""}
    </div>
  )
};

export default Settings;