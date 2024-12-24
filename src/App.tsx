import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { getVersion, setTheme } from "@tauri-apps/api/app";
import { useTranslation } from "react-i18next";
import 'material-symbols';

// Pages
import Home from "./pages/home";
import Settings from "./pages/settings";
import Player from "./pages/player";

// config
import { checkConfig, readConfig } from "./utils/config";
import { CheckContinue } from "./utils/continueWatch";
import { configContext } from "./utils/context";
import { SettingsConfig } from "./utils/interface";

// Color palette
import "./css/colors/purpleAnimu.css"
import "./css/colors/gruvbox.css"
import "./css/colors/catppuccin.css"

function App() {
  const [configIsLoading, setConfigIsLoading] = useState<boolean>(true)
  const [config, setConfig] = useState<SettingsConfig | undefined>(undefined)

  const { i18n } = useTranslation();

  const loadConfig = useCallback(async () => {
    await getCurrentWindow().setTitle("Animu v" + await getVersion())
    await checkConfig();
    const config = await readConfig()
    setConfig(config)

    const container = document.querySelector("#root")
    if (container && config) {
      container.className = config.General.color
    }

    if (config && config.General.Window.AutoMaximize) {
      await getCurrentWindow().maximize()
    }
    if (config && config.General.Window.AutoFullscreen) {
      await getCurrentWindow().setFullscreen(config.General.Window.AutoFullscreen)
    }
    if (config) {
      i18n.changeLanguage(config.General.language)
      await getCurrentWebview().setZoom(parseFloat(config.General.Window.Zoom.toString()))
    }

    setConfigIsLoading(false)
  }, [])

  useEffect(() => {
    CheckContinue()
    setTheme("dark")
  }, [])

  // Load config
  useEffect(() => {
    loadConfig();
  }, [loadConfig])

  return configIsLoading ? (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <div className="loading material-symbols-outlined">progress_activity</div>
    </div>
  ) : (
    <configContext.Provider value={config}>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/player" element={<Player />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Router>
    </configContext.Provider>
  );
}

export default App;
