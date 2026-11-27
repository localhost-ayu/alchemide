mod assets;
mod config;
mod env;
mod error;
mod fs;
mod links;
mod terminal;
mod themes;
mod updater;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let result = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(updater::PendingUpdate::default())
        .manage(fs::Workspace::default())
        .manage(fs::Searches::default())
        .manage(terminal::Terminals::default())
        .invoke_handler(tauri::generate_handler![
            assets::asset_path,
            assets::import_asset,
            config::load_settings,
            config::save_settings,
            env::get_environment,
            fs::open_folder,
            fs::list_dir,
            fs::list_files,
            fs::read_file,
            fs::replace_matches,
            fs::search_start,
            fs::write_file,
            links::open_external,
            terminal::terminal_open,
            terminal::terminal_profiles,
            terminal::terminal_write,
            terminal::terminal_resize,
            terminal::terminal_close,
            themes::delete_user_theme,
            themes::list_user_themes,
            themes::save_user_theme,
            updater::check_update,
            updater::install_update
        ])
        .run(tauri::generate_context!());
    if let Err(error) = result {
        eprintln!("failed to run Alchemide: {error}");
        std::process::exit(1);
    }
}
