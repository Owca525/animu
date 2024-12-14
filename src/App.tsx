import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import { Settings } from "./pages/settings";
import { Player } from "./pages/player";
import { useEffect } from "react";
import { checkConfig } from "./utils/config";

function App() {
  useEffect(() => {
    checkConfig()
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
