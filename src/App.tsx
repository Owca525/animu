import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import 'material-symbols';

// Pages
import Home from "./pages/home";
import Settings from "./pages/settings";
import Player from "./pages/player";

// config
import { checkConfig, readConfig } from "./utils/config";

function App() {
  const [configIsLoading, setConfigIsLoading] = useState<boolean>(true)

  useEffect(() => {
    checkConfig().then(() => setConfigIsLoading(false))
  })

  const loadConfig = useCallback(async () => {
    const cfg = await readConfig();
    if (cfg && cfg.General.Window.AutoMaximize) {
      await getCurrentWindow().maximize()
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
