import { Routes, Route, HashRouter } from 'react-router-dom'
import { Suspense } from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css';
import 'material-symbols'

import Home from "./pages/home/index"
import Information from "./pages/information/index"

// Temporally
import "./themes/DarkAnimu.css"

function App() {
  return (
    <>
      <ToastContainer />
      <HashRouter>
        <Suspense fallback={AppLoading()}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/info" element={<Information />} />
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

export default App
