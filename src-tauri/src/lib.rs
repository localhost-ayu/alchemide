mod assets;
mod config;
mod docker;
mod env;
mod error;
mod fs;
mod links;
mod lsp;
mod snippets;
mod terminal;
mod themes;
mod updater;
mod vscode_themes;
mod zoom;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let result = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(updater::PendingUpdate::default())
        .manage(fs::Workspace::default())
        .manage(fs::Searches::default())
        .manage(terminal::Terminals::default())
        .manage(lsp::LanguageServers::default())
        .invoke_handler(tauri::generate_handler![
            assets::asset_path,
            assets::import_asset,
            config::load_settings,
            config::save_settings,
            env::get_environment,
            fs::list_dir,
            fs::list_files,
            fs::open_folder,
            fs::pick_file,
            fs::read_file,
            fs::replace_matches,
            fs::search_start,
            fs::write_file,
            links::open_external,
            lsp::lsp_send,
            lsp::lsp_start,
            lsp::lsp_stop,
            snippets::import_vscode_snippets,
            snippets::list_user_snippets,
            terminal::terminal_close,
            terminal::terminal_open,
            docker::docker_containers,
            docker::docker_action,
            terminal::terminal_profiles,
            terminal::terminal_resize,
            terminal::terminal_write,
            themes::delete_user_theme,
            themes::export_theme,
            themes::import_theme,
            themes::list_user_themes,
            themes::save_user_theme,
            updater::check_update,
            updater::install_update,
            vscode_themes::list_vscode_themes,
            vscode_themes::load_vscode_theme,
            vscode_themes::pick_vscode_theme,
            zoom::set_zoom
        ])
        .run(tauri::generate_context!());
    if let Err(error) = result {
        eprintln!("failed to run Alchemide: {error}");
        std::process::exit(1);
    }
}
