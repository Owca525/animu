import { Routes, Route, HashRouter } from 'react-router-dom'
import { Suspense } from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css';
import 'material-symbols'

import Home from "./pages/home/index"
import Information from "./pages/information/index"
import Settings from "./pages/settings/index"
import Player from "./pages/player/index"

// Temporally
import "./themes/DarkAnimu.css"
import { checkConfig, readConfig } from './utils/config';
import store from './utils/store';

import "./utils/i18n"

LoadConfig()

function App() {
  return (
    <>
      <ToastContainer />
      <HashRouter>
        <Suspense fallback={AppLoading()}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/info" element={<Information />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/player" element={<Player />} />
          </Routes>
        </Suspense>
      </HashRouter>
    </>
  )
}

function AppLoading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="loading material-symbols-outlined">progress_activity</div>
    </div>
  )
}

async function LoadConfig() {
  if (!await checkConfig()) return
  const loadedConnfig = await readConfig()

  // Loading theme
  const link = document.createElement('link');
  link.id = 'theme-stylesheet';
  link.rel = 'stylesheet';
  document.head.appendChild(link);

  store.dispatch({ type: "setConfig", payload: loadedConnfig })
}

export default App
