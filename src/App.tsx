import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import { Settings } from "./pages/settings";
import { Player } from "./pages/player";
import { useEffect } from "react";
import { checkConfig, readConfig } from "./utils/config";

function App() {
  const changeScale = async () => {
    const config = await readConfig();
    document.body.style.transform = `scale(${config?.General.windows.Scale})`
    document.body.style.transformOrigin = 'top left';
  }
  useEffect(() => {
    checkConfig()
    changeScale()
  })
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
