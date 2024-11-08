mod allmanga;

#[tauri::command]
fn get_search(name: &str) -> String {
    let mut string = String::new();
    match allmanga::get_anime_search(name) {
        Ok(json) => {
            string = json.to_string();
        },
        Err(e) => println!("Błąd: {}", e),
    }
    format!("{}", string)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![get_search])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
