
mod allmanga;

// Z poziomu Frontend jest odbierany tekst w formie zmiennej "name" a potem uruchamia get_search gdzie zwraca dane znowu do frontend
#[tauri::command]
async fn get_search(name: &str) -> Result<String, String> {
    allmanga::get_search_anime(name).await
}

#[tauri::command]
async fn get_episode_url(id: &str, ep: &str) -> Result<String, String> {
    allmanga::extracting_urls(id, ep).await
}

// Wymagane jest danie id anime i powinno zwrócić dict z listą odcinków
#[tauri::command]
async fn get_anime_data(id: &str) -> Result<String, String> {
    allmanga::extracting_anime_data(id).await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_search, get_anime_data, get_episode_url])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
