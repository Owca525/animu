// import { useState } from "react";
// import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import Sidebar from "./components/elements/sidebar";
import Header from "./components/elements/headers";
import Content from "./containers/main-content";

function App() {
  const customData = [
    { title: 'Title', img: 'img/url/src' },
  ];

  return (
    <main className="container">
      <Sidebar />
      <Header />
      <Content title="Recent Anime" data={customData} />
    </main>
  );
}

export default App;
