import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { getVersion } from "@tauri-apps/api/app";
import 'material-symbols';

// Pages
import Home from "./pages/home";
import Settings from "./pages/settings";
import Player from "./pages/player";

// config
import { checkConfig, readConfig } from "./utils/config";
import { CheckHistory } from "./utils/history";
import { configContext } from "./utils/context";
import { SettingsConfig } from "./utils/interface";

// Color palette
import "./css/colors/purpleAnimu.css"
import { useTranslation } from "react-i18next";

function App() {
  const [configIsLoading, setConfigIsLoading] = useState<boolean>(true)
  const [config, setConfig] = useState<SettingsConfig | undefined>(undefined)

  const { i18n } = useTranslation();

  const loadConfig = useCallback(async () => {
    await getCurrentWindow().setTitle("Animu v" + await getVersion())
    await checkConfig();
    setConfig(await readConfig());
    const config = await readConfig()
    
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
    CheckHistory()
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
