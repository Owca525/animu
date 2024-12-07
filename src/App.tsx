import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/home"
import { Settings } from "./pages/settings/index";
import { Player } from "./pages/player";

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Home/>}/>
          <Route path="/player" element={<Player/>}/>
          <Route path="/settings" element={<Settings/>}/>
        </Routes>
      </Router>
    </div>
  )
}

export default App;
