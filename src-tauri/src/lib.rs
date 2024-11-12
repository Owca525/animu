
mod allmanga;

#[tauri::command]
async fn get_search(name: &str) -> Result<String, String> {
    allmanga::get_search(name).await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_search])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
