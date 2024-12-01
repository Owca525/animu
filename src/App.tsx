// import { useState } from "react";
// import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import Sidebar from "./components/elements/sidebar";
import Header from "./components/elements/headers";
import Content from "./components/elements/content";

function App() {
  return (
    <main className="container">
      <Sidebar />
      <Header />
      <Content />
    </main>
  );
}

export default App;
