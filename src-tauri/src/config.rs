use std::path::{Path, PathBuf};

use serde_json::{Map, Value};

use crate::error::{Error, Result};

const FILE_NAME: &str = "settings.json";

pub fn config_dir() -> Result<PathBuf> {
    dirs::config_dir()
        .map(|dir| dir.join("alchemide"))
        .ok_or(Error::NoConfigDir)
}

pub fn parse_settings(text: Option<&str>) -> Value {
    text.and_then(|text| serde_json::from_str::<Value>(text).ok())
        .filter(Value::is_object)
        .unwrap_or_else(|| Value::Object(Map::new()))
}

pub fn write_settings(dir: &Path, settings: &Value) -> Result<()> {
    if !settings.is_object() {
        return Err(Error::InvalidSettings);
    }
    std::fs::create_dir_all(dir)?;
    let text = serde_json::to_string_pretty(settings).map_err(|_| Error::InvalidSettings)?;
    let temporary = dir.join(format!("{FILE_NAME}.tmp"));
    std::fs::write(&temporary, text)?;
    std::fs::rename(&temporary, dir.join(FILE_NAME))?;
    Ok(())
}

pub fn read_settings(dir: &Path) -> Value {
    parse_settings(std::fs::read_to_string(dir.join(FILE_NAME)).ok().as_deref())
}

const STATE_FILE: &str = "state.json";

pub const RECENT_LIMIT: usize = 12;

pub fn push_recent(recent: Vec<String>, folder: &str) -> Vec<String> {
    std::iter::once(folder.to_string())
        .chain(recent.into_iter().filter(|path| path != folder))
        .take(RECENT_LIMIT)
        .collect()
}

fn read_state(dir: &Path) -> Value {
    std::fs::read_to_string(dir.join(STATE_FILE))
        .ok()
        .and_then(|text| serde_json::from_str(&text).ok())
        .unwrap_or(Value::Null)
}

fn stored_recent(state: &Value) -> Vec<String> {
    state
        .get("recentFolders")
        .and_then(Value::as_array)
        .map(|items| {
            items
                .iter()
                .filter_map(|item| item.as_str().map(String::from))
                .collect()
        })
        .unwrap_or_default()
}

pub fn recent_folders(dir: &Path) -> Vec<PathBuf> {
    stored_recent(&read_state(dir))
        .into_iter()
        .map(PathBuf::from)
        .filter(|folder| folder.is_dir())
        .collect()
}

pub fn remember_last_folder(dir: &Path, folder: &Path) -> Result<()> {
    std::fs::create_dir_all(dir)?;
    let path = folder.to_string_lossy();
    let recent = push_recent(stored_recent(&read_state(dir)), &path);
    let state = serde_json::json!({ "lastFolder": path, "recentFolders": recent });
    let temporary = dir.join(format!("{STATE_FILE}.tmp"));
    std::fs::write(&temporary, state.to_string())?;
    std::fs::rename(&temporary, dir.join(STATE_FILE))?;
    Ok(())
}

pub fn last_folder(dir: &Path) -> Option<PathBuf> {
    let text = std::fs::read_to_string(dir.join(STATE_FILE)).ok()?;
    let state: Value = serde_json::from_str(&text).ok()?;
    let folder = PathBuf::from(state.get("lastFolder")?.as_str()?);
    folder.is_dir().then_some(folder)
}

#[tauri::command]
pub async fn load_settings() -> Result<Value> {
    Ok(read_settings(&config_dir()?))
}

#[tauri::command]
pub async fn save_settings(settings: Value) -> Result<()> {
    write_settings(&config_dir()?, &settings)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use tempfile::TempDir;

    #[test]
    fn keeps_recent_folders_newest_first_without_duplicates() {
        let recent = vec!["/b".to_string(), "/a".to_string()];
        assert_eq!(push_recent(recent, "/a"), ["/a", "/b"]);
        let many: Vec<String> = (0..20).map(|n| format!("/p{n}")).collect();
        let pushed = push_recent(many, "/new");
        assert_eq!(pushed.len(), RECENT_LIMIT);
        assert_eq!(pushed[0], "/new");
    }

    #[test]
    fn lists_only_recent_folders_that_still_exist() {
        let config = TempDir::new().expect("config");
        let first = TempDir::new().expect("first");
        let second = TempDir::new().expect("second");
        remember_last_folder(config.path(), first.path()).expect("first");
        remember_last_folder(config.path(), second.path()).expect("second");
        remember_last_folder(config.path(), first.path()).expect("again");
        assert_eq!(
            recent_folders(config.path()),
            [first.path().to_path_buf(), second.path().to_path_buf()]
        );
        drop(second);
        assert_eq!(recent_folders(config.path()), [first.path().to_path_buf()]);
        assert_eq!(last_folder(config.path()), Some(first.path().to_path_buf()));
    }

    #[test]
    fn remembers_the_last_folder_outside_the_settings_file() {
        let dir = TempDir::new().expect("temp dir");
        let config = dir.path().join("alchemide");
        let project = dir.path().join("project");
        std::fs::create_dir(&project).expect("project");

        remember_last_folder(&config, &project).expect("remember");

        assert_eq!(last_folder(&config), Some(project));
        assert_eq!(read_settings(&config), json!({}));
    }

    #[test]
    fn forgets_a_last_folder_that_no_longer_exists() {
        let dir = TempDir::new().expect("temp dir");
        let gone = dir.path().join("gone");
        remember_last_folder(dir.path(), &gone).expect("remember");
        assert_eq!(last_folder(dir.path()), None);
        assert_eq!(last_folder(&dir.path().join("missing")), None);
    }

    #[test]
    fn starts_empty_without_a_file() {
        assert_eq!(parse_settings(None), json!({}));
    }

    #[test]
    fn ignores_broken_or_non_object_files() {
        assert_eq!(parse_settings(Some("{ not json")), json!({}));
        assert_eq!(parse_settings(Some("[1, 2]")), json!({}));
    }

    #[test]
    fn round_trips_settings_through_the_config_folder() {
        let dir = TempDir::new().expect("temp dir");
        let folder = dir.path().join("alchemide");
        let settings = json!({ "theme": "Maré", "effects": { "surface": "solid" } });

        write_settings(&folder, &settings).expect("write");

        assert_eq!(read_settings(&folder), settings);
        assert!(!folder.join("settings.json.tmp").exists());
    }

    #[test]
    fn refuses_to_write_anything_but_an_object() {
        let dir = TempDir::new().expect("temp dir");
        assert!(matches!(
            write_settings(dir.path(), &json!("theme")),
            Err(Error::InvalidSettings)
        ));
    }
}
