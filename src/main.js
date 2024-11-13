const { invoke } = window.__TAURI__.core;

async function fetchData() {
  try {
    const input = document.getElementById('search_text')
    const name = input.value
    const response = await invoke('get_search', {"name": name});
    const cleanedJsonString = response.slice(1, -1);
    console.log(cleanedJsonString)
    // naprawić żeby dobrze konwertowało string do json
    const jsonObject = JSON.parse("{" + cleanedJsonString);
    console.log(jsonObject);
  } catch (error) {
    console.error(error);
  }
}

document.getElementById("search_button").addEventListener("click", function() {
  fetchData()
});