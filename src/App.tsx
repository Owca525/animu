import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { getCurrentWebview } from '@tauri-apps/api/webview';
import 'material-symbols';

// Pages
import Home from "./pages/home";
import Settings from "./pages/settings";
import Player from "./pages/player";

// config
import { checkConfig, readConfig } from "./utils/config";
import { CheckHistory } from "./utils/history";

function App() {
  const [configIsLoading, setConfigIsLoading] = useState<boolean>(true)

  useEffect(() => {
    checkConfig().then(() => setConfigIsLoading(false))
    CheckHistory()
  })

  const loadConfig = useCallback(async () => {
    const cfg = await readConfig();
    if (cfg && cfg.General.Window.AutoMaximize) {
      await getCurrentWindow().maximize()
    }
    if (cfg && cfg.General.Window.AutoFullscreen) {
      await getCurrentWindow().setFullscreen(cfg.General.Window.AutoFullscreen)
    }
    if (cfg) {
      await getCurrentWebview().setZoom(parseFloat(cfg.General.Window.Zoom.toString()))
    }
  }, [])

  // Load config
  useEffect(() => {
    loadConfig();
  }, [loadConfig])

  if (configIsLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div className="loading material-symbols-outlined">progress_activity</div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/player" element={<Player />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}

export default App;
