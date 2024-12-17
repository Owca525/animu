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

#[tauri::command]
async fn get_recent_anime() -> Result<String, String> {
    allmanga::fetch_recent_anime().await
}

#[tauri::command]
async fn get_anime_data(id: &str) -> Result<String, String> {
    allmanga::extracting_anime_data(id).await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            get_search,
            get_anime_data,
            get_episode_url,
            get_recent_anime
        ])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
