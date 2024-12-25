import { useNavigate } from "react-router-dom";
import { open } from '@tauri-apps/plugin-shell';
import { appConfigDir } from "@tauri-apps/api/path";
import { useEffect, useRef, useState } from "react";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { useTranslation } from "react-i18next";

// Components
import ContextMenu from "../components/elements/context-menu";
import Sidebar from "../components/elements/sidebar";
import Checkbox from "../components/ui/checkbox";
import Keybind from "../components/dialogs/keybind";
import Input from "../components/ui/input-settings"
import Dropdown from "../components/ui/dropdown";

// utils
import { readConfig, saveConfig } from "../utils/config";
import { SettingsConfig } from "../utils/interface";

import "../css/pages/settings.css";

const Settings = () => {
  const navigate = useNavigate();

  const { t, i18n } = useTranslation();

  const [settingPage, setsettingPage] = useState<string>("general");
  const [config, setConfig] = useState<SettingsConfig | undefined>(undefined);
  const [isLoading, setisLoading] = useState<boolean>(true);
  const generalRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  var sidebarSettingsTopData = [
    {
      value: '<div class="material-symbols-outlined text-button">manufacturing</div>' + t("settings.sidebar.General"),
      class: "icon-button " + checkCurrentPage("general"),
      title: t("settings.sidebar.General"),
      onClick: async () => setsettingPage("general"),
    },
    {
      value: '<div class="material-symbols-outlined text-button">movie</div>' + t("settings.sidebar.Player"),
      class: "icon-button " + checkCurrentPage("player"),
      title: t("settings.sidebar.Player"),
      onClick: async () => setsettingPage("player"),
    },
    {
      value: '<div class="material-symbols-outlined text-button">history</div>' + t("sidebar.History"),
      class: "icon-button " + checkCurrentPage("history"),
      title: t("sidebar.History"),
      onClick: async () => setsettingPage("history"),
    },
  ];

  var sidebarSettingsBottomData = [
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

  const language = [
    { label: t("lang.english"), value: "en", onClick: () => changeLang("en") },
    { label: t("lang.polish"), value: "pl", onClick: () => changeLang("pl") },
    { label: t("lang.hungary"), value: "hu", onClick: () => changeLang("hu") },
  ]

  const theme = [
    { label: "purpleAnimu", value: "purpleAnimu", onClick: () => changeTheme("purpleAnimu") },
    { label: "catppuccin", value: "catppuccin", onClick: () => changeTheme("catppuccin") },
    { label: "gruvbox", value: "gruvbox", onClick: () => changeTheme("gruvbox") },
  ]

  const menuItems = [
    { label: t("contextMenu.reload"), onClick: () => location.reload() }
  ];

  // const cardSize = [
  //   { label: t("settings.general.cards.small"), value: "small", onClick: () => console.log("purpleAnimu") },
  //   { label: t("settings.general.cards.medium"), value: "medium", onClick: () => console.log("catppuccin") },
  //   { label: t("settings.general.cards.big"), value: "big", onClick: () => console.log("gruvbox") },
  // ]

  function checkCurrentPage(page: string): string {
    if (page == settingPage) return "active"
    else return ""
  }

  useEffect(() => {
    readConfig().then((tmpConfig) => {
      setConfig(tmpConfig);
    });
  }, []);


  useEffect(() => {
    saveConfig(config);
    if (config !== undefined) {
      setisLoading(false)
      getCurrentWebview().setZoom(parseFloat(config.General.Window.Zoom.toString()))
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

      if (typeof value == "string") value = value.replace("s", "").replace("%", "")

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

  const changeTheme = (theme: string) => {
    handleChange("General.color", theme)
    const container = document.querySelector("#root")
    if (container && config) {
      container.className = theme
    }
  }

  const checkLang = (lang: string) => {
    for (let i = 0; i < language.length; i++) {
      const element = language[i];
      if (element.value == lang) return element.label
    }
    return ""
  }

  const changeLang = (lang: string) => {
    i18n.changeLanguage(lang)
    handleChange("General.language", lang)
  }

  return isLoading ? (
    <div className="settings-container">
      <ContextMenu items={menuItems} />
      <Sidebar top={sidebarSettingsTopData} bottom={sidebarSettingsBottomData} class="sidebar-first" onlyMax={true} showVersion={true} />
      <div className="settings-content settings-loading">
        <div className="loading settings-loading-animation material-symbols-outlined">
          progress_activity
        </div>
      </div>
    </div>
  ) : (
    <div className="settings-container">
      <ContextMenu items={menuItems} />
      <div className="settings-shadow-element"></div>
      <Sidebar top={sidebarSettingsTopData} bottom={sidebarSettingsBottomData} class="sidebar-first" onlyMax={true} showVersion={true} />
      {settingPage == "general" && config ? (
        <div className="settings-content">
          <div className="settings-general" ref={generalRef} >
            <div className="settings-space">
              <div className="text">{t("settings.sidebar.General")}</div>
              <Checkbox title={t("settings.general.HoverSidebar")} checked={config.General.HoverSidebar} onClick={(event) => handleChange("General.HoverSidebar", event.currentTarget.checked)} />
              <div className="border-settings"></div>
              <div className="same-space">
                {t("settings.general.language")} <Dropdown options={language} placeholder={checkLang(config.General.language)} />
              </div>
            </div>
            <div className="settings-space">
              <div className="text">{t("settings.general.theme")}</div>
              <div className="same-space">
                {t("settings.general.theme")}  <Dropdown options={theme} placeholder={config.General.color} />
              </div>
              {/* <div className="border-settings"></div>
              <div className="same-space">
                {t("settings.general.cardSize")}  <Dropdown options={cardSize} placeholder={config.General.cardSize} />
              </div> */}
            </div>
            <div className="settings-space">
              <div className="text">{t("settings.general.Window")}</div>
              <Checkbox helpDescription={t("tips.gAutoMaximize")} title={t("settings.general.AutoMaximize")} checked={config.General.Window.AutoMaximize} onClick={(event) => handleChange("General.Window.AutoMaximize", event.currentTarget.checked)} />
              <div className="border-settings"></div>
              <Checkbox helpDescription={t("tips.gAutoFullscreen")} title={t("settings.general.AutoFullscreen")} checked={config.General.Window.AutoFullscreen} onClick={(event) => handleChange("General.Window.AutoFullscreen", event.currentTarget.checked)} />
              <div className="border-settings"></div>
              <Input helpDescription={t("tips.gZoom")} title={t("settings.general.Zoom")} placeholder="1.0" value={config.General.Window.Zoom} type="" onChange={(event) => handleChange("General.Window.Zoom", event.currentTarget.value)} />
            </div>
          </div>
        </div>
      ) : ""}
      {settingPage == "history" && config ? (
        <div className="settings-content">
          <div className="settings-general" ref={playerRef}>
            <div className="settings-space">
              <div className="text">{t("sidebar.History")}</div>
              <Input title={t("settings.player.historysave")} placeholder="20" value={config.History.history.maxSave} type="" onChange={(event) => handleChange("History.history.maxSave", event.currentTarget.value)} />
            </div>
            <div className="settings-space">
              <div className="text">{t("sidebar.ContinueWatching")}</div>
              <Input helpDescription={t("tips.hContinueMinimal")} title={t("settings.player.MinimalTimeSave")} placeholder="5" value={config.History.continue.MinimalTimeSave} type="s" onChange={(event) => handleChange("History.continue.MinimalTimeSave", event.currentTarget.value)} />
              <div className="border-settings"></div>
              <Input helpDescription={t("tips.hContinueMax")} title={t("settings.player.MaximizeTimeSave")} placeholder="120" value={config.History.continue.MaximizeTimeSave} type="s" onChange={(event) => handleChange("History.continue.MaximizeTimeSave", event.currentTarget.value)} />
            </div>
          </div>
        </div>
      ) : ""}
      {settingPage == "player" && config ? (
        <div className="settings-content">
          <div className="settings-general" ref={playerRef}>
            <div className="settings-space">
              <div className="text">{t("settings.sidebar.General")}</div>
              <Checkbox title={t("settings.player.autoPlay")} checked={config.Player.general.Autoplay} onClick={(event) => handleChange("Player.general.Autoplay", event.currentTarget.checked)} />
              <div className="border-settings"></div>
              <Checkbox helpDescription={t("tips.pAutoFullscreen")} title={t("settings.general.AutoFullscreen")} checked={config.Player.general.AutoFullscreen} onClick={(event) => handleChange("Player.general.AutoFullscreen", event.currentTarget.checked)} />
              <div className="border-settings"></div>
              <Input helpDescription={t("tips.pSkip")} title={t("settings.player.DefaultVolume")} placeholder="25" value={config.Player.general.Volume} type="%" onChange={(event) => handleChange("Player.general.Volume", event.currentTarget.value)} />
              <div className="border-settings"></div>
              <Input helpDescription={t("tips.pSkip")} title={t("settings.player.LongTimeSkipForward")} placeholder="80" value={config.Player.general.LongTimeSkipForward} type="s" onChange={(event) => handleChange("Player.general.LongTimeSkipForward", event.currentTarget.value)} />
              <div className="border-settings"></div>
              <Input helpDescription={t("tips.pSkip")} title={t("settings.player.LongTimeSkipBack")} placeholder="80" value={config.Player.general.LongTimeSkipBack} type="s" onChange={(event) => handleChange("Player.general.LongTimeSkipBack", event.currentTarget.value)} />
              <div className="border-settings"></div>
              <Input helpDescription={t("tips.pSkip")} title={t("settings.player.TimeSkipForward")} placeholder="5" value={config.Player.general.TimeSkipRight} type="s" onChange={(event) => handleChange("Player.general.TimeSkipRight", event.currentTarget.value)} />
              <div className="border-settings"></div>
              <Input helpDescription={t("tips.pSkip")} title={t("settings.player.TimeSkipBack")} placeholder="5" value={config.Player.general.TimeSkipLeft} type="s" onChange={(event) => handleChange("Player.general.TimeSkipLeft", event.currentTarget.value)} />
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
              <Keybind title={t("settings.player.FrameSkipBack")} value={getKeybind(config.Player.keybinds.FrameSkipBack)} changeKey={(key) => handleChange("Player.keybinds.FrameSkipBack", key)} />
              <Keybind title={t("settings.player.FrameSkipForward")} value={getKeybind(config.Player.keybinds.FrameSkipForward)} changeKey={(key) => handleChange("Player.keybinds.FrameSkipForward", key)} />
              <Keybind title={t("settings.player.VolumeUP")} value={getKeybind(config.Player.keybinds.VolumeUp)} changeKey={(key) => handleChange("Player.keybinds.VolumeUp", key)} />
              <Keybind title={t("settings.player.VolumeDown")} value={getKeybind(config.Player.keybinds.VolumeDown)} changeKey={(key) => handleChange("Player.keybinds.VolumeDown", key)} />
            </div>
          </div>
        </div>
      ) : ""}
    </div>
  )
};

export default Settings;