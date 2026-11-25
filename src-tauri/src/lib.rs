mod env;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let result = tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![env::get_environment])
        .run(tauri::generate_context!());
    if let Err(error) = result {
        eprintln!("failed to run Alchemide: {error}");
        std::process::exit(1);
    }
}
