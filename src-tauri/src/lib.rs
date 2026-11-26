mod config;
mod env;
mod error;
mod fs;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let result = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(fs::Workspace::default())
        .invoke_handler(tauri::generate_handler![
            config::load_settings,
            config::save_settings,
            env::get_environment,
            fs::open_folder,
            fs::list_dir,
            fs::read_file,
            fs::write_file
        ])
        .run(tauri::generate_context!());
    if let Err(error) = result {
        eprintln!("failed to run Alchemide: {error}");
        std::process::exit(1);
    }
}
