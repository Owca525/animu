const { invoke } = window.__TAURI__.core;

async function greet() {
  document.getElementById("text").innerHTML = await invoke("get_search", { name: "Oshi no ko" });
}

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("search_button").addEventListener("click", function() {
    greet();
  });
});
