
mod allmanga;

// Z poziomu Frontend jest odbierany tekst w formie zmiennej "name" a potem uruchamia get_search gdzie zwraca dane znowu do frontend
#[tauri::command]
async fn get_search(name: &str) -> Result<String, String> {
    allmanga::get_search_anime(name).await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_search])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
